import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'

const Layout = () => {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">教学出题App</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                to="/app"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/app'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                仪表板
              </Link>
              <Link
                to="/app/questions"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/app/questions'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                题目管理
              </Link>
              <Link
                to="/app/templates"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/app/templates'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                模板管理
              </Link>
              <Link
                to="/app/papers"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/app/papers'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                试卷管理
              </Link>
              <Link
                to="/app/upload"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/app/upload'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                文档上传
              </Link>
              <Link
                to="/app/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/app/settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                设置
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
