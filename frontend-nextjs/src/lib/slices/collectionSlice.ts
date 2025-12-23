import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCollections,
  createCollection,
  getCollection,
  updateCollection,
  deleteCollection,
  addQuestionsToCollection,
  removeQuestionFromCollection,
  updateQuestionInCollection,
  getCollectionStats
} from '@/lib/api'
import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
  Collection,
  CollectionCreate,
  CollectionUpdate,
  CollectionWithQuestions,
  QuestionInCollection,
  CollectionStatsResponse
} from '@/types/api'

interface CollectionState {
  categories: Category[]
  collections: Collection[]
  currentCollection: CollectionWithQuestions | null
  stats: CollectionStatsResponse | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  selectedQuestions: string[]
}

const initialState: CollectionState = {
  categories: [],
  collections: [],
  currentCollection: null,
  stats: null,
  isLoading: false,
  isSaving: false,
  error: null,
  selectedQuestions: []
}

// ==================== 分类操作 ====================

export const fetchCategories = createAsyncThunk(
  'collection/fetchCategories',
  async (categoryType?: string, { rejectWithValue }) => {
    try {
      const response = await getCategories(categoryType)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '获取分类失败')
    }
  }
)

export const addCategory = createAsyncThunk(
  'collection/addCategory',
  async (categoryData: CategoryCreate, { rejectWithValue }) => {
    try {
      const response = await createCategory(categoryData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '创建分类失败')
    }
  }
)

export const modifyCategory = createAsyncThunk(
  'collection/modifyCategory',
  async ({ id, data }: { id: string; data: CategoryUpdate }, { rejectWithValue }) => {
    try {
      const response = await updateCategory(id, data)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '更新分类失败')
    }
  }
)

export const removeCategory = createAsyncThunk(
  'collection/removeCategory',
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteCategory(id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || '删除分类失败')
    }
  }
)

// ==================== 错题本操作 ====================

export const fetchCollections = createAsyncThunk(
  'collection/fetchCollections',
  async (params?: {
    category_id?: string
    is_favorite?: boolean
    skip?: number
    limit?: number
  }, { rejectWithValue }) => {
    try {
      const response = await getCollections(params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '获取错题本失败')
    }
  }
)

export const addCollection = createAsyncThunk(
  'collection/addCollection',
  async (collectionData: CollectionCreate, { rejectWithValue }) => {
    try {
      const response = await createCollection(collectionData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '创建错题本失败')
    }
  }
)

export const fetchCollection = createAsyncThunk(
  'collection/fetchCollection',
  async ({ id, includeQuestions = true }: { id: string; includeQuestions?: boolean }, { rejectWithValue }) => {
    try {
      const response = await getCollection(id, includeQuestions)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '获取错题本详情失败')
    }
  }
)

export const modifyCollection = createAsyncThunk(
  'collection/modifyCollection',
  async ({ id, data }: { id: string; data: CollectionUpdate }, { rejectWithValue }) => {
    try {
      const response = await updateCollection(id, data)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '更新错题本失败')
    }
  }
)

export const removeCollection = createAsyncThunk(
  'collection/removeCollection',
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteCollection(id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || '删除错题本失败')
    }
  }
)

// ==================== 题目管理 ====================

export const addQuestionsToCol = createAsyncThunk(
  'collection/addQuestionsToCol',
  async ({ collectionId, questionIds }: { collectionId: string; questionIds: string[] }, { rejectWithValue }) => {
    try {
      const response = await addQuestionsToCollection(collectionId, questionIds)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '添加题目失败')
    }
  }
)

export const removeQuestionFromCol = createAsyncThunk(
  'collection/removeQuestionFromCol',
  async ({ collectionId, questionId }: { collectionId: string; questionId: string }, { rejectWithValue }) => {
    try {
      await removeQuestionFromCollection(collectionId, questionId)
      return { collectionId, questionId }
    } catch (error: any) {
      return rejectWithValue(error.message || '移除题目失败')
    }
  }
)

export const updateQuestionInCol = createAsyncThunk(
  'collection/updateQuestionInCol',
  async (
    { collectionId, questionId, data }: {
      collectionId: string
      questionId: string
      data: { notes?: string; mastery_level?: number }
    },
    { rejectWithValue }
  ) => {
    try {
      await updateQuestionInCollection(collectionId, questionId, data)
      return { collectionId, questionId, data }
    } catch (error: any) {
      return rejectWithValue(error.message || '更新题目信息失败')
    }
  }
)

// ==================== 统计信息 ====================

export const fetchCollectionStats = createAsyncThunk(
  'collection/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCollectionStats()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '获取统计信息失败')
    }
  }
)

const collectionSlice = createSlice({
  name: 'collection',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    
    setSelectedQuestions: (state, action: PayloadAction<string[]>) => {
      state.selectedQuestions = action.payload
    },
    
    toggleQuestionSelection: (state, action: PayloadAction<string>) => {
      const index = state.selectedQuestions.indexOf(action.payload)
      if (index > -1) {
        state.selectedQuestions.splice(index, 1)
      } else {
        state.selectedQuestions.push(action.payload)
      }
    },
    
    clearSelectedQuestions: (state) => {
      state.selectedQuestions = []
    },
    
    clearCurrentCollection: (state) => {
      state.currentCollection = null
    }
  },
  extraReducers: (builder) => {
    builder
      // 获取分类
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false
        state.categories = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // 添加分类
      .addCase(addCategory.pending, (state) => {
        state.isSaving = true
        state.error = null
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.isSaving = false
        state.categories.push(action.payload)
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.isSaving = false
        state.error = action.payload as string
      })
      
      // 更新分类
      .addCase(modifyCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(c => c.id === action.payload.id)
        if (index !== -1) {
          state.categories[index] = action.payload
        }
      })
      
      // 删除分类
      .addCase(removeCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c.id !== action.payload)
      })
      
      // 获取错题本列表
      .addCase(fetchCollections.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.isLoading = false
        state.collections = action.payload
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // 添加错题本
      .addCase(addCollection.pending, (state) => {
        state.isSaving = true
        state.error = null
      })
      .addCase(addCollection.fulfilled, (state, action) => {
        state.isSaving = false
        state.collections.push(action.payload)
      })
      .addCase(addCollection.rejected, (state, action) => {
        state.isSaving = false
        state.error = action.payload as string
      })
      
      // 获取错题本详情
      .addCase(fetchCollection.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCollection.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentCollection = action.payload
      })
      .addCase(fetchCollection.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // 更新错题本
      .addCase(modifyCollection.pending, (state) => {
        state.isSaving = true
      })
      .addCase(modifyCollection.fulfilled, (state, action) => {
        state.isSaving = false
        const index = state.collections.findIndex(c => c.id === action.payload.id)
        if (index !== -1) {
          state.collections[index] = action.payload
        }
        if (state.currentCollection && state.currentCollection.id === action.payload.id) {
          state.currentCollection = { ...state.currentCollection, ...action.payload }
        }
      })
      .addCase(modifyCollection.rejected, (state, action) => {
        state.isSaving = false
        state.error = action.payload as string
      })
      
      // 删除错题本
      .addCase(removeCollection.fulfilled, (state, action) => {
        state.collections = state.collections.filter(c => c.id !== action.payload)
        if (state.currentCollection && state.currentCollection.id === action.payload) {
          state.currentCollection = null
        }
      })
      
      // 添加题目到错题本
      .addCase(addQuestionsToCol.pending, (state) => {
        state.isSaving = true
        state.error = null
      })
      .addCase(addQuestionsToCol.fulfilled, (state) => {
        state.isSaving = false
        // 清空选中的题目
        state.selectedQuestions = []
      })
      .addCase(addQuestionsToCol.rejected, (state, action) => {
        state.isSaving = false
        state.error = action.payload as string
      })
      
      // 从错题本移除题目
      .addCase(removeQuestionFromCol.fulfilled, (state, action) => {
        if (state.currentCollection) {
          state.currentCollection.questions = state.currentCollection.questions.filter(
            q => q.id !== action.payload.questionId
          )
          state.currentCollection.question_count -= 1
        }
      })
      
      // 更新错题本中的题目
      .addCase(updateQuestionInCol.fulfilled, (state, action) => {
        if (state.currentCollection) {
          const question = state.currentCollection.questions.find(
            q => q.id === action.payload.questionId
          )
          if (question) {
            Object.assign(question, action.payload.data)
          }
        }
      })
      
      // 获取统计信息
      .addCase(fetchCollectionStats.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchCollectionStats.fulfilled, (state, action) => {
        state.isLoading = false
        state.stats = action.payload
      })
      .addCase(fetchCollectionStats.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  }
})

export const {
  clearError,
  setSelectedQuestions,
  toggleQuestionSelection,
  clearSelectedQuestions,
  clearCurrentCollection
} = collectionSlice.actions

// 选择器
export const selectCategories = (state: { collection: CollectionState }) => state.collection.categories
export const selectCollections = (state: { collection: CollectionState }) => state.collection.collections
export const selectCurrentCollection = (state: { collection: CollectionState }) => state.collection.currentCollection
export const selectCollectionStats = (state: { collection: CollectionState }) => state.collection.stats
export const selectCollectionLoading = (state: { collection: CollectionState }) => state.collection.isLoading
export const selectCollectionSaving = (state: { collection: CollectionState }) => state.collection.isSaving
export const selectCollectionError = (state: { collection: CollectionState }) => state.collection.error
export const selectSelectedQuestions = (state: { collection: CollectionState }) => state.collection.selectedQuestions

export default collectionSlice.reducer

