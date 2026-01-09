'use client'

import React, { useEffect, useState } from 'react'

type Theme = 'light' | 'soft-light'

interface ThemeToggleProps {
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
    setIsOpen(false)
  }

  if (!mounted) {
    return null
  }

  const getIcon = () => {
    switch (theme) {
      case 'soft-light':
        return '☀️'
      default:
        return '⚡'
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'soft-light':
        return '柔和模式'
      default:
        return '亮色模式'
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-toggle-button flex items-center justify-center w-12 h-12 rounded-full border-3 transition-all duration-200 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: '3px 3px 0px 0px var(--shadow-color)'
        }}
        aria-label="切换主题"
        title={getLabel()}
      >
        <span className="text-2xl leading-none">{getIcon()}</span>
      </button>

      {/* Theme Selector Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className="absolute mt-3 rounded-2xl border-3 z-50"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              boxShadow: '6px 6px 0px 0px var(--shadow-color)',
              right: '0',
              minWidth: '200px',
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            <div className="py-2">
              {/* Light Mode */}
              <button
                onClick={() => handleThemeChange('light')}
                className={`w-full flex items-center gap-3.5 px-5 py-3.5 transition-all duration-150 ${
                  theme === 'light' ? 'bg-yellow-100' : 'hover:bg-yellow-50 active:bg-yellow-100'
                }`}
                style={theme === 'light' ? {} : {}}
              >
                <span className="text-2xl leading-none flex-shrink-0">⚡</span>
                <div className="text-left flex-1">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>亮色模式</p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>明亮活力</p>
                </div>
                {theme === 'light' && (
                  <span className="text-green-600 font-black text-lg">✓</span>
                )}
              </button>

              {/* Soft Light Mode */}
              <button
                onClick={() => handleThemeChange('soft-light')}
                className={`w-full flex items-center gap-3.5 px-5 py-3.5 transition-all duration-150 rounded-b-xl ${
                  theme === 'soft-light' ? 'bg-yellow-100' : 'hover:bg-yellow-50 active:bg-yellow-100'
                }`}
              >
                <span className="text-2xl leading-none flex-shrink-0">☀️</span>
                <div className="text-left flex-1">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>柔和模式</p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>护眼舒适</p>
                </div>
                {theme === 'soft-light' && (
                  <span className="text-green-600 font-black text-lg">✓</span>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
