import { configureStore } from '@reduxjs/toolkit'
import questionsReducer from './slices/questionsSlice'
import templatesReducer from './slices/templatesSlice'
import papersReducer from './slices/papersSlice'

export const store = configureStore({
  reducer: {
    questions: questionsReducer,
    templates: templatesReducer,
    papers: papersReducer,
  },
})

export default store
