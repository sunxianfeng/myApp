'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/lib/store'
import './organize-neobrutalism.css'
import {
  fetchCollections,
  addQuestionsToCol,
  removeQuestionFromCol,
  addCollection,
  selectCollections,
  selectCollectionLoading
} from '@/lib/slices/collectionSlice'
import { getCollection } from '@/lib/api'

function IconFileText({ size = 16, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 13h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconFolder({ size = 16, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

function IconFolderPlus({ size = 16, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h8a2 2 0 0 1 2 2v4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 11v6a2 2 0 0 0 2 2h7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M19 14v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconPlus({ size = 16, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconChevronRight({ size = 16, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconGrid({ size = 16, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 3h8v8H3V3z" stroke="currentColor" strokeWidth="2" />
      <path d="M13 3h8v8h-8V3z" stroke="currentColor" strokeWidth="2" />
      <path d="M3 13h8v8H3v-8z" stroke="currentColor" strokeWidth="2" />
      <path d="M13 13h8v8h-8v-8z" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function IconList({ size = 16, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 6h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Separate component for the content to use useSearchParams
const OrganizeContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()
  
  const collections = useSelector(selectCollections)
  const isLoading = useSelector(selectCollectionLoading)
  
  const [questions, setQuestions] = useState<any[]>([])
  const [targetCollectionId, setTargetCollectionId] = useState<string | null>(null)
  const [dropOverId, setDropOverId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Get question IDs from URL or fetch from "Default" collection
  const questionIdsFromUrl = searchParams.get('ids')?.split(',') || []

  useEffect(() => {
    const loadData = async () => {
      setIsProcessing(true)
      try {
        await dispatch(fetchCollections())
        
        // If IDs are provided in URL, we fetch those specific questions
        // For simplicity, we can fetch the "Default" collection and filter
        // Or if IDs are provided, we might need a bulk get questions API.
        // Assuming we want to show questions that were just saved to "Default"
        
        const defaultCol = collections.find(c => c.title === '默认错题本' || c.title === 'Default')
        if (defaultCol) {
          const detail = await getCollection(defaultCol.id, true)
          if (questionIdsFromUrl.length > 0) {
            // Filter only the ones from URL if provided
            setQuestions(detail.questions.filter((q: any) => questionIdsFromUrl.includes(q.id)))
          } else {
            // Show all questions in Default
            setQuestions(detail.questions)
          }
        }
      } catch (err) {
        console.error('Failed to load questions:', err)
      } finally {
        setIsProcessing(false)
      }
    }
    loadData()
  }, [dispatch, searchParams])

  const onDragStart = (e: React.DragEvent, questionId: string) => {
    e.dataTransfer.setData('questionId', questionId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = (e: React.DragEvent, collectionId: string | 'new') => {
    e.preventDefault()
    setDropOverId(collectionId)
  }

  const onDragLeave = () => {
    setDropOverId(null)
  }

  const onDrop = async (e: React.DragEvent, destCollectionId: string | 'new') => {
    e.preventDefault()
    setDropOverId(null)
    const questionId = e.dataTransfer.getData('questionId')
    
    if (!questionId) return

    setIsProcessing(true)
    try {
      let finalDestId = destCollectionId

      if (destCollectionId === 'new') {
        const title = prompt('请输入新错题本名称:')
        if (!title) return
        
        const newCol = await dispatch(addCollection({
          title,
          description: '从整理页面创建',
          is_favorite: false,
          is_public: false
        })).unwrap()
        finalDestId = newCol.id
      }

      // 1. Add to new collection
      await dispatch(addQuestionsToCol({
        collectionId: finalDestId,
        questionIds: [questionId]
      })).unwrap()

      // 2. Remove from current collection (Default)
      const defaultCol = collections.find(c => c.title === '默认错题本' || c.title === 'Default')
      if (defaultCol && defaultCol.id !== finalDestId) {
        await dispatch(removeQuestionFromCol({
          collectionId: defaultCol.id,
          questionId: questionId
        })).unwrap()
      }

      // Update local state
      setQuestions(prev => prev.filter(q => q.id !== questionId))
      
      // Refresh collections to update counts
      dispatch(fetchCollections())
      
      if (destCollectionId === 'new') {
        alert('已成功创建新错题本并移动题目')
      }
    } catch (err) {
      console.error('Move failed:', err)
      alert('移动题目失败')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFinish = () => {
    router.push('/app/collections')
  }

  return (
    <div className="organize-page">
      <header className="organize-header">
        <div>
          <h1>题目整理专家</h1>
          <p style={{ fontWeight: 700, marginTop: '0.5rem' }}>将题目拖拽到左侧文件夹进行分类</p>
        </div>
        <button className="neo-btn neo-btn-orange" onClick={handleFinish}>
          完成整理
        </button>
      </header>

      <div className="organize-container">
        <aside className="organize-sidebar">
          <div className="sidebar-section">
            <h2 className="section-title">错题本目录</h2>
            <div className="collection-list">
              {collections.map(col => (
                <div
                  key={col.id}
                  className={`collection-item ${dropOverId === col.id ? 'drop-over' : ''} ${col.title === '默认错题本' ? 'bg-gray-100' : ''}`}
                  onDragOver={(e) => onDragOver(e, col.id)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, col.id)}
                >
                  <IconFolder className="collection-icon" fill={dropOverId === col.id ? "#000" : "none"} />
                  <span>{col.title}</span>
                  <span className="collection-count">{col.question_count}</span>
                </div>
              ))}
            </div>
          </div>

          <div 
            className={`create-zone ${dropOverId === 'new' ? 'drop-over' : ''}`}
            onDragOver={(e) => onDragOver(e, 'new')}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, 'new')}
          >
            <IconFolderPlus size={32} style={{ marginBottom: '0.5rem' }} />
            <div>拖拽至此新建错题本</div>
          </div>
        </aside>

        <main className="organize-main">
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>待整理题目 ({questions.length})</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <IconGrid size={20} />
              <IconList size={20} color="#ccc" />
            </div>
          </div>

          <div className="questions-grid">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="question-card"
                draggable
                onDragStart={(e) => onDragStart(e, q.id)}
              >
                <div className="question-card-icon">
                  <IconFileText size={40} strokeWidth={2.5} />
                </div>
                <div className="question-card-title">
                  {q.content || `题目 #${idx + 1}`}
                </div>
                <div className="question-card-meta">
                  <span>{q.question_type === 'multiple_choice' ? '选择题' : '其他'}</span>
                  <span>{new Date(q.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            
            {questions.length === 0 && !isProcessing && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: '#fff', border: '4px dashed #ccc' }}>
                <p style={{ fontWeight: 900, fontSize: '1.25rem' }}>所有题目已整理完毕！</p>
                <button 
                  className="neo-btn" 
                  style={{ marginTop: '1.5rem' }}
                  onClick={() => router.push('/app/collections')}
                >
                  去查看错题本
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {(isProcessing || isLoading) && (
        <div className="loading-overlay">
          <div className="animate-bounce">处理中...</div>
        </div>
      )}
    </div>
  )
}

const OrganizePage = () => {
  return (
    <Suspense fallback={<div className="loading-overlay">加载中...</div>}>
      <OrganizeContent />
    </Suspense>
  )
}

export default OrganizePage

