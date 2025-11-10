import React from 'react'
import { Link } from 'react-router-dom'
import {
  Database,
  FileText,
  LayoutTemplate,
  FilePlus2,
  UploadCloud,
  Zap,
  FileUp,
  PlusSquare,
} from 'lucide-react'

const Dashboard = () => {
  return (
    <div>
      {/* Core Data Section */}
      <div className="card p-6 mb-4 fade-in-up stagger-1">
        <h3 className="text-base font-semibold mb-6 flex items-center text-gray-800">
          <Database className="w-4 h-4 mr-2" />
          核心数据
        </h3>
        <div className="grid grid-cols-4 gap-6">
          {/* Metric 1: 总题目数 */}
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 mb-1">总题目数</p>
              <p className="text-2xl font-bold text-gray-800">89</p>
            </div>
          </div>

          {/* Metric 2: 模板数量 */}
          <div className="flex items-center space-x-3">
            <LayoutTemplate className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 mb-1">模板数量</p>
              <p className="text-2xl font-bold text-gray-800">12</p>
            </div>
          </div>

          {/* Metric 3: 生成试卷 */}
          <div className="flex items-center space-x-3">
            <FilePlus2 className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 mb-1">生成试卷</p>
              <p className="text-2xl font-bold text-gray-800">25</p>
            </div>
          </div>

          {/* Metric 4: 上传文档 */}
          <div className="flex items-center space-x-3">
            <UploadCloud className="w-8 h-8 text-gray-400" />
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
          <Zap className="w-4 h-4 mr-2" />
          快速操作
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Action 1: Upload Document */}
          <Link
            to="/app/upload"
            className="btn-action border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:shadow-md transition-all duration-200"
          >
            <FileUp className="w-10 h-10 mb-3" />
            <span className="font-semibold text-sm">上传新文档</span>
          </Link>

          {/* Action 2: Create Template */}
          <Link
            to="/app/templates"
            className="btn-action border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:shadow-md transition-all duration-200"
          >
            <PlusSquare className="w-10 h-10 mb-3" />
            <span className="font-semibold text-sm">创建新模板</span>
          </Link>

          {/* Action 3: Generate Exam */}
          <Link
            to="/app/papers"
            className="btn-action border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:shadow-md transition-all duration-200"
          >
            <FilePlus2 className="w-10 h-10 mb-3" />
            <span className="font-semibold text-sm">生成试卷</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
