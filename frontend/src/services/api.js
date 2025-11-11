import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// OCR相关API
export const uploadImageForOCR = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return await api.post('/v1/ocr/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const batchUploadImagesForOCR = async (files) => {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  
  return await api.post('/v1/ocr/batch-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const extractTextFromImage = async (fileId) => {
  return await api.get(`/v1/ocr/text-extract/${fileId}`)
}

export const getSupportedFormats = async () => {
  return await api.get('/v1/ocr/supported-formats')
}

export default api
