'use client'

import './upload-neobrutalism.css'
import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { 
  addFile, 
  removeFile, 
  updateFileStatus, 
  updateFileProgress, 
  setFileError, 
  clearFiles, 
  clearError,
  uploadFile,
  uploadFiles,
  fetchSupportedFormats,
  setUploadResult,
  clearUploadResult
} from '@/lib/slices/uploadSlice'
import { AppDispatch, RootState } from '@/lib/store'
import { uploadImageForOCR, batchUploadImagesForOCR } from '@/lib/api'

// Define UploadedFile interface locally since it's not exported
interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  extractedText?: string
  confidence?: number
  uploadedAt: string
}

const Upload = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { files, isUploading, error } = useSelector((state: RootState) => state.upload)
  const router = useRouter()
  
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single')
  const [dragActive, setDragActive] = useState(false)
  const [imageClicked, setImageClicked] = useState(false)
  const [docsClicked, setDocsClicked] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('auto')
  const [originalFiles, setOriginalFiles] = useState<{ [key: string]: File }>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    dispatch(clearUploadResult())
  }, [dispatch])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const docsInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (fileList: FileList) => {
    const validFiles = Array.from(fileList).filter(file => 
      file.type.startsWith('image/') || 
      file.type === 'application/pdf' ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/zip'
    )
    
    if (validFiles.length === 0) {
      alert('请选择支持的文件格式')
      return
    }
    
    if (uploadMode === 'single' && validFiles.length > 1) {
      alert('单文件模式只能选择一个文件')
      return
    }
    
    if (uploadMode === 'batch' && validFiles.length > 10) {
      alert('批量上传最多支持10个文件')
      return
    }
    
    // Convert File objects to UploadedFile objects and add to Redux
    validFiles.forEach(fileObj => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      // Store original File separately to avoid non-serializable Redux state
      setOriginalFiles(prev => ({ ...prev, [id]: fileObj }))

      dispatch(addFile({
        id,
        name: fileObj.name,
        size: fileObj.size,
        type: fileObj.type,
        status: 'pending',
        progress: 0,
        uploadedAt: new Date().toISOString(),
      }))
    })
    
    dispatch(clearError())
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
  }

  const removeFileFromList = (index: number) => {
    const fileToRemove = files[index]
    dispatch(removeFile(fileToRemove.id))
    // Clean up original file from state
    if (fileToRemove) {
      setOriginalFiles(prev => {
        const newFiles = { ...prev }
        delete newFiles[fileToRemove.id]
        return newFiles
      })
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('请先选择文件')
      return
    }

    setIsAnalyzing(true)

    try {
      // Build array of actual File objects (kept in local `originalFiles`) matching Redux metadata order
      const filesToUpload: File[] = files.map(f => originalFiles[f.id]).filter(Boolean)

      if (filesToUpload.length === 0) {
        alert('未找到需要上传的文件')
        return
      }

      // Set status to uploading for UX
      files.forEach(meta => {
        dispatch(updateFileStatus({ id: meta.id, status: 'uploading', progress: 0 }))
      })

      let result: any = null

      if (uploadMode === 'single') {
        // uploadImageForOCR expects a single File
        const file = filesToUpload[0]
        const response = await uploadImageForOCR(file)
        // response already returns parsed data via api interceptor
        result = response

        // mark processed
        files.forEach(meta => {
          dispatch(updateFileStatus({ id: meta.id, status: 'processing', progress: 100 }))
        })
      } else {
        // batch mode
        const response = await batchUploadImagesForOCR(filesToUpload)
        result = response

        // mark processed
        files.forEach(meta => {
          dispatch(updateFileStatus({ id: meta.id, status: 'processing', progress: 100 }))
        })
      }

      // Save result into Redux for result page and clear queue
      dispatch(setUploadResult(result))
      dispatch(clearFiles())
      setOriginalFiles({})
      router.push('/app/upload/result')
    } catch (err: any) {
      // Try to set file-level error if possible
      const msg = err?.message || '上传失败'
      alert(msg)
      files.forEach(meta => {
        dispatch(setFileError({ id: meta.id, error: msg }))
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].includes(extension)) return 'image'
    if (extension === 'pdf') return 'file-text'
    if (['doc', 'docx'].includes(extension)) return 'file-text'
    if (['zip', 'rar', '7z'].includes(extension)) return 'file-archive'
    return 'file'
  }

  const isImage = (file: UploadedFile): boolean => {
    return file.type.startsWith('image/')
  }

  const showProcessingIndicator = isUploading || isAnalyzing

  return (
    <div className="upload-page">
      <style jsx>{`
        @keyframes scanMove {
          0% {
            top: 30%;
            opacity: 0.5;
          }
          50% {
            top: 50%;
            opacity: 1;
          }
          100% {
            top: 70%;
            opacity: 0.5;
          }
        }
      `}</style>
      <div className="upload-container">
        {/* Improved Header with Breadcrumb */}
        <div className="upload-header">
          {/* Breadcrumb removed */}
          <h1 style={{ fontSize: '2rem' }}>OCR题目识别</h1>
          <p>上传图片和文档以提取题目内容</p>
        </div>

        {/* Mode Selection */}
        <div className="upload-section">
          <div className="mode-selector">
            <button
              onClick={() => setUploadMode('single')}
              className={`mode-btn ${uploadMode === 'single' ? 'active' : ''}`}
            >
              单文件上传
            </button>
            <button
              onClick={() => setUploadMode('batch')}
              className={`mode-btn ${uploadMode === 'batch' ? 'active' : ''}`}
            >
              批量上传
            </button>
          </div>

          {/* Conditionally render Drop Zone or Processing Indicator */}
          {showProcessingIndicator ? (
            <div 
              className="ocr-processing-indicator" 
              role="status" 
              aria-live="polite"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                padding: '4rem 2rem',
                width: '100%',
                margin: '0 auto',
                textAlign: 'center',
                minHeight: '500px',
                backgroundColor: '#F9FAFB',
                border: '4px solid #000000',
              }}
            >
              <div 
                className="ocr-processing-visual"
                style={{
                  position: 'relative',
                  width: '280px',
                  height: '280px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  backgroundColor: '#FFE000',
                  borderRadius: '20px',
                  border: '4px solid #000000',
                  boxShadow: '8px 8px 0 rgba(0, 0, 0, 1)',
                  padding: '20px',
                }}
              >
                <svg 
                  viewBox="0 0 180 180" 
                  className="ocr-processing-svg" 
                  aria-hidden="true"
                  style={{
                    width: '240px',
                    height: '240px',
                    display: 'block',
                    borderRadius: '16px',
                    boxShadow: '10px 10px 0 rgba(0, 0, 0, 1)',
                    background: '#FFFFFF',
                    position: 'relative',
                    zIndex: 10,
                  }}
                >
                  <defs>
                    <linearGradient id="scanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(99, 102, 241, 0.15)" />
                      <stop offset="100%" stopColor="rgba(99, 102, 241, 0.45)" />
                    </linearGradient>
                  </defs>
                  {/* Card background */}
                  <rect x="30" y="30" width="120" height="120" rx="18" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
                  
                  {/* Text lines representing document content */}
                  <rect x="50" y="55" width="60" height="8" rx="4" fill="#6B7280" opacity="0.35" />
                  <rect x="50" y="75" width="40" height="8" rx="4" fill="#6B7280" opacity="0.2" />
                  <rect x="50" y="95" width="70" height="8" rx="4" fill="#6B7280" opacity="0.35" />
                  
                  {/* OCR detection indicator (arrow/pointer) */}
                  <path d="M65 120 L85 120 L75 135 Z" fill="rgba(14, 165, 233, 0.35)" />
                  
                  {/* Question marks or detected elements */}
                  <rect x="50" y="135" width="30" height="6" rx="3" fill="rgba(99, 102, 241, 0.35)" />
                  <rect x="90" y="135" width="30" height="6" rx="3" fill="rgba(99, 102, 241, 0.25)" />
                  
                  {/* Scanning overlay gradient */}
                  <rect x="30" y="30" width="120" height="120" rx="18" fill="url(#scanGradient)" opacity="0.35" />
                </svg>
                <div 
                  className="ocr-scan-line"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    width: '50%',
                    height: '4px',
                    background: 'linear-gradient(90deg, rgba(99, 102, 241, 0) 0%, rgba(99, 102, 241, 1) 50%, rgba(99, 102, 241, 0) 100%)',
                    borderRadius: '999px',
                    boxShadow: '0 0 16px rgba(99, 102, 241, 0.6), 0 0 8px rgba(99, 102, 241, 0.8)',
                    zIndex: 25,
                    pointerEvents: 'none',
                    transform: 'translateX(-50%)',
                    animation: 'scanMove 2.5s ease-in-out infinite',
                  }}
                />
                <span 
                  className="ocr-scan-corner corner-top-left"
                  style={{
                    position: 'absolute',
                    width: '28px',
                    height: '28px',
                    border: '5px solid #000000',
                    boxSizing: 'border-box',
                    background: 'transparent',
                    zIndex: 20,
                    top: '8px',
                    left: '8px',
                    borderRight: 'none',
                    borderBottom: 'none',
                  }}
                />
                <span 
                  className="ocr-scan-corner corner-top-right"
                  style={{
                    position: 'absolute',
                    width: '28px',
                    height: '28px',
                    border: '5px solid #000000',
                    boxSizing: 'border-box',
                    background: 'transparent',
                    zIndex: 20,
                    top: '8px',
                    right: '8px',
                    borderLeft: 'none',
                    borderBottom: 'none',
                  }}
                />
                <span 
                  className="ocr-scan-corner corner-bottom-left"
                  style={{
                    position: 'absolute',
                    width: '28px',
                    height: '28px',
                    border: '5px solid #000000',
                    boxSizing: 'border-box',
                    background: 'transparent',
                    zIndex: 20,
                    bottom: '8px',
                    left: '8px',
                    borderRight: 'none',
                    borderTop: 'none',
                  }}
                />
                <span 
                  className="ocr-scan-corner corner-bottom-right"
                  style={{
                    position: 'absolute',
                    width: '28px',
                    height: '28px',
                    border: '5px solid #000000',
                    boxSizing: 'border-box',
                    background: 'transparent',
                    zIndex: 20,
                    bottom: '8px',
                    right: '8px',
                    borderLeft: 'none',
                    borderTop: 'none',
                  }}
                />
              </div>
              <p 
                className="ocr-processing-label"
                style={{
                  fontWeight: 900,
                  fontSize: '1.75rem',
                  letterSpacing: '-0.02em',
                  color: '#000000',
                  textTransform: 'uppercase',
                  margin: '1rem 0 0.5rem 0',
                }}
              >
                图片解析中...
              </p>
              <p 
                className="ocr-processing-subtext"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#4B5563',
                  margin: 0,
                }}
              >
                我们正在为您解析图片内容，请稍候
              </p>
            </div>
          ) : (
            <div 
              className={`drop-zone ${dragActive ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="drop-zone-icon">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p>Drag & drop files here, or click to select</p>
              <div>
                <button
                  className="select-btn"
                  data-clicked={imageClicked}
                  onClick={() => {
                    setImageClicked(true)
                    imageInputRef.current?.click()
                  }}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{marginRight: '0.5rem'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Select Images
                </button>
                <button
                  className="select-btn"
                  data-clicked={docsClicked}
                  onClick={() => {
                    setDocsClicked(true)
                    docsInputRef.current?.click()
                  }}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{marginRight: '0.5rem'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Select Documents
                </button>
              </div>
            </div>
          )}
          
          <input
            ref={imageInputRef}
            type="file"
            multiple={uploadMode === 'batch'}
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <input
            ref={docsInputRef}
            type="file"
            multiple={uploadMode === 'batch'}
            accept=".pdf,.doc,.docx,.zip"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* File Queue */}
        {files.length > 0 && !showProcessingIndicator && (
          <div className="file-queue">
            <h3>File Queue</h3>
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-preview">
                  {isImage(file) && originalFiles[file.id] ? (
                    <img src={URL.createObjectURL(originalFiles[file.id])} alt={file.name} />
                  ) : (
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
                <div className="file-details">
                  <p>{file.name}</p>
                  <span>{formatFileSize(file.size)}</span>
                </div>
                <div className="remove-btn" onClick={() => removeFileFromList(index)}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="action-bar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {files.length > 0 && (
            <div className="neo-badge" style={{ alignSelf: 'center' }}>
              已准备好 {files.length} 个文件
            </div>
          )}
          <button 
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="neo-btn neo-btn-orange" 
            style={{ width: '100%', maxWidth: '400px', fontSize: '1.5rem', padding: '1.5rem' }}
          >
            {isUploading || isAnalyzing ? '🚀 处理中...' : '开始识别题目'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

    </div>
  )
}

export default Upload
