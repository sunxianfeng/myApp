'use client'

import Link from 'next/link'

function Icon({ name, className }: { name: 'db' | 'file' | 'template' | 'fileplus' | 'upload' | 'zap' | 'fileup' | 'plus'; className?: string }) {
  // Minimal inline icons to avoid lucide-react (Turbopack HMR instability)
  const common = { className, fill: 'none', xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', 'aria-hidden': true }
  switch (name) {
    case 'db':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="2" />
          <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" stroke="currentColor" strokeWidth="2" />
          <path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'file':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'template':
      return (
        <svg {...common}>
          <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2" />
          <path d="M8 4v16" stroke="currentColor" strokeWidth="2" />
          <path d="M4 10h16" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'fileplus':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 12v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
    case 'zap':
      return (
        <svg {...common}>
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'fileup':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 15l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

export default function Dashboard() {
  return (
    <div>
      {/* Core Data Section */}
      <div className="card p-6 mb-4 fade-in-up stagger-1">
        <h3 className="text-base font-semibold mb-6 flex items-center text-gray-800">
          <Icon name="db" className="w-4 h-4 mr-2" />
          核心数据
        </h3>
        <div className="grid grid-cols-4 gap-6">
          {/* Metric 1: 总题目数 */}
          <div className="flex items-center space-x-3">
            <Icon name="file" className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 mb-1">总题目数</p>
              <p className="text-2xl font-bold text-gray-800">89</p>
            </div>
          </div>

          {/* Metric 2: 模板数量 */}
          <div className="flex items-center space-x-3">
            <Icon name="template" className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 mb-1">模板数量</p>
              <p className="text-2xl font-bold text-gray-800">12</p>
            </div>
          </div>

          {/* Metric 3: 生成试卷 */}
          <div className="flex items-center space-x-3">
            <Icon name="fileplus" className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 mb-1">生成试卷</p>
              <p className="text-2xl font-bold text-gray-800">25</p>
            </div>
          </div>

          {/* Metric 4: 上传文档 */}
          <div className="flex items-center space-x-3">
            <Icon name="upload" className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 mb-1">上传文档</p>
              <p className="text-2xl font-bold text-gray-800">4</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="card p-6 fade-in-up stagger-2">
        <h3 className="text-base font-semibold mb-6 flex items-center text-gray-800">
          <Icon name="zap" className="w-4 h-4 mr-2" />
          快速操作
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Action 1: Upload Document */}
          <Link
            href="/app/upload"
            className="btn-action border-2 border-solid border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:shadow-md transition-all duration-200"
          >
            <Icon name="fileup" className="w-10 h-10 mb-3" />
            <span className="font-semibold text-sm">上传新文档</span>
          </Link>

          {/* Action 2: Create Template */}
          <Link
            href="/app/templates"
            className="btn-action border-2 border-solid border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:shadow-md transition-all duration-200"
          >
            <Icon name="plus" className="w-10 h-10 mb-3" />
            <span className="font-semibold text-sm">创建新模板</span>
          </Link>

          {/* Action 3: Generate Exam */}
          <Link
            href="/app/papers"
            className="btn-action border-2 border-solid border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:shadow-md transition-all duration-200"
          >
            <Icon name="fileplus" className="w-10 h-10 mb-3" />
            <span className="font-semibold text-sm">生成试卷</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
