import React from 'react'

const Upload = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">文档上传</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-lg text-gray-900">拖拽文件到此处，或点击选择文件</p>
                <p className="text-sm text-gray-500 mt-1">支持 PDF, DOC, DOCX, TXT 格式</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                选择文件
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">上传历史</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">暂无上传记录</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Upload
