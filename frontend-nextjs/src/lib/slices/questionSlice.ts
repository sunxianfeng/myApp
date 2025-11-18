import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  batchDeleteQuestions,
} from '@/lib/api'
import type {
  Question,
  CreateQuestionData,
  UpdateQuestionData,
  QuestionFilters,
  PaginatedResponse,
  BatchOperationResult,
} from '@/types/api'

interface QuestionState {
  questions: Question[]
  currentQuestion: Question | null
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: QuestionFilters
  selectedQuestions: string[]
  searchQuery: string
}

const initialState: QuestionState = {
  questions: [],
  currentQuestion: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {},
  selectedQuestions: [],
  searchQuery: '',
}

// 获取问题列表
export const fetchQuestions = createAsyncThunk(
  'questions/fetchQuestions',
  async (params: QuestionFilters | undefined, { rejectWithValue }) => {
    try {
      const response: PaginatedResponse<Question> = await getQuestions(params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '获取问题列表失败')
    }
  }
)

// 获取单个问题
export const fetchQuestion = createAsyncThunk(
  'questions/fetchQuestion',
  async (id: string, { rejectWithValue }) => {
    try {
      const question: Question = await getQuestion(id)
      return question
    } catch (error: any) {
      return rejectWithValue(error.message || '获取问题详情失败')
    }
  }
)

// 创建问题
export const createNewQuestion = createAsyncThunk(
  'questions/createQuestion',
  async (questionData: CreateQuestionData, { rejectWithValue }) => {
    try {
      const question: Question = await createQuestion(questionData)
      return question
    } catch (error: any) {
      return rejectWithValue(error.message || '创建问题失败')
    }
  }
)

// 更新问题
export const updateExistingQuestion = createAsyncThunk(
  'questions/updateQuestion',
  async ({ id, data }: { id: string; data: UpdateQuestionData }, { rejectWithValue }) => {
    try {
      const question: Question = await updateQuestion(id, data)
      return question
    } catch (error: any) {
      return rejectWithValue(error.message || '更新问题失败')
    }
  }
)

// 删除问题
export const deleteExistingQuestion = createAsyncThunk(
  'questions/deleteQuestion',
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteQuestion(id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || '删除问题失败')
    }
  }
)

// 批量删除问题
export const deleteMultipleQuestions = createAsyncThunk(
  'questions/batchDeleteQuestions',
  async (ids: string[], { rejectWithValue }) => {
    try {
      const result: BatchOperationResult = await batchDeleteQuestions(ids)
      return { result, ids }
    } catch (error: any) {
      return rejectWithValue(error.message || '批量删除问题失败')
    }
  }
)

const questionSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    setCurrentQuestion: (state, action: PayloadAction<Question | null>) => {
      state.currentQuestion = action.payload
    },
    
    setSelectedQuestions: (state, action: PayloadAction<string[]>) => {
      state.selectedQuestions = action.payload
    },
    
    toggleQuestionSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const index = state.selectedQuestions.indexOf(id)
      if (index > -1) {
        state.selectedQuestions.splice(index, 1)
      } else {
        state.selectedQuestions.push(id)
      }
    },
    
    selectAllQuestions: (state) => {
      state.selectedQuestions = state.questions.map(q => q.id)
    },
    
    clearSelection: (state) => {
      state.selectedQuestions = []
    },
    
    setFilters: (state, action: PayloadAction<QuestionFilters>) => {
      state.filters = action.payload
    },
    
    updateFilter: (state, action: PayloadAction<{ key: keyof QuestionFilters; value: any }>) => {
      const { key, value } = action.payload
      state.filters[key] = value
    },
    
    clearFilters: (state) => {
      state.filters = {}
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    
    setPagination: (state, action: PayloadAction<Partial<QuestionState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    
    clearError: (state) => {
      state.error = null
    },
    
    resetQuestionState: (state) => {
      state.currentQuestion = null
      state.selectedQuestions = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取问题列表
      .addCase(fetchQuestions.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.isLoading = false
        state.questions = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // 获取单个问题
      .addCase(fetchQuestion.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchQuestion.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentQuestion = action.payload
      })
      .addCase(fetchQuestion.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // 创建问题
      .addCase(createNewQuestion.pending, (state) => {
        state.isCreating = true
        state.error = null
      })
      .addCase(createNewQuestion.fulfilled, (state, action) => {
        state.isCreating = false
        state.questions.unshift(action.payload)
        state.pagination.total += 1
      })
      .addCase(createNewQuestion.rejected, (state, action) => {
        state.isCreating = false
        state.error = action.payload as string
      })
      
      // 更新问题
      .addCase(updateExistingQuestion.pending, (state) => {
        state.isUpdating = true
        state.error = null
      })
      .addCase(updateExistingQuestion.fulfilled, (state, action) => {
        state.isUpdating = false
        const index = state.questions.findIndex(q => q.id === action.payload.id)
        if (index > -1) {
          state.questions[index] = action.payload
        }
        if (state.currentQuestion?.id === action.payload.id) {
          state.currentQuestion = action.payload
        }
      })
      .addCase(updateExistingQuestion.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload as string
      })
      
      // 删除问题
      .addCase(deleteExistingQuestion.pending, (state) => {
        state.isDeleting = true
        state.error = null
      })
      .addCase(deleteExistingQuestion.fulfilled, (state, action) => {
        state.isDeleting = false
        state.questions = state.questions.filter(q => q.id !== action.payload)
        state.selectedQuestions = state.selectedQuestions.filter(id => id !== action.payload)
        state.pagination.total -= 1
        if (state.currentQuestion?.id === action.payload) {
          state.currentQuestion = null
        }
      })
      .addCase(deleteExistingQuestion.rejected, (state, action) => {
        state.isDeleting = false
        state.error = action.payload as string
      })
      
      // 批量删除问题
      .addCase(deleteMultipleQuestions.pending, (state) => {
        state.isDeleting = true
        state.error = null
      })
      .addCase(deleteMultipleQuestions.fulfilled, (state, action) => {
        state.isDeleting = false
        const { result, ids } = action.payload
        
        if (result.success) {
          state.questions = state.questions.filter(q => !ids.includes(q.id))
          state.selectedQuestions = []
          state.pagination.total -= result.successful
        } else {
          state.error = result.errors?.join(', ') || '批量删除部分失败'
        }
      })
      .addCase(deleteMultipleQuestions.rejected, (state, action) => {
        state.isDeleting = false
        state.error = action.payload as string
      })
  },
})

export const {
  setCurrentQuestion,
  setSelectedQuestions,
  toggleQuestionSelection,
  selectAllQuestions,
  clearSelection,
  setFilters,
  updateFilter,
  clearFilters,
  setSearchQuery,
  setPagination,
  clearError,
  resetQuestionState,
} = questionSlice.actions

// 选择器
export const selectQuestions = (state: { questions: QuestionState }) => state.questions.questions
export const selectCurrentQuestion = (state: { questions: QuestionState }) => state.questions.currentQuestion
export const selectQuestionsLoading = (state: { questions: QuestionState }) => state.questions.isLoading
export const selectQuestionsCreating = (state: { questions: QuestionState }) => state.questions.isCreating
export const selectQuestionsUpdating = (state: { questions: QuestionState }) => state.questions.isUpdating
export const selectQuestionsDeleting = (state: { questions: QuestionState }) => state.questions.isDeleting
export const selectQuestionsError = (state: { questions: QuestionState }) => state.questions.error
export const selectQuestionsPagination = (state: { questions: QuestionState }) => state.questions.pagination
export const selectQuestionsFilters = (state: { questions: QuestionState }) => state.questions.filters
export const selectSelectedQuestions = (state: { questions: QuestionState }) => state.questions.selectedQuestions
export const selectSearchQuery = (state: { questions: QuestionState }) => state.questions.searchQuery

// 复合选择器
export const selectFilteredQuestions = (state: { questions: QuestionState }) => {
  const { questions, searchQuery } = state.questions
  
  if (!searchQuery.trim()) {
    return questions
  }
  
  const query = searchQuery.toLowerCase()
  return questions.filter(question =>
    question.title.toLowerCase().includes(query) ||
    question.content.toLowerCase().includes(query) ||
    question.category.toLowerCase().includes(query) ||
    question.tags.some(tag => tag.toLowerCase().includes(query))
  )
}

export const selectSelectedQuestionsCount = (state: { questions: QuestionState }) => 
  state.questions.selectedQuestions.length

export const selectIsAllSelected = (state: { questions: QuestionState }) => {
  const { questions, selectedQuestions } = state.questions
  return questions.length > 0 && selectedQuestions.length === questions.length
}

export const selectIsSomeSelected = (state: { questions: QuestionState }) => {
  const { selectedQuestions } = state.questions
  return selectedQuestions.length > 0
}

export default questionSlice.reducer
