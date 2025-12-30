import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uploadReducer from './slices/uploadSlice'
import questionReducer from './slices/questionSlice'
import collectionReducer from './slices/collectionSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    upload: uploadReducer,
    question: questionReducer,
    collection: collectionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore certain actions and state paths that may contain
        // non-serializable File objects (e.g. browsers `File`). The
        // upload UI stores File objects in local component state but
        // some callers may accidentally include them in actions. We
        // sanitize in reducers but middleware sees: action
        // before reducers run, so ignore this action to avoid noisy
        // warnings while keeping rest of checks enabled.
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'upload/addFile'],
        ignoredPaths: ['upload.files.*.file'],
      },
      // Disable thunk auto-abort on unmount for background tasks
      // This allows uploads to continue even when user navigates away
      immutableCheck: {
        warnAfter: 128,
        ignoredPaths: [],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
