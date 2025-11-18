'use client'

import React from 'react'
import { Spin, Card } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large'
  tip?: string
  spinning?: boolean
  delay?: number
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  overlay?: boolean
  fullscreen?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  tip = '加载中...',
  spinning = true,
  delay = 0,
  className = '',
  style = {},
  children,
  overlay = false,
  fullscreen = false,
}) => {
  const spinIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 32 : size === 'small' ? 16 : 24 }} spin />

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
        <div className="text-center">
          <Spin size={size} indicator={spinIcon} tip={tip} />
        </div>
      </div>
    )
  }

  if (overlay && children) {
    return (
      <Spin
        size={size}
        indicator={spinIcon}
        tip={tip}
        spinning={spinning}
        delay={delay}
        className={className}
        style={style}
      >
        {children}
      </Spin>
    )
  }

  if (children) {
    return (
      <Card className={className} style={style}>
        <Spin
          size={size}
          indicator={spinIcon}
          tip={tip}
          spinning={spinning}
          delay={delay}
        >
          {children}
        </Spin>
      </Card>
    )
  }

  return (
    <div className={`flex items-center justify-center p-8 ${className}`} style={style}>
      <Spin size={size} indicator={spinIcon} tip={tip} delay={delay} />
    </div>
  )
}

// 预设的加载组件
export const PageLoading: React.FC<{ tip?: string }> = ({ tip = '页面加载中...' }) => (
  <LoadingSpinner size="large" tip={tip} className="min-h-96" />
)

export const TableLoading: React.FC<{ tip?: string }> = ({ tip = '数据加载中...' }) => (
  <LoadingSpinner size="default" tip={tip} className="py-8" />
)

export const ButtonLoading: React.FC<{ tip?: string }> = ({ tip = '处理中...' }) => (
  <LoadingSpinner size="small" tip={tip} />
)

export const FullscreenLoading: React.FC<{ tip?: string }> = ({ tip = '加载中...' }) => (
  <LoadingSpinner size="large" tip={tip} fullscreen />
)

// 骨架屏加载组件
export const SkeletonLoading: React.FC<{
  lines?: number
  avatar?: boolean
  paragraph?: boolean
  active?: boolean
  className?: string
}> = ({
  lines = 3,
  avatar = false,
  paragraph = true,
  active = true,
  className = '',
}) => {
  const { Skeleton } = require('antd')
  
  return (
    <div className={`p-4 ${className}`}>
      <Skeleton
        avatar={avatar}
        paragraph={{ rows: lines }}
        active={active}
        loading={true}
      />
    </div>
  )
}

// 卡片骨架屏
export const CardSkeleton: React.FC<{
  count?: number
  className?: string
}> = ({ count = 1, className = '' }) => {
  const { Skeleton, Card } = require('antd')
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <Skeleton
            avatar
            paragraph={{ rows: 4 }}
            active={true}
            loading={true}
          />
        </Card>
      ))}
    </div>
  )
}

// 表格骨架屏
export const TableSkeleton: React.FC<{
  rows?: number
  columns?: number
  className?: string
}> = ({ rows = 5, columns = 4, className = '' }) => {
  const { Skeleton } = require('antd')
  
  return (
    <div className={`p-4 ${className}`}>
      <div className="space-y-3">
        {/* 表头 */}
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton.Input key={`header-${index}`} active={true} size="small" className="flex-1" />
          ))}
        </div>
        
        {/* 表格行 */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton.Input
                key={`cell-${rowIndex}-${colIndex}`}
                active={true}
                size="small"
                className="flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default LoadingSpinner
