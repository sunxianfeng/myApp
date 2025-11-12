import React, { useState, useRef } from 'react'
import { uploadImageForOCR, batchUploadImagesForOCR } from '../services/api'
import '../styles/upload.css'

const Upload = () => {
  const [uploadMode, setUploadMode] = useState('single') // single | batch
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [error, setError] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('auto')
  const [imageClicked, setImageClicked] = useState(false)
  const [docsClicked, setDocsClicked] = useState(false)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const docsInputRef = useRef(null)

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') || 
      file.type === 'application/pdf' ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/zip'
    )
    
    if (validFiles.length === 0) {
      setError('请选择支持的文件格式')
      return
    }
    
    if (uploadMode === 'single' && validFiles.length > 1) {
      setError('单文件模式只能选择一个文件')
      return
    }
    
    if (uploadMode === 'batch' && validFiles.length > 10) {
      setError('批量上传最多支持10个文件')
      return
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles])
    setError(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files)
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('请先选择文件')
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadResult(null)

    try {
      let result
      if (uploadMode === 'single') {
        result = await uploadImageForOCR(selectedFiles[0])
      } else {
        result = await batchUploadImagesForOCR(selectedFiles)
      }
      
      setUploadResult(result)
      setSelectedFiles([])
    } catch (err) {
      setError(err.message || '上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].includes(extension)) return 'image'
    if (extension === 'pdf') return 'file-text'
    if (['doc', 'docx'].includes(extension)) return 'file-text'
    if (['zip', 'rar', '7z'].includes(extension)) return 'file-archive'
    return 'file'
  }

  const isImage = (file) => {
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
        {selectedFiles.length > 0 && (
          <div className="file-queue">
            <h3>File Queue</h3>
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-preview">
                  {isImage(file) ? (
                    <img src={URL.createObjectURL(file)} alt={file.name} />
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
                <div className="remove-btn" onClick={() => removeFile(index)}>
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
            disabled={isUploading || selectedFiles.length === 0}
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
      {uploadResult && (
        <div className="results-container">
          <div className="results-header">
            <h2>识别结果</h2>
          </div>
          <div className="results-content">
            <div className="mb-4">
              <p style={{color: 'var(--muted-foreground)'}}>
                {uploadResult.message}
              </p>
              {uploadResult.data && (
                <p style={{color: 'var(--muted-foreground)', marginTop: '0.5rem'}}>
                  共识别到 {uploadResult.data.total_questions || 0} 道题目
                </p>
              )}
            </div>

            {uploadResult.data?.questions && uploadResult.data.questions.length > 0 && (
              <div>
                {uploadResult.data.questions.map((question, index) => (
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
                        {question.options.map((option, optIndex) => (
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

            {uploadResult.data?.results && (
              <div>
                {uploadResult.data.results.map((result, index) => (
                  <div key={index} className="question-item">
                    <div className="question-header">
                      <h3 className="question-number">{result.filename}</h3>
                      <span className={`question-type ${result.success ? '' : 'bg-red-100 text-red-800'}`}>
                        {result.success ? '成功' : '失败'}
                      </span>
                    </div>
                    
                    {result.success ? (
                      <p style={{color: 'var(--muted-foreground)'}}>
                        识别到 {result.total_questions} 道题目
                      </p>
                    ) : (
                      <p style={{color: 'var(--destructive)'}}>{result.error}</p>
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
