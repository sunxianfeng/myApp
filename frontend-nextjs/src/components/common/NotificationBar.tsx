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
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Listen for all active tasks
    const unsubscribe = backgroundTaskManager.subscribeToAllTasks((tasks) => {
      // Find recently completed tasks (within last 30 seconds)
      const recentCompleted = tasks.find(
        (task) =>
          task.status === 'completed' &&
          Date.now() - task.timestamp < 30000 // 30 seconds
      )

      if (recentCompleted && !notification && !shownNotificationIds.has(recentCompleted.id)) {
        console.log('NotificationBar - Showing success notification for:', recentCompleted.id)
        
        // Mark this notification as shown
        setShownNotificationIds(prev => new Set(prev).add(recentCompleted.id))
        
        const taskTypeLabel = recentCompleted.type === 'ocr-upload' ? '题目识别' : '任务'
        setNotification({
          id: recentCompleted.id,
          type: 'success',
          title: `${taskTypeLabel}完成！`,
          message: recentCompleted.metadata?.fileName 
            ? `已成功识别 "${recentCompleted.metadata.fileName}"` 
            : '识别任务已完成',
          actionText: pathname !== '/upload/result' ? '查看结果' : undefined,
          actionUrl: pathname !== '/upload/result' ? '/upload/result' : undefined,
        })
        setIsVisible(true)

        // Auto-hide after 10 seconds
        setTimeout(() => {
          handleClose()
        }, 10000)
      }

      // Check for recent failures (within last 30 seconds)
      const recentFailed = tasks.find(
        (task) =>
          task.status === 'failed' &&
          Date.now() - task.timestamp < 30000 // 30 seconds
      )

      if (recentFailed && !notification && !shownNotificationIds.has(recentFailed.id)) {
        console.log('NotificationBar - Showing error notification for:', recentFailed.id)
        
        // Mark this notification as shown
        setShownNotificationIds(prev => new Set(prev).add(recentFailed.id))
        
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
  }, [notification, pathname, shownNotificationIds])

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

  // Get colors based on notification type
  const colors = {
    success: {
      bg: '#A3E635', // Lime green
      text: '#000000', // Black
      border: '#000000'
    },
    error: {
      bg: '#EF4444', // Red
      text: '#FFFFFF', // White
      border: '#000000'
    },
    info: {
      bg: '#22D3EE', // Cyan
      text: '#000000', // Black
      border: '#000000'
    }
  }[notification.type]

  return (
    <div
      className={`retro-toast ${isExiting ? 'retro-toast-exit' : 'retro-toast-enter'}`}
      style={{
        position: 'fixed',
        top: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        backgroundColor: colors.bg,
        color: colors.text,
        padding: '1rem 1.5rem',
        borderRadius: '1rem',
        border: `3px solid ${colors.border}`,
        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        minWidth: '320px',
        maxWidth: '500px',
        animation: isExiting ? 'bounceOut 0.3s ease-in' : 'bounceIn 0.4s ease-out',
      }}
    >
      <style jsx>{`
        @keyframes bounceIn {
          0% {
            transform: translateX(-50%) translateY(-20px) scale(0.9);
            opacity: 0;
          }
          60% {
            transform: translateX(-50%) translateY(5px) scale(1.05);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes bounceOut {
          0% {
            transform: translateX(-50%) translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(-30px) scale(0.8);
            opacity: 0;
          }
        }

        .retro-toast {
          transition: transform 0.2s ease;
        }

        .retro-toast:hover {
          transform: translateX(-50%) translateY(-2px) !important;
          box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1) !important;
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .toast-icon {
          font-size: 1.25rem;
          font-weight: 900;
          flex-shrink: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          background: ${colors.text === '#000000' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
          border: 2px solid ${colors.text};
        }

        .toast-text {
          flex: 1;
          min-width: 0;
        }

        .toast-title {
          font-weight: 900;
          font-size: 1rem;
          margin-bottom: 0.125rem;
          line-height: 1.2;
        }

        .toast-message {
          font-size: 0.875rem;
          font-weight: 500;
          opacity: 0.9;
          line-height: 1.3;
        }

        .toast-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-shrink: 0;
        }

        /* Neo-brutalism Action Button - Clean White Sticker Style */
        .neo-action-btn {
          background: #FFFFFF !important;
          color: #000000 !important;
          border: 2px solid #000000 !important;
          border-radius: 9999px !important;
          padding: 0.5rem 1rem !important;
          font-weight: 700 !important;
          font-size: 0.8125rem !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
          box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1) !important;
          white-space: nowrap !important;
          text-decoration: none !important;
        }

        .neo-action-btn:hover {
          background: #FFFFFF !important;
          color: #000000 !important;
          transform: translate(1px, 1px) !important;
          box-shadow: 1px 1px 0px 0px rgba(0, 0, 0, 1) !important;
        }

        .neo-action-btn:active {
          background: #FFFFFF !important;
          color: #000000 !important;
          transform: translate(2px, 2px) !important;
          box-shadow: none !important;
        }

        .neo-action-btn:focus {
          background: #FFFFFF !important;
          color: #000000 !important;
          outline: none !important;
          box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1) !important;
        }

        /* Force override any inherited styles */
        .neo-action-btn:link,
        .neo-action-btn:visited {
          background: #FFFFFF !important;
          color: #000000 !important;
        }

        /* Legacy action-btn class for backwards compatibility */
        .action-btn {
          background: #FFFFFF !important;
          color: #000000 !important;
          border: 2px solid #000000 !important;
          border-radius: 9999px !important;
          padding: 0.5rem 1rem !important;
          font-weight: 700 !important;
          font-size: 0.8125rem !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
          box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1) !important;
          white-space: nowrap !important;
        }

        .action-btn:hover {
          background: #FFFFFF !important;
          color: #000000 !important;
          transform: translate(1px, 1px) !important;
          box-shadow: 1px 1px 0px 0px rgba(0, 0, 0, 1) !important;
        }

        .action-btn:active {
          background: #FFFFFF !important;
          color: #000000 !important;
          transform: translate(2px, 2px) !important;
          box-shadow: none !important;
        }

        .action-btn:focus {
          background: #FFFFFF !important;
          color: #000000 !important;
          outline: none !important;
        }

        /* Force override any inherited styles */
        .action-btn:link,
        .action-btn:visited {
          background: #FFFFFF !important;
          color: #000000 !important;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: ${colors.text};
          padding: 0.5rem;
          cursor: pointer;
          font-weight: 900;
          font-size: 1.125rem;
          line-height: 1;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          transition: all 0.15s ease;
        }

        .close-btn:hover {
          background: ${colors.text === '#000000' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
        }

        @media (max-width: 768px) {
          .retro-toast {
            position: fixed !important;
            top: 1rem !important;
            left: 1rem !important;
            right: 1rem !important;
            transform: none !important;
            min-width: auto !important;
            max-width: none !important;
          }

          .retro-toast:hover {
            transform: translateY(-2px) !important;
          }

          .toast-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .toast-actions {
            width: 100%;
            justify-content: space-between;
          }

          .action-btn {
            flex: 1;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .toast-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .toast-actions {
            flex-direction: column;
            width: 100%;
          }

          .action-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="toast-content">
        <div className="toast-icon">
          {notification.type === 'success' && '✓'}
          {notification.type === 'error' && '✕'}
          {notification.type === 'info' && 'ℹ'}
        </div>
        <div className="toast-text">
          <div className="toast-title">{notification.title}</div>
          <div className="toast-message">{notification.message}</div>
        </div>
      </div>

      <div className="toast-actions">
        {notification.actionText && notification.actionUrl && (
          <button 
            className="action-btn neo-action-btn" 
            onClick={handleAction}
            style={{
              background: '#FFFFFF',
              color: '#000000',
              border: '2px solid #000000',
              borderRadius: '9999px',
              padding: '0.5rem 1rem',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
              whiteSpace: 'nowrap',
            }}
          >
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
