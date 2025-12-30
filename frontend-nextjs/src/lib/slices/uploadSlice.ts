import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { 
  uploadImageForOCR, 
  batchUploadImagesForOCR, 
  extractTextFromImage,
  getSupportedFormats 
} from '@/lib/api'
import type { OCRUploadResponse, ExtractedTextResponse, SupportedFormatsResponse } from '@/types/api'

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

interface UploadState {
  files: UploadedFile[]
  isUploading: boolean
  isProcessing: boolean
  supportedFormats: string[]
  maxFileSize: number
  maxFiles: number
  totalProgress: number
  error: string | null
  batchMode: boolean
  latestResult: any | null
  backgroundTaskId: string | null
  backgroundTaskStatus: 'idle' | 'running' | 'completed' | 'failed'
}

// Helper functions for localStorage persistence
const STORAGE_KEYS = {
  TASK_ID: 'ocr_task_id',
  TASK_STATUS: 'ocr_task_status',
  TASK_RESULT: 'ocr_task_result',
  TASK_TIMESTAMP: 'ocr_task_timestamp',
}

const saveToStorage = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
    }
  }
}

const loadFromStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (e) {
      console.error('Failed to load from localStorage:', e)
      return null
    }
  }
  return null
}

const clearStorage = (keys: string[]) => {
  if (typeof window !== 'undefined') {
    keys.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (e) {
        console.error('Failed to clear from localStorage:', e)
      }
    })
  }
}

// Initialize state from localStorage if available
const loadInitialState = (): UploadState => {
  const taskId = loadFromStorage(STORAGE_KEYS.TASK_ID)
  const taskStatus = loadFromStorage(STORAGE_KEYS.TASK_STATUS)
  const taskResult = loadFromStorage(STORAGE_KEYS.TASK_RESULT)
  const timestamp = loadFromStorage(STORAGE_KEYS.TASK_TIMESTAMP)

  // Check if task is too old (older than 30 minutes)
  const isTaskExpired = timestamp && Date.now() - timestamp > 30 * 60 * 1000

  return {
    files: [],
    isUploading: false,
    isProcessing: false,
    supportedFormats: [],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    totalProgress: 0,
    error: null,
    batchMode: false,
    latestResult: !isTaskExpired ? taskResult : null,
    backgroundTaskId: !isTaskExpired ? taskId : null,
    backgroundTaskStatus: !isTaskExpired && taskStatus ? taskStatus : 'idle',
  }
}

const initialState: UploadState = loadInitialState()

// 获取支持的文件格式
export const fetchSupportedFormats = createAsyncThunk(
  'upload/fetchSupportedFormats',
  async (_, { rejectWithValue }) => {
    try {
      const response: SupportedFormatsResponse = await getSupportedFormats()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '获取支持的文件格式失败')
    }
  }
)

// 单个文件上传
export const uploadFile = createAsyncThunk(
  'upload/uploadFile',
  async (file: File, { rejectWithValue, dispatch }) => {
    try {
      // 创建上传记录
      const uploadId = Date.now().toString()
      dispatch(addFile({
        id: uploadId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
        uploadedAt: new Date().toISOString(),
      }))

      // 上传文件
      const response: OCRUploadResponse = await uploadImageForOCR(file)
      
      // 更新文件状态为处理中
      dispatch(updateFileStatus({ 
        id: uploadId, 
        status: 'processing',
        progress: 100 
      }))

      return {
        uploadId,
        response,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '文件上传失败')
    }
  }
)

// 批量文件上传
export const uploadFiles = createAsyncThunk(
  'upload/uploadFiles',
  async (files: File[], { rejectWithValue, dispatch }) => {
    try {
      // 添加所有文件到列表
      const uploadIds = files.map(file => {
        const uploadId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
        dispatch(addFile({
          id: uploadId,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending',
          progress: 0,
          uploadedAt: new Date().toISOString(),
        }))
        return uploadId
      })

      // 批量上传
      const response: OCRUploadResponse[] = await batchUploadImagesForOCR(files)
      
      // 更新所有文件状态
      response.forEach((item, index) => {
        dispatch(updateFileStatus({ 
          id: uploadIds[index], 
          status: 'processing',
          progress: 100 
        }))
      })

      return {
        uploadIds,
        responses: response,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '批量上传失败')
    }
  }
)

// 提取文本
export const extractText = createAsyncThunk(
  'upload/extractText',
  async ({ uploadId, fileId }: { uploadId: string; fileId: string }, { rejectWithValue, dispatch }) => {
    try {
      // 更新状态为处理中
      dispatch(updateFileStatus({ 
        id: uploadId, 
        status: 'processing' 
      }))

      const response: ExtractedTextResponse = await extractTextFromImage(fileId)
      
      return {
        uploadId,
        text: response.text,
        confidence: response.confidence,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '文本提取失败')
    }
  }
)

export const startUpload = createAsyncThunk(
  'upload/startUpload',
  async (
    {
      filesToUpload,
      uploadMode,
    }: {
      filesToUpload: File[]
      uploadMode: 'single' | 'batch'
    },
    { rejectWithValue, signal }
  ) => {
    // IMPORTANT: We explicitly ignore the signal to allow background uploads
    // Even though Redux provides it automatically, we don't use it
    try {
      let result: any
      if (uploadMode === 'single') {
        result = await uploadImageForOCR(filesToUpload[0])
      } else {
        result = await batchUploadImagesForOCR(filesToUpload)
      }
      return result
    } catch (err: any) {
      // Ignore abort signals - this is expected behavior for background tasks
      if (signal?.aborted || err?.name === 'AbortError' || err?.message?.includes('canceled')) {
        console.log('Upload continuation after unmount - ignoring abort')
        // Return a special marker instead of rejecting
        return rejectWithValue(null)
      }
      return rejectWithValue(err.message || 'Upload failed')
    }
  }
)

// 模拟上传进度（用于演示）
export const simulateUploadProgress = createAsyncThunk(
  'upload/simulateProgress',
  async ({ uploadId, duration }: { uploadId: string; duration: number }, { dispatch }) => {
    const steps = 10
    const stepDuration = duration / steps
    
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration))
      dispatch(updateFileProgress({ 
        id: uploadId, 
        progress: (i / steps) * 100 
      }))
    }
  }
)

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<UploadedFile>) => {
      // Only store serializable metadata from the payload. Some callers
      // may include a `file` property (a File object) which is
      // non-serializable and causes Redux Toolkit warnings. Pick the
      // allowed fields explicitly to avoid storing the raw File.
      const payload: any = action.payload || {}
      const sanitized: UploadedFile = {
        id: payload.id,
        name: payload.name,
        size: payload.size,
        type: payload.type,
        status: payload.status || 'pending',
        progress: payload.progress ?? 0,
        error: payload.error,
        extractedText: payload.extractedText,
        confidence: payload.confidence,
        uploadedAt: payload.uploadedAt || new Date().toISOString(),
      }

      state.files.push(sanitized)
      state.batchMode = state.files.length > 1
    },
    
    removeFile: (state, action: PayloadAction<string>) => {
      state.files = state.files.filter(file => file.id !== action.payload)
      state.batchMode = state.files.length > 1
    },
    
    updateFileStatus: (state, action: PayloadAction<{ 
      id: string; 
      status: UploadedFile['status']; 
      progress?: number 
    }>) => {
      const file = state.files.find(f => f.id === action.payload.id)
      if (file) {
        file.status = action.payload.status
        if (action.payload.progress !== undefined) {
          file.progress = action.payload.progress
        }
      }
    },
    
    updateFileProgress: (state, action: PayloadAction<{ 
      id: string; 
      progress: number 
    }>) => {
      const file = state.files.find(f => f.id === action.payload.id)
      if (file) {
        file.progress = action.payload.progress
      }
      
      // 更新总体进度
      const totalProgress = state.files.reduce((sum, file) => sum + file.progress, 0)
      state.totalProgress = state.files.length > 0 ? totalProgress / state.files.length : 0
    },
    
    updateFileWithExtractedText: (state, action: PayloadAction<{ 
      id: string; 
      text: string; 
      confidence: number 
    }>) => {
      const file = state.files.find(f => f.id === action.payload.id)
      if (file) {
        file.extractedText = action.payload.text
        file.confidence = action.payload.confidence
        file.status = 'completed'
      }
    },
    
    setFileError: (state, action: PayloadAction<{ 
      id: string; 
      error: string 
    }>) => {
      const file = state.files.find(f => f.id === action.payload.id)
      if (file) {
        file.status = 'failed'
        file.error = action.payload.error
      }
    },
    
    clearFiles: (state) => {
      state.files = []
      state.totalProgress = 0
      state.batchMode = false
    },
    
    clearError: (state) => {
      state.error = null
    },
    
    resetUpload: (state) => {
      state.files = []
      state.isUploading = false
      state.isProcessing = false
      state.totalProgress = 0
      state.error = null
      state.batchMode = false
      state.latestResult = null
    },

    setUploadResult: (state, action: PayloadAction<any>) => {
      state.latestResult = action.payload
    },

    clearUploadResult: (state) => {
      state.latestResult = null
      state.backgroundTaskId = null
      state.backgroundTaskStatus = 'idle'
      clearStorage([STORAGE_KEYS.TASK_ID, STORAGE_KEYS.TASK_STATUS, STORAGE_KEYS.TASK_RESULT, STORAGE_KEYS.TASK_TIMESTAMP])
    },

    setBackgroundTaskId: (state, action: PayloadAction<string | null>) => {
      state.backgroundTaskId = action.payload
      if (action.payload) {
        saveToStorage(STORAGE_KEYS.TASK_ID, action.payload)
        saveToStorage(STORAGE_KEYS.TASK_STATUS, 'running')
        saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
        state.backgroundTaskStatus = 'running'
      } else {
        clearStorage([STORAGE_KEYS.TASK_ID, STORAGE_KEYS.TASK_STATUS, STORAGE_KEYS.TASK_TIMESTAMP])
        state.backgroundTaskStatus = 'idle'
      }
    },

    setBackgroundTaskStatus: (state, action: PayloadAction<'idle' | 'running' | 'completed' | 'failed'>) => {
      state.backgroundTaskStatus = action.payload
      if (action.payload === 'completed' || action.payload === 'failed') {
        saveToStorage(STORAGE_KEYS.TASK_STATUS, action.payload)
      }
    },

    persistTaskResult: (state, action: PayloadAction<any>) => {
      state.latestResult = action.payload
      state.backgroundTaskStatus = 'completed'
      saveToStorage(STORAGE_KEYS.TASK_RESULT, action.payload)
      saveToStorage(STORAGE_KEYS.TASK_STATUS, 'completed')
      saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取支持的格式
      .addCase(fetchSupportedFormats.pending, (state) => {
        state.error = null
      })
      .addCase(fetchSupportedFormats.fulfilled, (state, action) => {
        state.supportedFormats = action.payload.formats
        state.maxFileSize = action.payload.maxSize
        state.maxFiles = action.payload.maxFiles
      })
      .addCase(fetchSupportedFormats.rejected, (state, action) => {
        state.error = action.payload as string
      })

      // 新的 startUpload thunk
      .addCase(startUpload.pending, (state) => {
        state.isUploading = true
        state.error = null
      })
      .addCase(startUpload.fulfilled, (state, action) => {
        state.isUploading = false
        state.isProcessing = false
        state.latestResult = action.payload
        state.backgroundTaskStatus = 'completed'
        // Persist result to localStorage
        saveToStorage(STORAGE_KEYS.TASK_RESULT, action.payload)
        saveToStorage(STORAGE_KEYS.TASK_STATUS, 'completed')
        saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
        // Clear files from queue on success
        state.files = []
        state.totalProgress = 0
      })
      .addCase(startUpload.rejected, (state, action) => {
        // Only update state for real errors, not for aborts
        // action.payload is undefined for aborted requests
        if (action.payload) {
          state.isUploading = false
          state.isProcessing = false
          state.error = action.payload as string
          state.backgroundTaskStatus = 'failed'
          saveToStorage(STORAGE_KEYS.TASK_STATUS, 'failed')
          saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
        } else {
          // Abort: don't update state, just reset uploading flags
          state.isUploading = false
          state.isProcessing = false
        }
      })
      
      // 单个文件上传
      .addCase(uploadFile.pending, (state) => {
        state.isUploading = true
        state.error = null
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.isUploading = false
        const { uploadId, response } = action.payload
        
        // 更新文件信息
        const file = state.files.find(f => f.id === uploadId)
        if (file) {
          file.id = response.id
          file.status = response.status === 'completed' ? 'completed' : 'processing'
          file.confidence = response.confidence
          file.extractedText = response.extractedText
        }
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.isUploading = false
        state.error = action.payload as string
      })
      
      // 批量文件上传
      .addCase(uploadFiles.pending, (state) => {
        state.isUploading = true
        state.error = null
      })
      .addCase(uploadFiles.fulfilled, (state, action) => {
        state.isUploading = false
        const { uploadIds, responses } = action.payload
        
        // 更新文件信息
        responses.forEach((response, index) => {
          const file = state.files.find(f => f.id === uploadIds[index])
          if (file) {
            file.id = response.id
            file.status = response.status === 'completed' ? 'completed' : 'processing'
            file.confidence = response.confidence
            file.extractedText = response.extractedText
          }
        })
      })
      .addCase(uploadFiles.rejected, (state, action) => {
        state.isUploading = false
        state.error = action.payload as string
      })
      
      // 文本提取
      .addCase(extractText.pending, (state) => {
        state.isProcessing = true
      })
      .addCase(extractText.fulfilled, (state, action) => {
        state.isProcessing = false
        const { uploadId, text, confidence } = action.payload
        
        const file = state.files.find(f => f.id === uploadId)
        if (file) {
          file.extractedText = text
          file.confidence = confidence
          file.status = 'completed'
        }
      })
      .addCase(extractText.rejected, (state, action) => {
        state.isProcessing = false
        state.error = action.payload as string
      })
  },
})

export const {
  addFile,
  removeFile,
  updateFileStatus,
  updateFileProgress,
  updateFileWithExtractedText,
  setFileError,
  clearFiles,
  clearError,
  resetUpload,
  setUploadResult,
  clearUploadResult,
} = uploadSlice.actions

// 选择器
export const selectUpload = (state: { upload: UploadState }) => state.upload
export const selectFiles = (state: { upload: UploadState }) => state.upload.files
export const selectIsUploading = (state: { upload: UploadState }) => state.upload.isUploading
export const selectIsProcessing = (state: { upload: UploadState }) => state.upload.isProcessing
export const selectTotalProgress = (state: { upload: UploadState }) => state.upload.totalProgress
export const selectUploadError = (state: { upload: UploadState }) => state.upload.error
export const selectSupportedFormats = (state: { upload: UploadState }) => state.upload.supportedFormats
export const selectBatchMode = (state: { upload: UploadState }) => state.upload.batchMode
export const selectUploadResult = (state: { upload: UploadState }) => state.upload.latestResult
export const selectBackgroundTaskId = (state: { upload: UploadState }) => state.upload.backgroundTaskId
export const selectBackgroundTaskStatus = (state: { upload: UploadState }) => state.upload.backgroundTaskStatus

export { STORAGE_KEYS, saveToStorage, loadFromStorage, clearStorage }

export default uploadSlice.reducer
