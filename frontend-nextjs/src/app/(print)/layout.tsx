import type { Metadata } from 'next'
import ReduxProvider from '@/components/providers/ReduxProvider'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import ErrorFallback from '@/components/common/ErrorFallback'
import AntdRegistry from '@/lib/AntdRegistry'
import '../globals.css'

export const metadata: Metadata = {
  title: '打印预览 | Question Generator',
  description: '打印预览和导出PDF',
}

export default function PrintRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <AntdRegistry>
        <ReduxProvider>
          <div style={{ 
            minHeight: '100vh',
            background: '#FEFDFB',
          }}>
            {children}
          </div>
        </ReduxProvider>
      </AntdRegistry>
    </ErrorBoundary>
  )
}

