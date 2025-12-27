import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// API 配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// 创建 axios 实例
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 在客户端获取 token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    // 处理 401 未授权错误
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    
    // 处理网络错误
    if (!error.response) {
      console.error('Network Error:', error.message)
      return Promise.reject(new Error('网络连接失败，请检查网络设置'))
    }
    
    // 处理其他错误 - FastAPI returns {detail: "message"}
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || '请求失败'
    console.error(`API Error [${error.response?.status}]:`, errorMessage, error.config?.url)
    return Promise.reject(new Error(errorMessage))
  }
)

// OCR 相关 API
export const uploadImageForOCR = async (file: File, signal?: AbortSignal): Promise<any> => {
  const formData = new FormData()
  formData.append('file', file)
  
  return await api.post('/v1/ocr/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    signal,
  })
}

export const batchUploadImagesForOCR = async (files: File[], signal?: AbortSignal): Promise<any> => {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  
  return await api.post('/v1/ocr/batch-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    signal,
  })
}

export const extractTextFromImage = async (fileId: string): Promise<any> => {
  return await api.get(`/v1/ocr/text-extract/${fileId}`)
}

export const getSupportedFormats = async (): Promise<any> => {
  return await api.get('/v1/ocr/supported-formats')
}

// 认证相关 API
export const login = async (credentials: { email: string; password: string }): Promise<any> => {
  return await api.post('/v1/auth/login', credentials)
}

export const register = async (userData: { 
  email: string; 
  password: string; 
  name: string 
}): Promise<any> => {
  return await api.post('/v1/auth/register', userData)
}

export const logout = async (): Promise<any> => {
  return await api.post('/v1/auth/logout')
}

export const refreshToken = async (): Promise<any> => {
  return await api.post('/v1/auth/refresh')
}

export const getCurrentUser = async (): Promise<any> => {
  return await api.get('/v1/auth/me')
}

// 问题管理相关 API
export const getQuestions = async (params?: {
  // Preferred (backend):
  skip?: number;
  limit?: number;
  search?: string;

  // Backwards compatibility (frontend callers):
  page?: number;
  category?: string;
}): Promise<any> => {
  const { page, limit, skip, search, category } = params || {}

  const computedSkip =
    typeof skip === 'number'
      ? skip
      : typeof page === 'number' && typeof limit === 'number'
        ? Math.max(0, (page - 1) * limit)
        : undefined

  // category is currently ignored by backend; keep it for future use without breaking callers.
  return await api.get('/v1/questions', {
    params: {
      skip: computedSkip,
      limit,
      search,
      category,
    },
  })
}

export const getQuestion = async (id: string): Promise<any> => {
  return await api.get(`/v1/questions/${id}`)
}

export const createQuestion = async (questionData: any): Promise<any> => {
  return await api.post('/v1/questions', questionData)
}

export const updateQuestion = async (id: string, questionData: any): Promise<any> => {
  return await api.put(`/v1/questions/${id}`, questionData)
}

export const deleteQuestion = async (id: string): Promise<any> => {
  return await api.delete(`/v1/questions/${id}`)
}

export const batchDeleteQuestions = async (ids: string[]): Promise<any> => {
  return await api.post('/v1/questions/batch-delete', { ids })
}

// 批量创建题目（用户确认后提交）
export const bulkCreateQuestions = async (payload: {
  document_title: string;
  filename: string;
  file_type?: string;
  file_size?: number;
  questions: Array<{
    number: number;
    content: string;
    full_content?: string;
    question_type: string;
    options?: Array<{ label: string; content: string }>;
  }>;
}): Promise<any> => {
  // NOTE: 临时用于联调/测试：跳过后端 Document 创建
  return await api.post('/v1/questions/bulk-create?skip_document=true', payload)
}

// 文档管理相关 API
export const getDocuments = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<any> => {
  return await api.get('/v1/documents', { params })
}

export const getDocument = async (id: string): Promise<any> => {
  return await api.get(`/v1/documents/${id}`)
}

export const createDocument = async (documentData: any): Promise<any> => {
  return await api.post('/v1/documents', documentData)
}

export const updateDocument = async (id: string, documentData: any): Promise<any> => {
  return await api.put(`/v1/documents/${id}`, documentData)
}

export const deleteDocument = async (id: string): Promise<any> => {
  return await api.delete(`/v1/documents/${id}`)
}

export const generateDocument = async (questionIds: string[]): Promise<any> => {
  return await api.post('/v1/documents/generate', { questionIds })
}

// 统计相关 API
export const getDashboardStats = async (): Promise<any> => {
  return await api.get('/v1/stats/dashboard')
}

export const getQuestionStats = async (params?: {
  period?: string;
}): Promise<any> => {
  return await api.get('/v1/stats/questions', { params })
}

export const getUploadStats = async (params?: {
  period?: string;
}): Promise<any> => {
  return await api.get('/v1/stats/uploads', { params })
}

// 文件上传相关 API
export const uploadFile = async (file: File, type: string = 'general'): Promise<any> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  
  return await api.post('/v1/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const deleteFile = async (fileId: string): Promise<any> => {
  return await api.delete(`/v1/upload/${fileId}`)
}

export const getFileUrl = async (fileId: string): Promise<any> => {
  return await api.get(`/v1/upload/${fileId}/url`)
}

// 导出相关 API
export const exportQuestions = async (params: {
  format: 'excel' | 'pdf' | 'word';
  questionIds?: string[];
}): Promise<any> => {
  return await api.post('/v1/export/questions', params, {
    responseType: 'blob',
  })
}

export const exportDocument = async (documentId: string, format: 'pdf' | 'word'): Promise<any> => {
  return await api.post(`/v1/export/document/${documentId}`, { format }, {
    responseType: 'blob',
  })
}

// 设置相关 API
export const getUserSettings = async (): Promise<any> => {
  return await api.get('/v1/settings/user')
}

export const updateUserSettings = async (settings: any): Promise<any> => {
  return await api.put('/v1/settings/user', settings)
}

export const getSystemSettings = async (): Promise<any> => {
  return await api.get('/v1/settings/system')
}

// 健康检查 API
export const healthCheck = async (): Promise<any> => {
  return await api.get('/v1/health')
}

// 错题本分类相关 API
export const getCategories = async (categoryType?: string): Promise<any> => {
  return await api.get('/v1/collections/categories', { 
    params: categoryType ? { category_type: categoryType } : {} 
  })
}

export const createCategory = async (categoryData: any): Promise<any> => {
  return await api.post('/v1/collections/categories', categoryData)
}

export const getCategory = async (categoryId: string): Promise<any> => {
  return await api.get(`/v1/collections/categories/${categoryId}`)
}

export const updateCategory = async (categoryId: string, categoryData: any): Promise<any> => {
  return await api.put(`/v1/collections/categories/${categoryId}`, categoryData)
}

export const deleteCategory = async (categoryId: string): Promise<any> => {
  return await api.delete(`/v1/collections/categories/${categoryId}`)
}

// 错题本相关 API
export const getCollections = async (params?: {
  category_id?: string;
  is_favorite?: boolean;
  skip?: number;
  limit?: number;
}): Promise<any> => {
  return await api.get('/v1/collections/collections', { params })
}

export const createCollection = async (collectionData: any): Promise<any> => {
  return await api.post('/v1/collections/collections', collectionData)
}

export const getCollection = async (collectionId: string, includeQuestions: boolean = true): Promise<any> => {
  return await api.get(`/v1/collections/collections/${collectionId}`, {
    params: { include_questions: includeQuestions }
  })
}

export const updateCollection = async (collectionId: string, collectionData: any): Promise<any> => {
  return await api.put(`/v1/collections/collections/${collectionId}`, collectionData)
}

export const deleteCollection = async (collectionId: string): Promise<any> => {
  return await api.delete(`/v1/collections/collections/${collectionId}`)
}

// 题目管理联合视图：一次性获取所有错题本 + 题目
export const getCollectionsWithQuestions = async (): Promise<any> => {
  return await api.get('/v1/collections/collections-with-questions')
}

// 错题本题目管理 API
export const addQuestionsToCollection = async (
  collectionId: string, 
  questionIds: string[]
): Promise<any> => {
  return await api.post(`/v1/collections/collections/${collectionId}/questions`, {
    question_ids: questionIds
  })
}

export const removeQuestionFromCollection = async (
  collectionId: string, 
  questionId: string
): Promise<any> => {
  return await api.delete(`/v1/collections/collections/${collectionId}/questions/${questionId}`)
}

export const updateQuestionInCollection = async (
  collectionId: string,
  questionId: string,
  updateData: { notes?: string; mastery_level?: number }
): Promise<any> => {
  return await api.put(
    `/v1/collections/collections/${collectionId}/questions/${questionId}`,
    updateData
  )
}

// 获取可用于分配的集合列表（简化版，不包含题目）
export const getCollectionsForAssignment = async (): Promise<any> => {
  return await api.get('/v1/collections/collections', {
    params: { include_questions: false }
  })
}

// 错题本统计 API
export const getCollectionStats = async (): Promise<any> => {
  return await api.get('/v1/collections/stats')
}

export default api
