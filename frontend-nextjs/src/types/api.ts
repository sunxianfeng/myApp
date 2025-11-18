// API 响应基础类型
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// 分页响应类型
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 用户相关类型
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
}

// 问题相关类型
export interface Question {
  id: string
  title: string
  content: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  options?: string[]
  correctAnswer?: string
  explanation?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CreateQuestionData {
  title: string
  content: string
  type: Question['type']
  category: string
  difficulty: Question['difficulty']
  options?: string[]
  correctAnswer?: string
  explanation?: string
  tags: string[]
}

export interface UpdateQuestionData extends Partial<CreateQuestionData> {}

export interface QuestionFilters {
  page?: number
  limit?: number
  search?: string
  category?: string
  type?: Question['type']
  difficulty?: Question['difficulty']
  tags?: string[]
}

// 模板相关类型
export interface Template {
  id: string
  name: string
  description: string
  type: 'exam' | 'quiz' | 'assignment'
  subject: string
  grade?: string
  duration?: number
  totalMarks?: number
  instructions?: string
  sections: TemplateSection[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface TemplateSection {
  id: string
  name: string
  description?: string
  questions: string[]
  marks: number
  timeLimit?: number
}

export interface CreateTemplateData {
  name: string
  description: string
  type: Template['type']
  subject: string
  grade?: string
  duration?: number
  totalMarks?: number
  instructions?: string
  sections: Omit<TemplateSection, 'id'>[]
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {}

export interface TemplateFilters {
  page?: number
  limit?: number
  search?: string
  type?: Template['type']
  subject?: string
}

// 文档相关类型
export interface Document {
  id: string
  title: string
  description?: string
  type: 'exam_paper' | 'worksheet' | 'study_material'
  templateId?: string
  questions: string[]
  content?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CreateDocumentData {
  title: string
  description?: string
  type: Document['type']
  templateId?: string
  questions: string[]
  content?: string
}

export interface UpdateDocumentData extends Partial<CreateDocumentData> {}

export interface DocumentFilters {
  page?: number
  limit?: number
  search?: string
  type?: Document['type']
  status?: Document['status']
}

// OCR 相关类型
export interface OCRUploadResponse {
  id: string
  filename: string
  size: number
  mimeType: string
  status: 'processing' | 'completed' | 'failed'
  extractedText?: string
  confidence?: number
  processedAt?: string
  createdAt: string
}

export interface ExtractedTextResponse {
  text: string
  confidence: number
  boundingBoxes?: BoundingBox[]
  language?: string
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
  text: string
  confidence: number
}

export interface SupportedFormatsResponse {
  formats: string[]
  maxSize: number
  maxFiles: number
}

// 统计相关类型
export interface DashboardStats {
  totalQuestions: number
  totalTemplates: number
  totalDocuments: number
  recentUploads: number
  questionsByCategory: CategoryStats[]
  questionsByDifficulty: DifficultyStats[]
  uploadTrend: TrendData[]
}

export interface CategoryStats {
  category: string
  count: number
  percentage: number
}

export interface DifficultyStats {
  difficulty: 'easy' | 'medium' | 'hard'
  count: number
  percentage: number
}

export interface TrendData {
  date: string
  count: number
}

export interface QuestionStats {
  total: number
  byCategory: CategoryStats[]
  byDifficulty: DifficultyStats[]
  byType: TypeStats[]
  createdAt: string[]
}

export interface TypeStats {
  type: Question['type']
  count: number
  percentage: number
}

export interface UploadStats {
  total: number
  successful: number
  failed: number
  byFormat: FormatStats[]
  trend: TrendData[]
}

export interface FormatStats {
  format: string
  count: number
  percentage: number
}

// 文件上传相关类型
export interface FileUploadResponse {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  url: string
  uploadedAt: string
}

export interface FileUrlResponse {
  url: string
  expiresAt?: string
}

// 导出相关类型
export interface ExportQuestionsParams {
  format: 'excel' | 'pdf' | 'word'
  questionIds?: string[]
  templateId?: string
  options?: ExportOptions
}

export interface ExportOptions {
  includeAnswers?: boolean
  includeExplanations?: boolean
  sortBy?: 'title' | 'difficulty' | 'category' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// 设置相关类型
export interface UserSettings {
  id: string
  userId: string
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  notifications: NotificationSettings
  preferences: UserPreferences
  updatedAt: string
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  uploadComplete: boolean
  processingComplete: boolean
  systemUpdates: boolean
}

export interface UserPreferences {
  defaultQuestionType: Question['type']
  defaultDifficulty: Question['difficulty']
  autoSave: boolean
  showHints: boolean
  compactView: boolean
}

export interface SystemSettings {
  id: string
  siteName: string
  siteDescription: string
  maxFileSize: number
  allowedFileTypes: string[]
  ocrEnabled: boolean
  registrationEnabled: boolean
  maintenanceMode: boolean
  version: string
  updatedAt: string
}

// 健康检查相关类型
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  services: ServiceStatus[]
}

export interface ServiceStatus {
  name: string
  status: 'up' | 'down'
  responseTime?: number
  lastCheck: string
}

// 错误相关类型
export interface ApiError {
  message: string
  code?: string
  details?: any
  timestamp: string
}

// 请求配置类型
export interface RequestConfig {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
}

// 批量操作类型
export interface BatchOperationResult {
  success: boolean
  total: number
  successful: number
  failed: number
  errors?: string[]
}

// 搜索相关类型
export interface SearchParams {
  query: string
  type?: 'questions' | 'templates' | 'documents'
  filters?: Record<string, any>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SearchResult<T> {
  items: T[]
  total: number
  query: string
  took: number
}
