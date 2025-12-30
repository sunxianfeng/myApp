'use client'

import './upload-neobrutalism.css'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { backgroundTaskManager } from '@/lib/backgroundTaskManager'
import { uploadImageForOCR, batchUploadImagesForOCR } from '@/lib/api'
import { STORAGE_KEYS as IMPORTED_STORAGE_KEYS, loadFromStorage, saveToStorage, clearStorage } from '@/lib/slices/uploadSlice'
import NeobrutalDialog from '@/components/common/NeobrutalDialog'

// Provide a safe fallback in case the imported STORAGE_KEYS is undefined due to a circular import
const STORAGE_KEYS = (typeof IMPORTED_STORAGE_KEYS !== 'undefined' && IMPORTED_STORAGE_KEYS) ? IMPORTED_STORAGE_KEYS : {
  TASK_ID: 'ocr_task_id',
  TASK_STATUS: 'ocr_task_status',
  TASK_RESULT: 'ocr_task_result',
  TASK_TIMESTAMP: 'ocr_task_timestamp',
}

// Define UploadedFile interface locally
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
  const router = useRouter()
  const pathname = usePathname()
  
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single')
  const [dragActive, setDragActive] = useState(false)
  const [imageClicked, setImageClicked] = useState(false)
  const [docsClicked, setDocsClicked] = useState(false)
  const [originalFiles, setOriginalFiles] = useState<{ [key: string]: File }>({})
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showWaitingMessage, setShowWaitingMessage] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState<string | undefined>(undefined)
  const [dialogMessage, setDialogMessage] = useState<string | undefined>(undefined)
  const [dialogActionText, setDialogActionText] = useState<string | undefined>(undefined)

  // Simple persistent debug logger that appends messages into localStorage
  const appendDebug = (key: string, ...parts: any[]) => {
    try {
      if (typeof window === 'undefined') return
      const k = key
      const prev = JSON.parse(localStorage.getItem(k) || '[]')
      prev.push({ ts: Date.now(), payload: parts })
      localStorage.setItem(k, JSON.stringify(prev))
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    setMounted(true)
    return () => {
      setMounted(false)
    }
  }, [])

  // Restore background task UI when navigating back to this page
  useEffect(() => {
    const taskId = loadFromStorage(STORAGE_KEYS.TASK_ID)
    const taskStatus = loadFromStorage(STORAGE_KEYS.TASK_STATUS)
    const taskResult = loadFromStorage(STORAGE_KEYS.TASK_RESULT)
    const timestamp = loadFromStorage(STORAGE_KEYS.TASK_TIMESTAMP)

    const isTaskExpired = timestamp && Date.now() - timestamp > 30 * 60 * 1000
    if (isTaskExpired) {
      clearStorage([STORAGE_KEYS.TASK_ID, STORAGE_KEYS.TASK_STATUS, STORAGE_KEYS.TASK_RESULT, STORAGE_KEYS.TASK_TIMESTAMP])
      return
    }

    if (taskStatus === 'running' && typeof taskId === 'string' && taskId) {
      setIsAnalyzing(true)
      setShowWaitingMessage(true)
      setCurrentTaskId(taskId)

      // If the task already completed while we were away, subscription won't replay.
      // Read/poll the authoritative task state from backgroundTaskManager.
      const immediateTask = backgroundTaskManager.getTask(taskId)
      if (immediateTask?.status === 'completed' && immediateTask.result) {
        saveToStorage(STORAGE_KEYS.TASK_RESULT, immediateTask.result)
        saveToStorage(STORAGE_KEYS.TASK_STATUS, 'completed')
        saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
        console.log('[upload] immediateTask completed, result:', immediateTask.result)
        appendDebug('debug_upload_logs', '[upload] immediateTask completed', immediateTask.result)
        router.push('/app/upload/result')
        return
      }

      if (immediateTask?.status === 'failed') {
        saveToStorage(STORAGE_KEYS.TASK_STATUS, 'failed')
        saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
        return
      }

      // Keep polling until we have a definitive outcome.
      return backgroundTaskManager.pollForCompletion(
        taskId,
        (realResult) => {
          saveToStorage(STORAGE_KEYS.TASK_RESULT, realResult)
          saveToStorage(STORAGE_KEYS.TASK_STATUS, 'completed')
          saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
          console.log('[upload] polled result:', realResult)
          appendDebug('debug_upload_logs', '[upload] polled result', realResult)
          router.push('/app/upload/result')
        },
        (error) => {
          saveToStorage(STORAGE_KEYS.TASK_STATUS, 'failed')
          saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
          // Show styled dialog instead of native alert
          if (typeof window !== 'undefined') {
            const isTimeout = (error || '').toLowerCase().includes('time') || (error === 'Task timed out')
            setDialogTitle(isTimeout ? '任务超时' : '任务失败')
            setDialogMessage(isTimeout ? '任务已超过 60 秒，可能需要更长时间，您可以稍后在任务列表查看或重试。' : (error || '任务执行失败，请重试'))
            setDialogActionText(isTimeout ? '重试' : undefined)
            setDialogOpen(true)
          }
          setIsAnalyzing(false)
          setShowWaitingMessage(false)
          setCurrentTaskId(null)
        },
        60000 // 60 seconds timeout
      )
    }

    if (taskStatus === 'completed' && taskResult) {
      console.log('[upload] storage already completed, result:', taskResult)
      appendDebug('debug_upload_logs', '[upload] storage already completed', taskResult)
      router.push('/app/upload/result')
      return
    }

    if (taskStatus === 'failed') {
      clearStorage([STORAGE_KEYS.TASK_ID, STORAGE_KEYS.TASK_STATUS, STORAGE_KEYS.TASK_RESULT, STORAGE_KEYS.TASK_TIMESTAMP])
    }
  }, [router])

  // Listen for background task completion
  useEffect(() => {
    if (!currentTaskId) return

    const unsubscribe = backgroundTaskManager.subscribe(currentTaskId, (task) => {
      if (task.status === 'completed' && task.result) {
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('题目识别完成！', {
            body: `成功识别了图片中的内容，点击查看结果。`,
            icon: '/favicon.ico',
            requireInteraction: true
          })
        }

        // Only redirect if still on upload page AND component is mounted
        if (pathname === '/app/upload' && mounted) {
          // Save result for result page to pick up
          saveToStorage(STORAGE_KEYS.TASK_RESULT, task.result)
          saveToStorage(STORAGE_KEYS.TASK_STATUS, 'completed')
          saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
          router.push('/app/upload/result')
        }

        // Reset upload UI - only if mounted
        if (mounted) {
          setIsAnalyzing(false)
          setShowWaitingMessage(false)
          setCurrentTaskId(null)
          setFiles([])
        }
      } else if (task.status === 'failed') {
        saveToStorage(STORAGE_KEYS.TASK_STATUS, 'failed')
        saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())

        // Show error - only if mounted
        if (mounted) {
          setDialogTitle('识别失败')
          setDialogMessage(task.error || '识别失败')
          setDialogActionText(undefined)
          setDialogOpen(true)
          setIsAnalyzing(false)
          setShowWaitingMessage(false)
          setCurrentTaskId(null)
          setFiles(prev => prev.map(f => ({
            ...f,
            status: 'failed',
            error: task.error || '识别失败'
          })))
        }
      }
    })

    return () => unsubscribe()
  }, [currentTaskId, pathname, router, mounted])

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission)
      })
    }
  }, [])
  
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
    
    // Convert File objects to UploadedFile objects
    const newFiles: UploadedFile[] = validFiles.map(fileObj => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      // Store original File separately
      setOriginalFiles(prev => ({ ...prev, [id]: fileObj }))

      return {
        id,
        name: fileObj.name,
        size: fileObj.size,
        type: fileObj.type,
        status: 'pending',
        progress: 0,
        uploadedAt: new Date().toISOString(),
      }
    })

    setFiles(prev => [...prev, ...newFiles])
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

  const handleCancelUpload = () => {
    // Cancel background task
    if (currentTaskId) {
      backgroundTaskManager.cancelTask(currentTaskId)
    }

    clearStorage([STORAGE_KEYS.TASK_ID, STORAGE_KEYS.TASK_STATUS, STORAGE_KEYS.TASK_RESULT, STORAGE_KEYS.TASK_TIMESTAMP])
    
    setIsAnalyzing(false)
    setShowWaitingMessage(false)
    setCurrentTaskId(null)
    setFiles([])
    setOriginalFiles({})
  }

  const removeFileFromList = (index: number) => {
    const fileToRemove = files[index]
    if (!fileToRemove) return
    
    // Update files list
    setFiles(prev => prev.filter(f => f.id !== fileToRemove.id))
    
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
    // Show the detailed tip immediately (no delay)
    setShowWaitingMessage(true)

    const filesToUpload: File[] = files.map(f => originalFiles[f.id]).filter(Boolean)

    if (filesToUpload.length === 0) {
      alert('未找到需要上传的文件')
      setIsAnalyzing(false)
      return
    }

    const fileName = filesToUpload[0].name

    // Start background task using backgroundTaskManager
    // This will continue even if the component unmounts
    const taskId = await backgroundTaskManager.startTask(
      'ocr-upload',
      async () => {
        let result: any
        if (uploadMode === 'single') {
          result = await uploadImageForOCR(filesToUpload[0])
        } else {
          result = await batchUploadImagesForOCR(filesToUpload)
        }
        return result
      },
      {
        fileName,
        fileSize: filesToUpload[0].size
      }
    )

    saveToStorage(STORAGE_KEYS.TASK_ID, taskId)
    saveToStorage(STORAGE_KEYS.TASK_STATUS, 'running')
    saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
    setCurrentTaskId(taskId)

    // Note: We don't await the task - it runs in background
    // The task completion is handled by the useEffect above
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

  const showProcessingIndicator = isAnalyzing // Only use local state, not Redux state

  return (
    <div className="upload-page">
      <NeobrutalDialog
        open={dialogOpen}
        title={dialogTitle}
        message={dialogMessage}
        actionText={dialogActionText}
        onClose={() => setDialogOpen(false)}
        onAction={() => {
          // If user chooses to retry, re-trigger upload flow by redirecting back to upload page
          // or re-invoking handleUpload depending on state. We'll simply reload the page to allow retry.
          setDialogOpen(false)
          window.location.reload()
        }}
      />
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
          <p style={{ fontSize: '1.5rem', fontWeight: 500, margin: 0 }}>上传图片和文档以提取题目内容</p>
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
              className={`mode-btn ${uploadMode === 'batch' ? 'active' : ''} disabled`}
              disabled={true}
              title="批量上传功能即将推出"
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              批量上传（即将推出）
            </button>
          </div>

          {/* Conditionally render Drop Zone, File Queue, or Processing Indicator */}
          {showProcessingIndicator ? (
            <div 
              className="ocr-processing-container" 
              role="status" 
              aria-live="polite"
            >
              <div className="ocr-processing-content">
                <div className="ocr-processing-visual">
                  <svg 
                    viewBox="0 0 180 180" 
                    className="ocr-processing-svg" 
                    aria-hidden="true"
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
                  <div className="ocr-scan-line" />
                  <span className="ocr-scan-corner corner-top-left" />
                  <span className="ocr-scan-corner corner-top-right" />
                  <span className="ocr-scan-corner corner-bottom-left" />
                  <span className="ocr-scan-corner corner-bottom-right" />
                </div>
                
                {/* Dynamic status messages */}
                <div className="ocr-processing-messages">
                  {!showWaitingMessage && (
                    <p className="ocr-processing-label primary">
                      图片解析中...
                    </p>
                  )}

                  {showWaitingMessage && (
                    <div className="ocr-waiting-message">
                      <p className="ocr-processing-label secondary">
                        任务已上传，请稍等
                      </p>
                      <p className="ocr-processing-sublabel">
                        正在分析图片内容，预计需要 5-30 秒
                      </p>
                      <p className="ocr-processing-sublabel" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                        您可以离开此页面，任务将继续在后台运行
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : files.length > 0 ? (
            /* File Queue Section */
            <div className="file-queue" style={{ marginTop: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem' }}>文件队列 ({files.length})</h3>
                <button
                  onClick={() => {
                    setFiles([])
                    setOriginalFiles({})
                  }}
                  className="neo-btn"
                  style={{ 
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#FF6B6B',
                    color: 'white'
                  }}
                >
                  清空全部
                </button>
              </div>
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
          ) : (
            /* Drop Zone Section */
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
              <p style={{ fontSize: '1.125rem' }}>拖拽文件到此处，或点击选择文件</p>
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
                  选择图片
                </button>
                <button
                  className="select-btn"
                  data-clicked={docsClicked}
                  onClick={() => {
                    setDocsClicked(true)
                    docsInputRef.current?.click()
                  }}
                  disabled={true}
                  title="文档上传功能即将推出"
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{marginRight: '0.5rem'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  选择文档（即将推出）
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

        {/* Action Bar */}
        <div className="action-bar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isAnalyzing ? (
            <button 
              onClick={handleCancelUpload}
              className="neo-btn"
              style={{
                width: '100%',
                maxWidth: '400px',
                fontSize: '1.25rem',
                padding: '1.25rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: '2px solid #000',
                boxShadow: '4px 4px 0 #000',
                alignSelf: 'center'
              }}
            >
              取消任务
            </button>
          ) : (
            <button 
              onClick={handleUpload}
              disabled={isAnalyzing || files.length === 0}
              className="neo-btn neo-btn-orange" 
              style={{ 
                width: '100%', 
                maxWidth: '400px', 
                fontSize: '1rem', 
                padding: '1.25rem',
                alignSelf: 'center'
              }}
            >
              开始识别题目
            </button>
          )}
        </div>

        {/* Error Message */}
        {files.some(f => f.error) && (
          <div className="error-message">
            {files.find(f => f.error)?.error}
          </div>
        )}
      </div>

    </div>
  )
}

export default Upload
