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
    if (path === '/app') {
      return pathname === '/app'
    }
    return pathname.startsWith(path)
  }

  const getNavItemClassName = (path: string): string => {
    const baseClasses = 'sidebar-item flex items-center p-3 rounded-xl transition-all duration-100'
    if (!mounted) {
      return `${baseClasses} font-semibold text-gray-500`
    }

    let active = false
    if (path === '/app') {
      active = pathname === '/app'
    } else {
      active = pathname.startsWith(path)
    }

    if (active) {
      // Clean active style: soft yellow background with rounded pill shape
      return `${baseClasses} bg-yellow-100 text-black font-semibold`
    }

    // Inactive state: gray text, subtle hover
    return `${baseClasses} text-gray-600 hover:bg-gray-50`
  }

  return (
    <div className="flex flex-col text-sm w-screen h-screen bg-yellow-400 overflow-hidden">
      {/* Full-Width Top Header - Seamless Yellow Background */}
      <header className="w-full h-16 bg-yellow-400 border-0 flex items-center justify-between px-8 flex-shrink-0" suppressHydrationWarning>
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
      <div className="flex flex-1 overflow-hidden gap-8 p-6">
        {/* Sidebar - Floating White Island */}
        <aside className="sidebar w-64 flex flex-col flex-shrink-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Navigation - All items in one list */}
          <nav className="flex flex-col space-y-2 p-4">
            {/* 首页 */}
            <Link
              href="/app"
              className={getNavItemClassName('/app')}
            >
              <Icon name="dashboard" className="w-5 h-5 mr-3 text-black" />
              首页
            </Link>

            {/* 题目解析 */}
            <Link
              href="/app/upload"
              className={getNavItemClassName('/app/upload')}
            >
              <Icon name="upload" className="w-5 h-5 mr-3 text-black" />
              题目解析
            </Link>

            {/* 题目管理 */}
            <Link
              href="/app/questions"
              className={getNavItemClassName('/app/questions')}
            >
              <Icon name="file" className="w-5 h-5 mr-3 text-black" />
              题目管理
            </Link>

            {/* 设置 - Now a sibling of other nav items */}
            <Link
              href="/app/settings"
              className={getNavItemClassName('/app/settings')}
            >
              <Icon name="settings" className="w-5 h-5 mr-3 text-black" />
              设置
            </Link>
          </nav>
        </aside>

        {/* Main Content Area - Right Side - Floating White Island */}
        <main className="flex-1 bg-white rounded-3xl shadow-2xl overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
