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
        // Ignore certain actions and state paths that may contain
        // non-serializable File objects (e.g. browsers `File`). The
        // upload UI stores File objects in local component state but
        // some callers may accidentally include them in actions. We
        // sanitize in reducers but the middleware sees the action
        // before reducers run, so ignore this action to avoid noisy
        // warnings while keeping the rest of the checks enabled.
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'upload/addFile'],
        ignoredPaths: ['upload.files.*.file'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
