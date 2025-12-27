'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AppLogo } from './Icons'

function Icon({ name, className }: { name: 'dashboard' | 'file' | 'upload' | 'settings' | 'search' | 'chevronDown'; className?: string }) {
  const common = { className, fill: 'none', xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', 'aria-hidden': true }
  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <path d="M3 13h8V3H3v10z" stroke="currentColor" strokeWidth="2" />
          <path d="M13 21h8V11h-8v10z" stroke="currentColor" strokeWidth="2" />
          <path d="M13 3h8v6h-8V3z" stroke="currentColor" strokeWidth="2" />
          <path d="M3 21h8v-6H3v6z" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'file':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'upload':
      return (
        <svg {...common}>
          <path d="M12 16V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 11l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="2" />
          <path d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.5-2-3.5-2.4.8a8 8 0 0 0-1.7-1L15 4h-6l-.4 2.8a8 8 0 0 0-1.7 1L4.5 7 2.5 10.5 4.5 12a7.9 7.9 0 0 0 .1 2l-2 1.5 2 3.5 2.4-.8a8 8 0 0 0 1.7 1L9 20h6l.4-2.8a8 8 0 0 0 1.7-1l2.4.8 2-3.5-2-1.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'chevronDown':
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return null
  }
}

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (path: string): boolean => {
    if (path === '/app') {
      return pathname === '/app'
    }
    return pathname.startsWith(path)
  }

  // Get page title based on current pathname
  const getPageTitle = (): string => {
    if (pathname === '/app') return '仪表板'
    if (pathname.startsWith('/app/questions')) return '题目管理'
    if (pathname.startsWith('/app/collections')) return '题目管理' // Collections are part of questions
    if (pathname.startsWith('/app/upload')) return '文档上传'
    if (pathname.startsWith('/app/settings')) return '设置'
    return '仪表板' // fallback
  }

  // Prevent hydration mismatch by not rendering active states until mounted
  const getNavItemClassName = (path: string): string => {
    const baseClasses = 'sidebar-item flex items-center p-3 rounded-lg'
    if (!mounted) {
      return `${baseClasses} text-gray-600`
    }
    
    let active = false
    if (path === '/app') {
      active = pathname === '/app'
    } else {
      active = pathname.startsWith(path)
    }
    
    return `${baseClasses} ${active ? 'active' : 'text-gray-600'}`
  }

  return (
    <div className="flex text-sm w-screen h-screen">
      {/* Sidebar */}
      <aside className="sidebar w-60 h-screen p-4 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center mb-10 space-x-3">
            <AppLogo className="w-9 h-9" />
            <h1 className="text-lg font-bold text-gray-800 self-center">错题宝 OCR</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col space-y-2">
            {/* 仪表板 */}
            <Link
              href="/app"
              className={getNavItemClassName('/app')}
            >
              <Icon name="dashboard" className="w-4 h-4 mr-3" />
              仪表板
            </Link>

            {/* 题目管理 */}
            <Link
              href="/app/questions"
              className={getNavItemClassName('/app/questions')}
            >
              <Icon name="file" className="w-4 h-4 mr-3" />
              题目管理
            </Link>

            {/* 文档上传 */}
            <Link
              href="/app/upload"
              className={getNavItemClassName('/app/upload')}
            >
              <Icon name="upload" className="w-4 h-4 mr-3" />
              文档上传
            </Link>
          </nav>
        </div>

        {/* Settings */}
        <div>
          <Link
            href="/app/settings"
            className={getNavItemClassName('/app/settings')}
          >
            <Icon name="settings" className="w-4 h-4 mr-3" />
            设置
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50 overflow-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h2>
            {pathname === '/app' && (
              <p className="text-gray-700 text-3xl font-semibold mt-1">欢迎回来, Username!</p>
            )}
          </div>
          <div className="flex items-center gap-20">
            {/* Search Bar */}
            <div className="relative w-80">
              <Icon name="search" className="absolute left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="搜索..."
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <img
                src={
                  'data:image/svg+xml;utf8,' +
                  encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                      <rect width="32" height="32" rx="16" fill="#E5E7EB"/>
                      <circle cx="16" cy="13" r="6" fill="#9CA3AF"/>
                      <path d="M6.5 28c2.5-6 16.5-6 19 0" fill="#9CA3AF"/>
                    </svg>`
                  )
                }
                alt="User Avatar"
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="font-semibold text-gray-800">Username</p>
                <p className="text-xs text-gray-500">高级会员</p>
              </div>
              <Icon name="chevronDown" className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        {children}
      </main>
    </div>
  )
}

export default Layout
