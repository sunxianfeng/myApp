import React from 'react'

const Templates = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">模板管理</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">模板列表</h2>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              创建模板
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">暂无模板</p>
            <p className="text-sm text-gray-400 mt-2">点击"创建模板"开始创建您的第一个模板</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Templates
