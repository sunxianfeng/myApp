'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '@/lib/store'
import {
  fetchCollection,
  removeQuestionFromCol,
  updateQuestionInCol,
  modifyCollection,
  selectCurrentCollection,
  selectCollectionLoading,
  selectCollectionError,
  clearCurrentCollection
} from '@/lib/slices/collectionSlice'
import type { QuestionInCollection } from '@/types/api'

export default function CollectionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const dispatch = useDispatch<AppDispatch>()
  
  const collectionId = params?.id as string
  const collection = useSelector(selectCurrentCollection)
  const isLoading = useSelector(selectCollectionLoading)
  const error = useSelector(selectCollectionError)
  
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [sortBy, setSortBy] = useState<'added' | 'mastery' | 'practiced'>('added')
  const [filterMastery, setFilterMastery] = useState<number | 'all'>('all')
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [masteryLevel, setMasteryLevel] = useState(0)
  
  useEffect(() => {
    if (collectionId) {
      dispatch(fetchCollection({ id: collectionId, includeQuestions: true }))
    }
    
    return () => {
      dispatch(clearCurrentCollection())
    }
  }, [collectionId, dispatch])
  
  const handleRemoveQuestion = async (questionId: string) => {
    if (confirm('确定要从错题本中移除这道题目吗？')) {
      await dispatch(removeQuestionFromCol({ collectionId, questionId }))
    }
  }
  
  const handleUpdateQuestion = async (questionId: string) => {
    await dispatch(updateQuestionInCol({
      collectionId,
      questionId,
      data: {
        notes: noteText,
        mastery_level: masteryLevel
      }
    }))
    setEditingQuestion(null)
  }
  
  const handleStartEdit = (question: QuestionInCollection) => {
    setEditingQuestion(question.id)
    setNoteText(question.notes || '')
    setMasteryLevel(question.mastery_level || 0)
  }
  
  const handleToggleFavorite = async () => {
    if (collection) {
      await dispatch(modifyCollection({
        id: collection.id,
        data: { is_favorite: !collection.is_favorite }
      }))
      dispatch(fetchCollection({ id: collectionId, includeQuestions: true }))
    }
  }
  
  // 排序和筛选
  const sortedQuestions = collection?.questions ? [...collection.questions].sort((a, b) => {
    if (sortBy === 'added') {
      return new Date(b.added_at || '').getTime() - new Date(a.added_at || '').getTime()
    } else if (sortBy === 'mastery') {
      return (a.mastery_level || 0) - (b.mastery_level || 0)
    } else if (sortBy === 'practiced') {
      return (b.times_practiced || 0) - (a.times_practiced || 0)
    }
    return 0
  }) : []
  
  const filteredQuestions = filterMastery === 'all'
    ? sortedQuestions
    : sortedQuestions.filter(q => (q.mastery_level || 0) === filterMastery)
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }
  
  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '错题本不存在'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/app/collections')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← 返回错题本列表
          </button>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  {collection.title}
                  {collection.is_favorite && <span className="text-2xl">⭐</span>}
                </h1>
                <p className="text-gray-600 mb-4">{collection.description || '暂无描述'}</p>
                
                <div className="flex gap-6 text-sm text-gray-500">
                  <span>题目数：{collection.question_count}</span>
                  <span>练习次数：{collection.total_practiced}</span>
                  <span>创建时间：{new Date(collection.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <button
                onClick={handleToggleFavorite}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {collection.is_favorite ? '取消收藏' : '收藏'}
              </button>
            </div>
          </div>
        </div>
        
        {/* 工具栏 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* 排序 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="added">按添加时间</option>
                <option value="mastery">按掌握程度</option>
                <option value="practiced">按练习次数</option>
              </select>
              
              {/* 掌握程度筛选 */}
              <select
                value={filterMastery}
                onChange={(e) => setFilterMastery(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部掌握程度</option>
                <option value="0">未掌握 (0)</option>
                <option value="1">较差 (1)</option>
                <option value="2">一般 (2)</option>
                <option value="3">良好 (3)</option>
                <option value="4">优秀 (4)</option>
                <option value="5">完全掌握 (5)</option>
              </select>
              
              {/* 视图切换 */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-4 py-2 ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
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
            
            <div className="text-sm text-gray-600">
              共 {filteredQuestions.length} 道题目
            </div>
          </div>
        </div>
        
        {/* 题目列表 - 卡片视图 */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredQuestions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                {/* 题目头部 */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-700">#{index + 1}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {question.difficulty_level || '中等'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveQuestion(question.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    移除
                  </button>
                </div>
                
                {/* 题目内容 */}
                <div className="mb-4">
                  <div className="text-gray-900 mb-2 line-clamp-3">{question.content}</div>
                  {question.question_type === 'multiple_choice' && question.options && (
                    <div className="text-sm text-gray-600 mt-2">
                      选项：A B C D
                    </div>
                  )}
                </div>
                
                {/* 掌握程度 */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">掌握程度</div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5].map(level => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded ${
                          level <= (question.mastery_level || 0)
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    练习 {question.times_practiced || 0} 次
                  </div>
                </div>
                
                {/* 笔记 */}
                {editingQuestion === question.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">笔记</label>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="记录你的想法..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        掌握程度：{masteryLevel}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={masteryLevel}
                        onChange={(e) => setMasteryLevel(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateQuestion(question.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingQuestion(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {question.notes && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <div className="font-medium text-yellow-800 mb-1">我的笔记</div>
                        <div className="text-yellow-700">{question.notes}</div>
                      </div>
                    )}
                    <button
                      onClick={() => handleStartEdit(question)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {question.notes ? '编辑笔记' : '添加笔记'}
                    </button>
                  </>
                )}
              </div>
            ))}
            
            {filteredQuestions.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                暂无题目
              </div>
            )}
          </div>
        )}
        
        {/* 题目列表 - 列表视图 */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">题目内容</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">难度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">掌握程度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">练习次数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuestions.map((question, index) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2 max-w-md">
                        {question.content}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {question.difficulty_level || '中等'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${((question.mastery_level || 0) / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{question.mastery_level || 0}/5</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {question.times_practiced || 0}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleStartEdit(question)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleRemoveQuestion(question.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        移除
                      </button>
                    </td>
                  </tr>
                ))}
                
                {filteredQuestions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      暂无题目
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

