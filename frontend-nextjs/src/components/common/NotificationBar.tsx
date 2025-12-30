'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { backgroundTaskManager, BackgroundTask } from '@/lib/backgroundTaskManager'

interface Notification {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message: string
  actionText?: string
  actionUrl?: string
}

export default function NotificationBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [notification, setNotification] = useState<Notification | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Listen for all active tasks
    const unsubscribe = backgroundTaskManager.subscribeToAllTasks((tasks) => {
      // Find recently completed tasks (within last 5 seconds)
      const recentCompleted = tasks.find(
        (task) =>
          task.status === 'completed' &&
          Date.now() - task.timestamp < 5000 // 5 seconds
      )

      if (recentCompleted && !notification) {
        // Don't show notification if already on result page
        if (pathname === '/app/upload/result') {
          return
        }

        const taskTypeLabel = recentCompleted.type === 'ocr-upload' ? '题目识别' : '任务'
        setNotification({
          id: recentCompleted.id,
          type: 'success',
          title: `${taskTypeLabel}完成！`,
          message: recentCompleted.metadata?.fileName 
            ? `已成功识别 "${recentCompleted.metadata.fileName}"` 
            : '识别任务已完成',
          actionText: '查看结果',
          actionUrl: '/app/upload/result',
        })
        setIsVisible(true)

        // Auto-hide after 10 seconds
        setTimeout(() => {
          handleClose()
        }, 10000)
      }

      // Check for recent failures
      const recentFailed = tasks.find(
        (task) =>
          task.status === 'failed' &&
          Date.now() - task.timestamp < 5000
      )

      if (recentFailed && !notification) {
        const taskTypeLabel = recentFailed.type === 'ocr-upload' ? '题目识别' : '任务'
        setNotification({
          id: recentFailed.id,
          type: 'error',
          title: `${taskTypeLabel}失败`,
          message: recentFailed.error || '处理过程中出现错误',
        })
        setIsVisible(true)

        // Auto-hide after 8 seconds
        setTimeout(() => {
          handleClose()
        }, 8000)
      }
    })

    return () => unsubscribe()
  }, [notification, pathname])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsExiting(false)
      setNotification(null)
    }, 300) // Match animation duration
  }

  const handleAction = () => {
    if (notification?.actionUrl) {
      router.push(notification.actionUrl)
      handleClose()
    }
  }

  if (!isVisible || !notification) {
    return null
  }

  const bgColor = {
    success: '#10b981', // green
    error: '#ef4444',   // red
    info: '#3b82f6',    // blue
  }[notification.type]

  return (
    <div
      className={`notification-bar ${isExiting ? 'notification-bar-exit' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: bgColor,
        color: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        animation: isExiting ? 'slideUp 0.3s ease-out' : 'slideDown 0.3s ease-out',
        border: '3px solid #000',
        borderTop: 'none',
      }}
    >
      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }

        .notification-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .notification-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .notification-text {
          flex: 1;
        }

        .notification-title {
          font-weight: 600;
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
        }

        .notification-message {
          font-size: 0.9375rem;
          opacity: 0.95;
        }

        .notification-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .notification-btn {
          background: white;
          color: #000;
          border: 2px solid #000;
          padding: 0.625rem 1.25rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9375rem;
          white-space: nowrap;
        }

        .notification-btn:hover {
          transform: translateY(-2px);
          box-shadow: 3px 3px 0 #000;
        }

        .close-btn {
          background: transparent;
          border: 2px solid white;
          color: white;
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 1.125rem;
          line-height: 1;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 768px) {
          .notification-bar {
            flex-direction: column;
            align-items: flex-start;
            padding: 1rem;
          }

          .notification-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>

      <div className="notification-content">
        <span className="notification-icon">
          {notification.type === 'success' && '✓'}
          {notification.type === 'error' && '✕'}
          {notification.type === 'info' && 'ℹ'}
        </span>
        <div className="notification-text">
          <div className="notification-title">{notification.title}</div>
          <div className="notification-message">{notification.message}</div>
        </div>
      </div>

      <div className="notification-actions">
        {notification.actionText && notification.actionUrl && (
          <button className="notification-btn" onClick={handleAction}>
            {notification.actionText}
          </button>
        )}
        <button className="close-btn" onClick={handleClose} aria-label="关闭通知">
          ✕
        </button>
      </div>
    </div>
  )
}
