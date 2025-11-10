import React from 'react'

const Papers = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">试卷管理</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">试卷列表</h2>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              生成试卷
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">暂无试卷</p>
            <p className="text-sm text-gray-400 mt-2">点击"生成试卷"开始创建您的第一份试卷</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Papers
