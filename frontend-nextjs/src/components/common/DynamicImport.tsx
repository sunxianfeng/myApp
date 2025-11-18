'use client'

import dynamic from 'next/dynamic'
import LoadingSpinner from './LoadingSpinner'

// Dynamic import wrapper with loading state
export const createDynamicComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  loadingComponent?: React.ComponentType<any>
) => {
  return dynamic(importFunc, {
    loading: (loadingProps) => {
      if (loadingComponent) {
        const LoadingComp = loadingComponent as React.ComponentType<any>
        return <LoadingComp {...loadingProps} />
      }
      return <LoadingSpinner size={'default'} />
    },
    ssr: false, // Disable SSR for components that need browser APIs
  })
}

// Pre-defined dynamic components for common heavy components
export const DynamicUpload = createDynamicComponent(
  () => import('@/app/app/upload/page'),
)

export const DynamicQuestions = createDynamicComponent(
  () => import('@/app/app/questions/page'),
)

export const DynamicTemplates = createDynamicComponent(
  () => import('@/app/app/templates/page'),
)

export const DynamicPapers = createDynamicComponent(
  () => import('@/app/app/papers/page'),
)

export const DynamicSettings = createDynamicComponent(
  () => import('@/app/app/settings/page'),
)
