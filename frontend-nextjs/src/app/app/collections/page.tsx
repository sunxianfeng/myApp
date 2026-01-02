'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import './collections-neobrutalism.css'
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
  const [searchQuery, setSearchQuery] = useState<string>('')
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

  const filteredCollectionsBase = selectedCategory
    ? collections.filter((c) => c.category_id === selectedCategory)
    : collections

  const filteredCollections = searchQuery.trim()
    ? filteredCollectionsBase.filter((c) => {
        const q = searchQuery.trim().toLowerCase()
        return (
          (c.title || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
        )
      })
    : filteredCollectionsBase

  return (
    <div className="collections-page-container min-h-screen bg-transparent p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-black mb-2">我的错题本</h1>
          <p className="text-gray-600 font-medium">系统化管理和复习你的错题</p>
        </div>

        {/* 统计卡片 - Neobrutalism Style */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="neo-stats-card p-6">
              <div className="text-sm text-gray-600 mb-1 font-bold uppercase tracking-wide">
                错题本总数
              </div>
              <div className="text-3xl font-black text-blue-600">{stats.total_collections}</div>
            </div>
            <div className="neo-stats-card p-6">
              <div className="text-sm text-gray-600 mb-1 font-bold uppercase tracking-wide">
                题目总数
              </div>
              <div className="text-3xl font-black text-green-600">{stats.total_questions}</div>
            </div>
            <div className="neo-stats-card p-6">
              <div className="text-sm text-gray-600 mb-1 font-bold uppercase tracking-wide">
                练习次数
              </div>
              <div className="text-3xl font-black text-purple-600">{stats.total_practiced}</div>
            </div>
          </div>
        )}

        {/* Top Toolbar (Refactor) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          {/* Left: Filter/Search */}
          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
            {/* 分类筛选 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="neo-search-select !rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_#000] h-12 px-5 font-bold bg-white"
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>

            {/* 搜索 - Pill Shape */}
            <div className="relative w-full md:w-[360px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black font-black text-lg">
                ⌕
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索错题本..."
                className="w-full !rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_#000] h-12 pl-12 pr-5 bg-white font-bold text-black placeholder:text-gray-500 focus:outline-none focus:shadow-[2px_2px_0px_0px_#000] transition-shadow"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 flex-wrap justify-end w-full md:w-auto">
            {/* Create button (moved from old FAB) */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-2 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all text-black font-bold"
              style={{ backgroundColor: '#A3E635' }}
            >
              <span className="text-xl leading-none">+</span>
              新建
            </button>

            {/* View Toggle */}
            <div className="neo-view-toggle-container !rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`neo-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              >
                卡片
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`neo-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              >
                列表
              </button>
            </div>

            <button
              onClick={() => setShowCategoryModal(true)}
              className="neo-action-btn secondary"
            >
              新建分类
            </button>
          </div>
        </div>

        {/* 错题本列表 - 卡片视图 - Collection Folders */}
        {!isLoading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => {
              const category = categories.find((c) => c.id === collection.category_id)

              // Determine folder color based on category
              let headerColor = 'from-blue-400 to-purple-500'
              let bodyColor = 'bg-yellow-50'

              if (category?.color) {
                // Map hex colors to Tailwind classes for better consistency
                const colorMap: { [key: string]: { header: string; body: string } } = {
                  '#3B82F6': { header: 'from-blue-400 to-blue-600', body: 'bg-blue-50' },
                  '#8B5CF6': { header: 'from-purple-400 to-purple-600', body: 'bg-purple-50' },
                  '#10B981': { header: 'from-green-400 to-green-600', body: 'bg-green-50' },
                  '#F59E0B': { header: 'from-yellow-400 to-yellow-600', body: 'bg-yellow-50' },
                  '#EF4444': { header: 'from-red-400 to-red-600', body: 'bg-red-50' },
                  '#06B6D4': { header: 'from-cyan-400 to-cyan-600', body: 'bg-cyan-50' },
                }

                const colorScheme = colorMap[category.color] || {
                  header: 'from-gray-400 to-gray-600',
                  body: 'bg-gray-50',
                }
                headerColor = colorScheme.header
                bodyColor = colorScheme.body
              }

              return (
                <div
                  key={collection.id}
                  onClick={() => handleCollectionClick(collection.id)}
                  className={`flex flex-col justify-between h-full rounded-3xl overflow-hidden border-[3px] border-black border-solid shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${bodyColor} cursor-pointer`}
                >
                  {/* 封面 Header - Fixed Height */}
                  <div className={`h-32 bg-gradient-to-br ${headerColor} relative flex-shrink-0`}>
                    {collection.is_favorite && (
                      <div className="absolute top-3 right-3 text-yellow-400 text-3xl drop-shadow-lg">
                        ⭐
                      </div>
                    )}
                    {category && (
                      <div className="absolute top-3 left-3 text-white text-2xl drop-shadow-lg">
                        {category.icon}
                      </div>
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-lg font-black text-black mb-2 line-clamp-1 flex-shrink-0">
                      {collection.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow font-medium">
                      {collection.description || '暂无描述'}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="card-footer h-12 flex items-center justify-between px-5 flex-shrink-0 border-t-[3px] border-black">
                    <span className="text-sm font-bold text-black">{collection.question_count} 道题目</span>
                    <span className="text-xs font-medium text-gray-700">
                      {new Date(collection.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })}

            {filteredCollections.length === 0 && (
              <div className="col-span-full">
                <div className="neo-empty-state p-12 text-center">
                  <div className="text-6xl mb-4">📂</div>
                  <h3 className="text-2xl font-black text-black mb-4">暂无错题本</h3>
                  <p className="text-gray-600 mb-6 font-medium">点击右上角创建一个吧</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 mx-auto px-6 py-2 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all text-black font-bold"
                    style={{ backgroundColor: '#A3E635' }}
                  >
                    <span className="text-xl leading-none">+</span>
                    新建
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 错题本列表 - 列表视图 - Neobrutalism Table */}
        {!isLoading && viewMode === 'list' && (
          <div className="neo-table-container">
            <table className="min-w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide">名称</th>
                  <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide">分类</th>
                  <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide">题目数</th>
                  <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide">更新时间</th>
                  <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredCollections.map((collection, index) => {
                  const category = categories.find((c) => c.id === collection.category_id)
                  return (
                    <tr
                      key={collection.id}
                      className={`hover:bg-lime-50 cursor-pointer transition-colors duration-150 ${
                        index !== filteredCollections.length - 1
                          ? 'border-b-[3px] border-black'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4" onClick={() => handleCollectionClick(collection.id)}>
                        <div className="flex items-center gap-3">
                          {collection.is_favorite && <span className="text-yellow-400 text-xl">⭐</span>}
                          <span className="font-bold text-black text-lg">{collection.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {category ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 border-[3px] border-black rounded-full font-bold text-sm">
                            <span className="text-lg">{category.icon}</span>
                            {category.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-black">{collection.question_count}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-600">
                          {new Date(collection.updated_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCollectionClick(collection.id)
                          }}
                          className="neo-table-btn"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {filteredCollections.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl">📂</div>
                        <p className="text-gray-600 font-bold text-lg">暂无错题本</p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="flex items-center gap-2 px-6 py-2 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all text-black font-bold"
                          style={{ backgroundColor: '#A3E635' }}
                        >
                          <span className="text-xl leading-none">+</span>
                          新建
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 新建错题本弹窗 - Neobrutalism Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="neo-modal">
            <h2 className="text-2xl font-black mb-6 text-black">新建错题本</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  错题本名称 *
                </label>
                <input
                  type="text"
                  value={newCollection.title}
                  onChange={(e) => setNewCollection({ ...newCollection, title: e.target.value })}
                  className="w-full px-4 py-3 border-[2px] border-black rounded-xl focus:ring-2 focus:ring-lime-400 focus:border-black font-medium bg-white"
                  placeholder="例如：数学错题集"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  描述
                </label>
                <textarea
                  value={newCollection.description}
                  onChange={(e) =>
                    setNewCollection({ ...newCollection, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border-[2px] border-black rounded-xl focus:ring-2 focus:ring-lime-400 focus:border-black font-medium bg-white resize-none"
                  rows={3}
                  placeholder="简单描述一下这个错题本..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  分类
                </label>
                <select
                  value={newCollection.category_id}
                  onChange={(e) => setNewCollection({ ...newCollection, category_id: e.target.value })}
                  className="w-full px-4 py-3 border-[2px] border-black rounded-xl focus:ring-2 focus:ring-lime-400 focus:border-black font-medium bg-white"
                >
                  <option value="">不选择分类</option>
                  {categories.map((cat) => (
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
                    onChange={(e) =>
                      setNewCollection({ ...newCollection, is_favorite: e.target.checked })
                    }
                    className="mr-3 w-5 h-5 text-lime-400 border-[2px] border-black rounded focus:ring-lime-400"
                  />
                  <span className="text-sm font-bold text-black">⭐ 标记为收藏</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button onClick={() => setShowCreateModal(false)} className="neo-action-btn secondary">
                取消
              </button>
              <button onClick={handleCreateCollection} className="neo-action-btn primary">
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新建分类弹窗 - Neobrutalism Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="neo-modal">
            <h2 className="text-2xl font-black mb-6 text-black">新建分类</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  分类名称 *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-4 py-3 border-[2px] border-black rounded-xl focus:ring-2 focus:ring-lime-400 focus:border-black font-medium bg-white"
                  placeholder="例如：数学"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  分类类型
                </label>
                <select
                  value={newCategory.category_type}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, category_type: e.target.value as any })
                  }
                  className="w-full px-4 py-3 border-[2px] border-black rounded-xl focus:ring-2 focus:ring-lime-400 focus:border-black font-medium bg-white"
                >
                  <option value="subject">科目</option>
                  <option value="grade">年级</option>
                  <option value="difficulty">难度</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  图标（Emoji）
                </label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="w-full px-4 py-3 border-[2px] border-black rounded-xl focus:ring-2 focus:ring-lime-400 focus:border-black font-medium bg-white text-2xl text-center"
                  placeholder="📁"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  颜色
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-16 h-12 border-[3px] border-black rounded-xl cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <div
                    className="flex-1 h-12 rounded-xl border-[2px] border-black"
                    style={{ backgroundColor: newCategory.color }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button onClick={() => setShowCategoryModal(false)} className="neo-action-btn secondary">
                取消
              </button>
              <button onClick={handleCreateCategory} className="neo-action-btn primary">
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

