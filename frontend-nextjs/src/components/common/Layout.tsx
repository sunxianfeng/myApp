'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/lib/store'
import { logoutUser } from '@/lib/slices/authSlice'
import { AppLogo } from './Icons'
import { ThemeToggle } from './ThemeToggle'

function Icon({ name, className }: { name: 'dashboard' | 'file' | 'upload' | 'settings' | 'search' | 'chevronDown' | 'menu' | 'chevronLeft' | 'chevronRight'; className?: string }) {
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
    case 'menu':
      return (
        <svg {...common}>
          <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'chevronLeft':
      return (
        <svg {...common}>
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'chevronRight':
      return (
        <svg {...common}>
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
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
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load collapsed state from localStorage
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true')
    }
  }, [])

  // Close profile dropdown when route changes
  useEffect(() => {
    setIsProfileOpen(false)
  }, [pathname])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }

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
    } else if (path === '/questions') {
      // Special case: 题目管理 should be active for both /questions and /collections
      active = pathname.startsWith('/questions') || pathname.startsWith('/collections')
    } else {
      active = pathname.startsWith(path)
    }

    // Return base class + 'active' if the route matches
    // The CSS will handle all styling via .sidebar-item and .sidebar-item.active
    return active ? `${baseClasses} active` : baseClasses
  }

  return (
    <div 
      className="flex flex-col text-sm w-full h-screen overflow-hidden transition-colors duration-300" 
      style={{
        background: 'var(--bg-main)',
        backgroundImage: 'radial-gradient(rgba(128, 128, 128, 0.08) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* Full-Width Top Header - Seamless Background */}
      <header 
        className="w-full h-20 border-0 shadow-none flex items-center justify-between flex-shrink-0 transition-colors duration-300" 
        style={{
          background: 'var(--bg-main)',
          backgroundImage: 'radial-gradient(rgba(128, 128, 128, 0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          paddingTop: '8px',
          paddingBottom: '8px',
          paddingLeft: '2rem',
          paddingRight: '2.5rem'
        }} 
        suppressHydrationWarning
      >
        {/* Left: Logo - Text-based with small icon square */}
        <div className="flex items-center gap-2.5">
          <AppLogo className="w-11 h-11" />
          <h1 className="text-2xl font-black tracking-tight transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>题宝</h1>
        </div>

        {/* Right: Theme Toggle + User Profile with Dropdown */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <ThemeToggle />
          
          {/* User Profile Dropdown */}
          <div 
            className="relative"
            onMouseLeave={() => setIsProfileOpen(false)}
          >
          <button 
            onClick={() => {
              if (!isAuthenticated) {
                router.push('/login')
              } else {
                setIsProfileOpen(!isProfileOpen)
              }
            }}
            className="profile-button flex items-center gap-3 bg-white rounded-full px-4 py-2 border-3 border-black transition-all duration-200 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            style={{
              boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)'
            }}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden ring-3 ring-black flex-shrink-0">
              <img
                src={
                  'data:image/svg+xml;utf8,' +
                  encodeURIComponent(
                    `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"36\" height=\"36\" viewBox=\"0 0 36 36\"><rect width=\"36\" height=\"36\" rx=\"18\" fill=\"#FBBF24\"/><circle cx=\"18\" cy=\"15\" r=\"7\" fill=\"#000000\"/><path d=\"M5 33c3-7 21-7 26 0\" fill=\"#000000\"/></svg>`
                  )
                }
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="hidden sm:flex sm:flex-col text-left">
              <p className="font-black text-black text-sm leading-tight">
                {isAuthenticated && user ? user.name || user.email : '登录'}
              </p>
              {isAuthenticated && user && (
                <p className="text-xs text-gray-600 font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Premium</p>
              )}
            </div>

            {isAuthenticated && (
              <Icon 
                name="chevronDown" 
                className={`w-4 h-4 text-black transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} 
              />
            )}
          </button>

          {/* Dropdown Menu - Neobrutalism Style - Only show when logged in */}
          {isAuthenticated && isProfileOpen && (
            <>
              {/* Backdrop to close dropdown when clicking outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsProfileOpen(false)}
              />
              
              <div 
                className="profile-dropdown absolute mt-3 bg-white rounded-2xl border-3 border-black z-50"
                style={{
                  boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
                  right: '0',
                  maxHeight: 'calc(100vh - 120px)',
                  overflowY: 'auto',
                  minWidth: '210px',
                  width: 'max-content',
                  maxWidth: '240px',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                {/* User Info Section - Email Focused */}
                <div className="px-6 py-4 border-b-3 border-black bg-gradient-to-br from-yellow-50 to-amber-50">
                  <div className="space-y-2.5">
                    <p className="text-base text-gray-700 font-bold break-all leading-relaxed">
                      {user?.email || 'user@example.com'}
                    </p>
                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-black rounded-full text-xs font-bold shadow-sm border-2 border-black hover:from-amber-500 hover:to-yellow-500 transition-all duration-200 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                    >
                      <span className="text-sm">⚡</span>
                      <span>升级会员</span>
                    </Link>
                  </div>
                </div>

                {/* Menu Items - Simplified & Clean */}
                <div className="py-2">
                  <Link
                    href="/"
                    className="profile-menu-item flex items-center gap-3.5 px-6 py-3.5 hover:bg-yellow-50 active:bg-yellow-100 transition-all duration-150"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      <Icon name="dashboard" className="w-4 h-4 text-black" />
                    </div>
                    <span className="font-bold text-black text-sm">搜索</span>
                  </Link>
                  
                  <Link
                    href="/settings"
                    className="profile-menu-item flex items-center gap-3.5 px-6 py-3.5 hover:bg-yellow-50 active:bg-yellow-100 transition-all duration-150"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      <Icon name="settings" className="w-4 h-4 text-black" />
                    </div>
                    <span className="font-bold text-black text-sm">账户设置</span>
                  </Link>

                  <div className="border-t-2 border-gray-200 my-1.5 mx-4"></div>

                  <button
                    className="profile-menu-item w-full flex items-center gap-3.5 px-6 py-3.5 hover:bg-red-50 active:bg-red-100 transition-all duration-150 text-left group"
                    onClick={async () => {
                      try {
                        await dispatch(logoutUser()).unwrap()
                        setIsProfileOpen(false)
                        router.push('/login')
                      } catch (error) {
                        console.error('Logout failed:', error)
                      }
                    }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600 group-hover:text-red-700 transition-colors" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2.5">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeLinecap="round" />
                        <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="font-bold text-red-600 group-hover:text-red-700 transition-colors text-sm">退出登录</span>
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </header>

      {/* Main Content Area: Sidebar + Main Content with Floating Islands */}
      <div className="flex flex-1 gap-8 p-6 bg-transparent overflow-hidden">
        {/* Sidebar - Floating White Island with Enhanced Shadow for Pale Background */}
        <aside 
          className={`sidebar flex flex-col flex-shrink-0 bg-white rounded-3xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] overflow-y-auto transition-all duration-300 ${
            isCollapsed ? 'w-20' : 'w-64'
          }`} 
          style={{ border: 'none' }}
        >
          {/* Collapse Toggle Button */}
          <div className="flex items-center justify-end p-4 pb-2">
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            >
              <Icon 
                name={isCollapsed ? 'chevronRight' : 'chevronLeft'} 
                className="w-5 h-5 text-gray-600" 
              />
            </button>
          </div>

          {/* Navigation - All items in one list */}
          <nav className="flex flex-col space-y-2 px-4 pb-4">
            {/* 搜索 */}
            <Link
              href="/"
              className={getNavItemClassName('/')}
              title={isCollapsed ? '搜索' : ''}
            >
              <Icon name="dashboard" className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span>搜索</span>}
            </Link>

            {/* 题目解析 */}
            <Link
              href="/upload"
              className={getNavItemClassName('/upload')}
              title={isCollapsed ? '题目上传' : ''}
            >
              <Icon name="upload" className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span>题目上传</span>}
            </Link>

            {/* 题目管理 */}
            <Link
              href="/questions"
              className={getNavItemClassName('/questions')}
              title={isCollapsed ? '题目管理' : ''}
            >
              <Icon name="file" className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span>题目管理</span>}
            </Link>

            {/* 设置 - Now a sibling of other nav items */}
            <Link
              href="/settings"
              className={getNavItemClassName('/settings')}
              title={isCollapsed ? '设置' : ''}
            >
              <Icon name="settings" className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span>设置</span>}
            </Link>
          </nav>
        </aside>

        {/* Main Content Area - Right Side - Floating White Island */}
        <main className="flex-1 bg-white rounded-3xl p-8 overflow-y-auto" style={{ border: 'none', boxShadow: 'none' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
