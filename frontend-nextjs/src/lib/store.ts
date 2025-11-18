import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uploadReducer from './slices/uploadSlice'
import questionReducer from './slices/questionSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    upload: uploadReducer,
    question: questionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
