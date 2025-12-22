'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  LayoutTemplate,
  Upload,
  Settings,
  Search,
  ChevronDown,
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname()

  const isActive = (path: string): boolean => {
    if (path === '/app') {
      return pathname === '/app'
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="flex text-sm w-screen h-screen">
      {/* Sidebar */}
      <aside className="sidebar w-60 h-screen p-4 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center mb-10 space-x-3">
            <div className="w-9 h-9 flex items-center justify-center border-2 border-gray-800 rounded-lg self-center flex-shrink-0">
              <div className="w-3.5 h-3.5 bg-gray-800 rounded-full"></div>
            </div>
            <h1 className="text-lg font-bold text-gray-800 self-center">我的应用</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col space-y-2">
            {/* 仪表板 */}
            <Link
              href="/app"
              className={`sidebar-item flex items-center p-3 ${
                isActive('/app') && pathname === '/app'
                  ? 'active'
                  : 'rounded-lg text-gray-600'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              仪表板
            </Link>

            {/* 题目管理 */}
            <Link
              href="/app/questions"
              className={`sidebar-item flex items-center p-3 ${
                isActive('/app/questions') ? 'active' : 'rounded-lg text-gray-600'
              }`}
            >
              <FileText className="w-4 h-4 mr-3" />
              题目管理
            </Link>

            {/* 模版管理 */}
            <Link
              href="/app/templates"
              className={`sidebar-item flex items-center p-3 ${
                isActive('/app/templates') ? 'active' : 'rounded-lg text-gray-600'
              }`}
            >
              <LayoutTemplate className="w-4 h-4 mr-3" />
              模版管理
            </Link>

            {/* 文档上传 */}
            <Link
              href="/app/upload"
              className={`sidebar-item flex items-center p-3 ${
                isActive('/app/upload') ? 'active' : 'rounded-lg text-gray-600'
              }`}
            >
              <Upload className="w-4 h-4 mr-3" />
              文档上传
            </Link>
          </nav>
        </div>

        {/* Settings */}
        <div>
          <Link
            href="/app/settings"
            className={`sidebar-item flex items-center p-3 rounded-lg ${
              isActive('/app/settings') ? 'active' : 'text-gray-600'
            }`}
          >
            <Settings className="w-4 h-4 mr-3" />
            设置
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50 overflow-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">仪表板</h2>
            <p className="text-gray-500">欢迎回来, Username!</p>
          </div>
          <div className="flex items-center gap-20">
            {/* Search Bar */}
            <div className="relative w-80">
              <Search
                className="absolute left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              />
              <input
                type="text"
                placeholder="搜索..."
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <img
                src="https://i.pravatar.cc/32"
                alt="User Avatar"
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="font-semibold text-gray-800">Username</p>
                <p className="text-xs text-gray-500">高级会员</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
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
