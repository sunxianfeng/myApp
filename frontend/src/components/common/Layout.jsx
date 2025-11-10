import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  LayoutTemplate,
  Upload,
  Settings,
  Search,
  ChevronDown,
} from 'lucide-react'

const Layout = () => {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/app') {
      return location.pathname === '/app'
    }
    return location.pathname.startsWith(path)
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
              to="/app"
              className={`sidebar-item flex items-center p-3 ${
                isActive('/app') && location.pathname === '/app'
                  ? 'active'
                  : 'rounded-lg text-gray-600'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              仪表板
            </Link>

            {/* 题目管理 */}
            <Link
              to="/app/questions"
              className={`sidebar-item flex items-center p-3 ${
                isActive('/app/questions') ? 'active' : 'rounded-lg text-gray-600'
              }`}
            >
              <FileText className="w-4 h-4 mr-3" />
              题目管理
            </Link>

            {/* 模版管理 */}
            <Link
              to="/app/templates"
              className={`sidebar-item flex items-center p-3 ${
                isActive('/app/templates') ? 'active' : 'rounded-lg text-gray-600'
              }`}
            >
              <LayoutTemplate className="w-4 h-4 mr-3" />
              模版管理
            </Link>

            {/* 文档上传 */}
            <Link
              to="/app/upload"
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
            to="/app/settings"
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', width: '320px' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px'
                }}
                className="text-gray-400"
              />
              <input
                type="text"
                placeholder="搜索..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  paddingLeft: '44px',
                  paddingRight: '16px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  border: '1px solid rgb(209, 213, 219)',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
              />
            </div>

            {/* User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
