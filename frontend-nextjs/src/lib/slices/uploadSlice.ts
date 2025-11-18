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
}

const initialState: UploadState = {
  files: [],
  isUploading: false,
  isProcessing: false,
  supportedFormats: [],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  totalProgress: 0,
  error: null,
  batchMode: false,
}

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
        file,
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
          file,
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
      state.files.push(action.payload)
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

export default uploadSlice.reducer
