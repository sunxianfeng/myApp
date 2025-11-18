'use client'

import React, { useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
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
  fetchSupportedFormats
} from '@/lib/slices/uploadSlice'
import { AppDispatch, RootState } from '@/lib/store'

// Define UploadedFile interface locally since it's not exported
interface UploadedFile {
  id: string
  file: File
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
  
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single')
  const [dragActive, setDragActive] = useState(false)
  const [imageClicked, setImageClicked] = useState(false)
  const [docsClicked, setDocsClicked] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('auto')
  const [originalFiles, setOriginalFiles] = useState<{ [key: string]: File }>({})
  const [result, setResult] = useState<any>(null)
  
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
    validFiles.forEach(file => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      // Store original file for image preview
      setOriginalFiles(prev => ({ ...prev, [id]: file }))
      
      dispatch(addFile({
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
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

    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockResult = {
        message: '上传成功',
        data: {
          total_questions: files.length * 5, // 模拟每文件5道题
          questions: files.map((file, index) => ({
            number: index + 1,
            type: 'multiple_choice',
            content: `这是从文件 ${file.name} 中识别的题目内容`,
            full_content: `这是从文件 ${file.name} 中识别的完整题目内容，包含更多详细信息...`,
            options: [
              { label: 'A', content: '选项A的内容' },
              { label: 'B', content: '选项B的内容' },
              { label: 'C', content: '选项C的内容' },
              { label: 'D', content: '选项D的内容' }
            ]
          }))
        }
      }
      
      setResult(mockResult)
      dispatch(clearFiles())
    } catch (err: any) {
      alert(err.message || '上传失败')
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

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-header">
          <h1>OCR File Upload</h1>
          <p>Upload images and documents to extract text.</p>
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

          {/* Drop Zone */}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Select Documents
              </button>
            </div>
          </div>
          
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
        {files.length > 0 && (
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
                <div className="progress-bar">
                  <div className="progress" style={{width: isUploading ? '60%' : '0%'}}></div>
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
        <div className="action-bar">
          <button 
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="btn btn-primary"
            style={{backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: '1px solid var(--primary)', width: '33.33%', maxWidth: '200px'}}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{marginRight: '0.5rem'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isUploading ? 'Processing...' : 'Upload and Process'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="results-container">
          <div className="results-header">
            <h2>识别结果</h2>
          </div>
          <div className="results-content">
            <div className="mb-4">
              <p style={{color: 'var(--muted-foreground)'}}>
                {result.message}
              </p>
              {result.data && (
                <p style={{color: 'var(--muted-foreground)', marginTop: '0.5rem'}}>
                  共识别到 {result.data.total_questions || 0} 道题目
                </p>
              )}
            </div>

            {result.data?.questions && result.data.questions.length > 0 && (
              <div>
                {result.data.questions.map((question: any, index: number) => (
                  <div key={index} className="question-item">
                    <div className="question-header">
                      <h3 className="question-number">
                        第{question.number}题
                      </h3>
                      <span className="question-type">
                        {question.type === 'multiple_choice' ? '选择题' :
                         question.type === 'fill_blank' ? '填空题' :
                         question.type === 'true_false' ? '判断题' :
                         question.type === 'essay' ? '解答题' : '其他'}
                      </span>
                    </div>
                    
                    <div className="question-content">
                      {question.content}
                      {question.full_content && question.full_content !== question.content && (
                        <div style={{marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--muted-foreground)'}}>
                          {question.full_content}
                        </div>
                      )}
                    </div>

                    {question.options && question.options.length > 0 && (
                      <div className="question-options">
                        {question.options.map((option: any, optIndex: number) => (
                          <div key={optIndex} className="option-item">
                            <span className="option-label">
                              {option.label}.
                            </span>
                            <span className="option-text">{option.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {result.data?.results && (
              <div>
                {result.data.results.map((resultItem: any, index: number) => (
                  <div key={index} className="question-item">
                    <div className="question-header">
                      <h3 className="question-number">{resultItem.filename}</h3>
                      <span className={`question-type ${resultItem.success ? '' : 'bg-red-100 text-red-800'}`}>
                        {resultItem.success ? '成功' : '失败'}
                      </span>
                    </div>
                    
                    {resultItem.success ? (
                      <p style={{color: 'var(--muted-foreground)'}}>
                        识别到 {resultItem.total_questions} 道题目
                      </p>
                    ) : (
                      <p style={{color: 'var(--destructive)'}}>{resultItem.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Upload
