'use client'

import React from 'react'

interface Props {
  open: boolean
  title?: string
  message?: string
  actionText?: string
  onClose: () => void
  onAction?: () => void
}

export default function NeobrutalDialog({ open, title, message, actionText, onClose, onAction }: Props) {
  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} onClick={onClose} />

      <div style={{
        background: '#fff',
        border: '6px solid #000',
        padding: '1.25rem',
        maxWidth: '680px',
        width: 'min(92%, 680px)',
        boxShadow: '10px 10px 0 rgba(0,0,0,1)',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'stretch'
      }} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{title || '提示'}</h3>
          <button onClick={onClose} aria-label="关闭" style={{ background: 'transparent', border: '3px solid #000', padding: '0.25rem 0.5rem', fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ fontSize: '0.95rem', color: '#111' }}>{message}</div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          {actionText && (
            <button onClick={() => { onAction?.(); onClose() }} style={{ background: '#ffcc00', border: '4px solid #000', padding: '0.6rem 1rem', fontWeight: 700 }}> {actionText} </button>
          )}
          <button onClick={onClose} style={{ background: '#ef4444', color: 'white', border: '4px solid #000', padding: '0.6rem 1rem', fontWeight: 700 }}>关闭</button>
        </div>
      </div>
    </div>
  )
}
