import React, { useState, useRef } from 'react'
import { uploadImageForOCR, batchUploadImagesForOCR } from '../services/api'

const Upload = () => {
  const [uploadMode, setUploadMode] = useState('single') // single | batch
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [error, setError] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (validFiles.length === 0) {
      setError('请选择图片文件')
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
    
    setSelectedFiles(validFiles)
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">图片OCR识别</h1>
      
      {/* 上传模式选择 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setUploadMode('single')}
              className={`px-4 py-2 rounded-lg font-medium ${
                uploadMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              单文件上传
            </button>
            <button
              onClick={() => setUploadMode('batch')}
              className={`px-4 py-2 rounded-lg font-medium ${
                uploadMode === 'batch'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              批量上传
            </button>
          </div>
        </div>
      </div>

      {/* 文件上传区域 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-lg text-gray-900">
                  拖拽图片到此处，或点击选择文件
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  支持 JPG, PNG, BMP, TIFF, WEBP 格式，最大10MB
                  {uploadMode === 'batch' && '，最多10个文件'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple={uploadMode === 'batch'}
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                选择文件
              </button>
            </div>
          </div>

          {/* 已选择文件列表 */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">已选择文件：</h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 上传按钮 */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`w-full px-4 py-3 rounded-lg font-medium ${
                  isUploading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isUploading ? '识别中...' : '开始OCR识别'}
              </button>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* 识别结果 */}
      {uploadResult && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">识别结果</h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {uploadResult.message}
              </p>
              {uploadResult.data && (
                <p className="text-sm text-gray-600 mt-1">
                  共识别到 {uploadResult.data.total_questions || 0} 道题目
                </p>
              )}
            </div>

            {uploadResult.data?.questions && uploadResult.data.questions.length > 0 && (
              <div className="space-y-6">
                {uploadResult.data.questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        第{question.number}题
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {question.type === 'multiple_choice' ? '选择题' :
                         question.type === 'fill_blank' ? '填空题' :
                         question.type === 'true_false' ? '判断题' :
                         question.type === 'essay' ? '解答题' : '其他'}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-gray-800">{question.content}</p>
                      {question.full_content && question.full_content !== question.content && (
                        <p className="text-gray-600 mt-2 text-sm">{question.full_content}</p>
                      )}
                    </div>

                    {question.options && question.options.length > 0 && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <span className="font-medium text-gray-700">
                              {option.label}.
                            </span>
                            <span className="text-gray-800">{option.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {uploadResult.data?.results && (
              <div className="space-y-4">
                {uploadResult.data.results.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{result.filename}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        result.success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.success ? '成功' : '失败'}
                      </span>
                    </div>
                    
                    {result.success ? (
                      <p className="text-sm text-gray-600">
                        识别到 {result.total_questions} 道题目
                      </p>
                    ) : (
                      <p className="text-sm text-red-600">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 上传历史 */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">使用说明</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3 text-sm text-gray-600">
            <p>• 支持的图片格式：JPG、PNG、BMP、TIFF、WEBP</p>
            <p>• 单个文件大小限制：10MB</p>
            <p>• 批量上传最多支持：10个文件</p>
            <p>• 系统会自动识别题目类型：选择题、填空题、判断题、解答题</p>
            <p>• 识别结果可以手动编辑和保存</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Upload
