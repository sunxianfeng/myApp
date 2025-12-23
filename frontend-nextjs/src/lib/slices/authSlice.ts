import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { login, register, logout as logoutApi, getCurrentUser } from '@/lib/api'
import type { User, LoginCredentials, RegisterData } from '@/types/api'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// 异步登录操作
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await login(credentials)

      if (!response?.access_token) {
        throw new Error('登录响应缺少 access_token')
      }

      const accessToken = response.access_token

      // 保存token到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', accessToken)
      }

      // 获取当前用户信息
      const user: User = await getCurrentUser()

      return {
        user,
        token: accessToken,
        refreshToken: null,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '登录失败')
    }
  }
)

// 异步注册操作
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      // 先注册用户
      const registeredUser: User = await register(userData)

      // 注册成功后立即登录以获取 token
      const loginResp = await login({ email: userData.email, password: userData.password })

      if (!loginResp?.access_token) {
        throw new Error('登录响应缺少 access_token')
      }

      const accessToken = loginResp.access_token

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', accessToken)
      }

      return {
        user: registeredUser,
        token: accessToken,
        refreshToken: null,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '注册失败')
    }
  }
)

// 异步登出操作
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi()
      
      // 清除localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
      
      return true
    } catch (error: any) {
      // 即使API调用失败，也要清除本地数据
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
      return rejectWithValue(error.message || '登出失败')
    }
  }
)

// 获取当前用户信息
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user: User = await getCurrentUser()
      return user
    } catch (error: any) {
      return rejectWithValue(error.message || '获取用户信息失败')
    }
  }
)

// 初始化认证状态（从localStorage恢复）
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      if (typeof window === 'undefined') {
        return null
      }
      
      const token = localStorage.getItem('token')
      const refreshToken = localStorage.getItem('refreshToken')
      
      if (!token) {
        return null
      }
      
      // 验证token并获取用户信息
      const user: User = await getCurrentUser()
      
      return {
        user,
        token,
        refreshToken,
      }
    } catch (error: any) {
      // token无效，清除本地存储
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      }
      return rejectWithValue(error.message || '认证初始化失败')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      state.isAuthenticated = !!action.payload
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 初始化认证状态
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) {
          state.user = action.payload.user
          state.token = action.payload.token
          state.refreshToken = action.payload.refreshToken
          state.isAuthenticated = true
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
      })
      
      // 登录
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
      })
      
      // 注册
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
      })
      
      // 登出
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.error = null
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.error = action.payload as string
      })
      
      // 获取当前用户
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
      })
  },
})

export const { clearError, setToken, updateUser } = authSlice.actions

// 选择器
export const selectAuth = (state: { auth: AuthState }) => state.auth
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error

export default authSlice.reducer
