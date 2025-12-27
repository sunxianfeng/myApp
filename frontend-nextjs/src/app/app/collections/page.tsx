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
    <div className="min-h-screen bg-[#F3F4F6] p-4 md:p-8"> {/* 稍微加深背景色对比 */}
      <div className="max-w-7xl mx-auto">
        {/* 头部 - 增强排版 */}
        <div className="mb-10">
          <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tight">我的错题本</h1>
          <p className="text-lg font-bold text-gray-600">系统化管理和复习你的错题</p>
        </div>
        
        {/* 统计卡片 - 新布鲁塔主义风格 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { label: '错题本总数', value: stats.total_collections, color: '#3B82F6', icon: '📚' },
              { label: '题目总数', value: stats.total_questions, color: '#22C55E', icon: '🎯' },
              { label: '练习次数', value: stats.total_practiced, color: '#A855F7', icon: '🔥' }
            ].map((stat, i) => (
              <div key={i} className="bg-white border-[3px] border-black p-6 rounded-xl shadow-[6px_6px_0_0_#000]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-black text-gray-500 uppercase tracking-wider">{stat.label}</span>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="text-4xl font-black" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* 工具栏 - 更加紧凑且风格统一 */}
        <div className="bg-[#FEF3C7] border-[3px] border-black rounded-xl p-4 mb-8 shadow-[4px_4px_0_0_#000]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border-[2px] border-black rounded-lg font-bold bg-white focus:ring-0"
              >
                <option value="">全部分类</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
              
              <div className="flex border-[2px] border-black rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-6 py-2 font-bold transition ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                >卡片</button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-6 py-2 font-bold border-l-[2px] border-black transition ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                >列表</button>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-6 py-2 bg-white border-[2px] border-black rounded-lg font-bold shadow-[3px_3px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >新建分类</button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-[#22C55E] text-white border-[2px] border-black rounded-lg font-bold shadow-[3px_3px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >+ 新建错题本</button>
            </div>
          </div>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border-[3px] border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 font-bold">
            {error}
          </div>
        )}
        
        {/* 加载状态 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600 font-bold">加载中...</p>
          </div>
        )}
        
        {/* 错题本列表 - 卡片视图 */}
        {!isLoading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCollections.map(collection => (
              <div
                key={collection.id}
                onClick={() => handleCollectionClick(collection.id)}
                className="group bg-white border-[3px] border-black rounded-2xl overflow-hidden shadow-[8px_8px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_#000] transition-all cursor-pointer"
              >
                <div className="h-24 bg-gradient-to-br from-blue-300 to-purple-400 border-b-[3px] border-black relative">
                  {collection.is_favorite && (
                    <div className="absolute top-3 right-3 bg-white border-2 border-black rounded-full p-1 leading-none text-xl shadow-[2px_2px_0_0_#000]">⭐</div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black mb-2 group-hover:text-blue-600 transition-colors">{collection.title}</h3>
                  <p className="text-gray-600 font-bold text-sm mb-6 line-clamp-2">{collection.description || '暂无描述'}</p>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-gray-100 border-2 border-black rounded-full text-xs font-black">📝 {collection.question_count} Questions</span>
                    <span className="text-xs font-bold text-gray-500 uppercase">{new Date(collection.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredCollections.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 font-bold">
                暂无错题本，点击右上角创建一个吧
              </div>
            )}
          </div>
        )}
        
        {/* 错题本列表 - 列表视图 */}
        {!isLoading && viewMode === 'list' && (
          <div className="bg-white border-[3px] border-black rounded-xl shadow-[6px_6px_0_0_#000] overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-[#F9FAFB] border-b-[3px] border-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-black text-gray-700 uppercase tracking-wider">名称</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-gray-700 uppercase tracking-wider">分类</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-gray-700 uppercase tracking-wider">题目数</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-gray-700 uppercase tracking-wider">更新时间</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-gray-700 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredCollections.map((collection, index) => {
                  const category = categories.find(c => c.id === collection.category_id)
                  return (
                    <tr
                      key={collection.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b-[2px] border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer`}
                      onClick={() => handleCollectionClick(collection.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-sm font-black text-gray-900">{collection.title}</div>
                          {collection.is_favorite && <span className="ml-2 text-yellow-500">⭐</span>}
                        </div>
                        <div className="text-sm text-gray-600 font-bold">{collection.description || '暂无描述'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-500">
                        {category ? `${category.icon} ${category.name}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-500">
                        {collection.question_count}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-500">
                        {new Date(collection.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCollectionClick(collection.id)
                          }}
                          className="bg-blue-500 text-white px-4 py-2 border-[2px] border-black rounded-lg font-bold hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[2px_2px_0_0_#000]"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  )
                })}
                
                {filteredCollections.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-bold">
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

