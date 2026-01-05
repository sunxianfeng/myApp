'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AppLogo } from './Icons'

function Icon({ name, className }: { name: 'dashboard' | 'file' | 'upload' | 'settings' | 'search' | 'chevronDown'; className?: string }) {
  // Slightly thicker stroke so icons appear bold and consistent with neobrutalism
  const common = { className, fill: 'none', xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', 'aria-hidden': true, strokeWidth: '3' }
  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <path d="M3 13h8V3H3v10z" stroke="currentColor" />
          <path d="M13 21h8V11h-8v10z" stroke="currentColor" />
          <path d="M13 3h8v6h-8V3z" stroke="currentColor" />
          <path d="M3 21h8v-6H3v6z" stroke="currentColor" />
        </svg>
      )
    case 'file':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeLinejoin="round" />
          <path d="M14 2v6h6" stroke="currentColor" strokeLinejoin="round" />
        </svg>
      )
    case 'upload':
      return (
        <svg {...common}>
          <path d="M12 16V7" stroke="currentColor" strokeLinecap="round" />
          <path d="M8 11l4-4 4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeLinejoin="round" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="currentColor" />
          <path d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.5-2-3.5-2.4.8a8 8 0 0 0-1.7-1L15 4h-6l-.4 2.8a8 8 0 0 0-1.7 1L4.5 7 2.5 10.5 4.5 12a7.9 7.9 0 0 0 .1 2l-2 1.5 2 3.5 2.4-.8a8 8 0 0 0 1.7 1L9 20h6l.4-2.8a8 8 0 0 0 1.7-1l2.4.8 2-3.5-2-1.5z" stroke="currentColor" strokeLinejoin="round" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" stroke="currentColor" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeLinecap="round" />
        </svg>
      )
    case 'chevronDown':
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
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
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const getNavItemClassName = (path: string): string => {
    const baseClasses = 'sidebar-item'
    if (!mounted) {
      return baseClasses
    }

    let active = false
    if (path === '/') {
      active = pathname === '/'
    } else {
      active = pathname.startsWith(path)
    }

    // Return base class + 'active' if the route matches
    // The CSS will handle all styling via .sidebar-item and .sidebar-item.active
    return active ? `${baseClasses} active` : baseClasses
  }

  return (
    <div className="flex flex-col text-sm w-full h-screen overflow-hidden" style={{
      background: '#FDE047',
      backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      {/* Full-Width Top Header - Seamless Butter Yellow Background */}
      <header className="w-full h-16 border-0 shadow-none flex items-center justify-between px-8 flex-shrink-0" style={{
        background: '#FDE047',
        backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} suppressHydrationWarning>
        {/* Left: Logo - Text-based with small icon square */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center flex-shrink-0">
            <AppLogo className="w-5 h-5 text-yellow-300" />
          </div>
          <h1 className="text-lg font-black text-black">题宝 OCR</h1>
        </div>

        {/* Right: User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-black">
            <img
              src={
                'data:image/svg+xml;utf8,' +
                encodeURIComponent(
                  `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"16\" fill=\"#E5E7EB\"/><circle cx=\"16\" cy=\"13\" r=\"6\" fill=\"#9CA3AF\"/><path d=\"M6.5 28c2.5-6 16.5-6 19 0\" fill=\"#9CA3AF\"/></svg>`
                )
              }
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="hidden sm:flex sm:flex-col">
            <p className="font-black text-black text-sm">Username</p>
            <p className="text-xs text-black font-semibold">高级会员</p>
          </div>

          <Icon name="chevronDown" className="w-4 h-4 text-black" />
        </div>
      </header>

      {/* Main Content Area: Sidebar + Main Content with Floating Islands */}
      <div className="flex flex-1 gap-8 p-6 bg-transparent overflow-hidden">
        {/* Sidebar - Floating White Island with Enhanced Shadow for Pale Background */}
        <aside className="sidebar w-64 flex flex-col flex-shrink-0 bg-white rounded-3xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] overflow-y-auto" style={{ border: 'none' }}>
          {/* Navigation - All items in one list */}
          <nav className="flex flex-col space-y-2 p-4">
            {/* 首页 */}
            <Link
              href="/"
              className={getNavItemClassName('/')}
            >
              <Icon name="dashboard" className="w-5 h-5 mr-3" />
              首页
            </Link>

            {/* 题目解析 */}
            <Link
              href="/upload"
              className={getNavItemClassName('/upload')}
            >
              <Icon name="upload" className="w-5 h-5 mr-3" />
              题目解析
            </Link>

            {/* 题目管理 */}
            <Link
              href="/questions"
              className={getNavItemClassName('/questions')}
            >
              <Icon name="file" className="w-5 h-5 mr-3" />
              题目管理
            </Link>

            {/* 设置 - Now a sibling of other nav items */}
            <Link
              href="/settings"
              className={getNavItemClassName('/settings')}
            >
              <Icon name="settings" className="w-5 h-5 mr-3" />
              设置
            </Link>
          </nav>
        </aside>

        {/* Main Content Area - Right Side - Floating White Island */}
        <main className="flex-1 bg-white rounded-3xl p-8 overflow-y-auto" style={{ border: 'none' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
