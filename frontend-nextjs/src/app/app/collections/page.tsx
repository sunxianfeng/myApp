'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '@/lib/store'
import {
  fetchCollections,
  fetchCategories,
  addCollection,
  addCategory,
  fetchCollectionStats,
  selectCollections,
  selectCategories,
  selectCollectionStats,
  selectCollectionLoading,
  selectCollectionError,
} from '@/lib/slices/collectionSlice'
import type { CollectionCreate, CategoryCreate } from '@/types/api'

export default function CollectionsPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  
  const collections = useSelector(selectCollections)
  const categories = useSelector(selectCategories)
  const stats = useSelector(selectCollectionStats)
  const isLoading = useSelector(selectCollectionLoading)
  const error = useSelector(selectCollectionError)
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // 新建错题本表单
  const [newCollection, setNewCollection] = useState<CollectionCreate>({
    title: '',
    description: '',
    category_id: '',
    is_favorite: false,
    is_public: false,
  })
  
  // 新建分类表单
  const [newCategory, setNewCategory] = useState<CategoryCreate>({
    name: '',
    description: '',
    category_type: 'custom',
    icon: '📁',
    color: '#3B82F6',
  })
  
  useEffect(() => {
    dispatch(fetchCollections())
    dispatch(fetchCategories())
    dispatch(fetchCollectionStats())
  }, [dispatch])
  
  const handleCreateCollection = async () => {
    if (!newCollection.title.trim()) {
      alert('请输入错题本名称')
      return
    }
    
    await dispatch(addCollection(newCollection))
    setShowCreateModal(false)
    setNewCollection({
      title: '',
      description: '',
      category_id: '',
      is_favorite: false,
      is_public: false,
    })
    dispatch(fetchCollections())
    dispatch(fetchCollectionStats())
  }
  
  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('请输入分类名称')
      return
    }
    
    await dispatch(addCategory(newCategory))
    setShowCategoryModal(false)
    setNewCategory({
      name: '',
      description: '',
      category_type: 'custom',
      icon: '📁',
      color: '#3B82F6',
    })
    dispatch(fetchCategories())
  }
  
  const handleCollectionClick = (collectionId: string) => {
    router.push(`/app/collections/${collectionId}`)
  }
  
  const filteredCollections = selectedCategory
    ? collections.filter(c => c.category_id === selectedCategory)
    : collections

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">我的错题本</h1>
          <p className="text-gray-600">系统化管理和复习你的错题</p>
        </div>
        
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">错题本总数</div>
              <div className="text-3xl font-bold text-blue-600">{stats.total_collections}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">题目总数</div>
              <div className="text-3xl font-bold text-green-600">{stats.total_questions}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">练习次数</div>
              <div className="text-3xl font-bold text-purple-600">{stats.total_practiced}</div>
            </div>
          </div>
        )}
        
        {/* 工具栏 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* 分类筛选 */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部分类</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              
              {/* 视图切换 */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                >
                  卡片
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                >
                  列表
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                新建分类
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                + 新建错题本
              </button>
            </div>
          </div>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {/* 加载状态 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        )}
        
        {/* 错题本列表 - 卡片视图 */}
        {!isLoading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map(collection => (
              <div
                key={collection.id}
                onClick={() => handleCollectionClick(collection.id)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
              >
                {/* 封面 */}
                <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 relative">
                  {collection.is_favorite && (
                    <div className="absolute top-3 right-3 text-yellow-400 text-2xl">⭐</div>
                  )}
                </div>
                
                {/* 内容 */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {collection.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {collection.description || '暂无描述'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{collection.question_count} 道题目</span>
                    <span>{new Date(collection.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredCollections.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                暂无错题本，点击右上角创建一个吧
              </div>
            )}
          </div>
        )}
        
        {/* 错题本列表 - 列表视图 */}
        {!isLoading && viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">题目数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">更新时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCollections.map(collection => {
                  const category = categories.find(c => c.id === collection.category_id)
                  return (
                    <tr key={collection.id} className="hover:bg-gray-50 cursor-pointer">
                      <td 
                        className="px-6 py-4"
                        onClick={() => handleCollectionClick(collection.id)}
                      >
                        <div className="flex items-center">
                          {collection.is_favorite && <span className="mr-2">⭐</span>}
                          <span className="font-medium text-gray-900">{collection.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {category ? `${category.icon} ${category.name}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {collection.question_count}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(collection.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCollectionClick(collection.id)
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  )
                })}
                
                {filteredCollections.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      暂无错题本
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* 新建错题本弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">新建错题本</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  错题本名称 *
                </label>
                <input
                  type="text"
                  value={newCollection.title}
                  onChange={(e) => setNewCollection({...newCollection, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：数学错题集"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({...newCollection, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="简单描述一下这个错题本..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类
                </label>
                <select
                  value={newCollection.category_id}
                  onChange={(e) => setNewCollection({...newCollection, category_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">不选择分类</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCollection.is_favorite}
                    onChange={(e) => setNewCollection({...newCollection, is_favorite: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">标记为收藏</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleCreateCollection}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 新建分类弹窗 */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">新建分类</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类名称 *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：数学"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类类型
                </label>
                <select
                  value={newCategory.category_type}
                  onChange={(e) => setNewCategory({...newCategory, category_type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="subject">科目</option>
                  <option value="grade">年级</option>
                  <option value="difficulty">难度</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  图标（Emoji）
                </label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="📁"
                  maxLength={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  颜色
                </label>
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                  className="w-20 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleCreateCategory}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

