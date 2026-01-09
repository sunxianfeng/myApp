import React from 'react'
import { X as IconX, AlertTriangle as IconWarning, Trash2 as IconTrash } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  message = '您确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  type = 'warning',
  isLoading = false,
}) => {
  if (!isOpen) return null

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <IconTrash size={24} />,
          iconBg: '#FEE2E2',
          iconColor: '#DC2626',
          confirmBg: '#EF4444',
          confirmHoverBg: '#DC2626',
        }
      case 'warning':
        return {
          icon: <IconWarning size={24} />,
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          confirmBg: '#F59E0B',
          confirmHoverBg: '#D97706',
        }
      case 'info':
      default:
        return {
          icon: <IconWarning size={24} />,
          iconBg: '#DBEAFE',
          iconColor: '#2563EB',
          confirmBg: '#3B82F6',
          confirmHoverBg: '#2563EB',
        }
    }
  }

  const typeConfig = getTypeConfig()

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          maxWidth: '480px',
          width: '100%',
          border: '4px solid black',
          boxShadow: '12px 12px 0 rgba(0, 0, 0, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 24px 0 24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: typeConfig.iconBg,
              border: '3px solid black',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: typeConfig.iconColor,
              flexShrink: 0,
            }}
          >
            {typeConfig.icon}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                marginBottom: '8px',
                color: '#1F2937',
                lineHeight: '1.3',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: '1rem',
                color: '#4B5563',
                lineHeight: '1.5',
                margin: 0,
              }}
            >
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'white',
              border: '3px solid black',
              borderRadius: '8px',
              padding: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: isLoading ? 0.5 : 1,
            }}
            aria-label="Close"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '24px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: 'white',
              color: '#374151',
              border: '3px solid black',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '4px 4px 0 rgba(0,0,0,1)',
              transition: 'all 0.15s ease',
              fontSize: '0.95rem',
              opacity: isLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translate(-1px, -1px)'
                e.currentTarget.style.boxShadow = '5px 5px 0 rgba(0,0,0,1)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translate(0, 0)'
                e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,1)'
              }
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: isLoading ? '#D1D5DB' : typeConfig.confirmBg,
              color: 'white',
              border: '3px solid black',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '4px 4px 0 rgba(0,0,0,1)',
              transition: 'all 0.15s ease',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translate(-1px, -1px)'
                e.currentTarget.style.boxShadow = '5px 5px 0 rgba(0,0,0,1)'
                e.currentTarget.style.backgroundColor = typeConfig.confirmHoverBg
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translate(0, 0)'
                e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,1)'
                e.currentTarget.style.backgroundColor = typeConfig.confirmBg
              }
            }}
          >
            {isLoading && (
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            )}
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ConfirmModal
