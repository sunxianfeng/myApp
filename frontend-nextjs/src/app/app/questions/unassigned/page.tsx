'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import {
  MoreHorizontal as IconMore,
  Plus as IconPlus,
  Trash2 as IconTrash,
  Tag as IconTag,
  ArrowRightLeft as IconMove,
  FileX as IconFileX,
} from 'lucide-react'

const IconEdit = () => (
  <span aria-hidden style={{ display: 'inline-block', width: 14, height: 14, fontWeight: 900 }}>
    ✎
  </span>
)

import type { AppDispatch } from '@/lib/store'
import { addQuestionsToCol } from '@/lib/slices/collectionSlice'
import { getUnassignedQuestions, getCollectionsForAssignment, addQuestionsToCollection, getCollectionsWithQuestions } from '@/lib/api'

import '../questions-neobrutalism.css'

// Helper to generate a consistent, visually appealing color from a string
const generateColorFromString = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 70%, 80%)`
}

const QuestionCard = ({
  question,
  onAction,
  onClick,
  draggable,
}: {
  question: any
  onAction: (action: string, payload: any) => void
  onClick?: () => void
  draggable?: boolean
}) => {
  return (
    <div
      className="unified-question-card"
      style={{ borderLeftColor: '#E5E7EB' }} // Gray for unassigned
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return
        if (e.key === 'Enter' || e.key === ' ') onClick()
      }}
      draggable={!!draggable}
      onDragStart={(e) => {
        if (!draggable) return
        e.dataTransfer.setData('application/x-question-id', String(question.id))
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      <div className="card-header">
        <div className="collection-tag">
          <IconFileX size={14} style={{ marginRight: '6px' }} />
          未分配
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="card-action-btn"
              aria-label="Question Actions"
              onClick={(e) => e.stopPropagation()}
            >
              <IconMore size={20} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="card-dropdown-content" sideOffset={5}>
              <DropdownMenu.Item
                className="card-dropdown-item"
                onSelect={() => onAction('edit', question)}
              >
                <IconEdit />
                <span>编辑题目</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="card-dropdown-item"
                onSelect={() => onAction('tags', question)}
              >
                <IconTag size={14} />
                <span>管理标签</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="card-dropdown-item"
                onSelect={() => onAction('move', question)}
              >
                <IconMove size={14} />
                <span>分配到集合</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="card-dropdown-separator" />
              <DropdownMenu.Item
                className="card-dropdown-item danger"
                onSelect={() => onAction('delete', question)}
              >
                <IconTrash size={14} />
                <span>删除</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <div className="card-content">{question.content}</div>
      <div className="card-footer">
        <span className="card-meta-tag">{question.question_type}</span>
        <span className="card-meta-date">{new Date(question.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

const UnassignedQuestionsContent = () => {
  const dispatch = useDispatch<AppDispatch>()

  const [unassignedQuestions, setUnassignedQuestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  // Modal state for collection assignment
  const [assignmentQuestion, setAssignmentQuestion] = useState<any>(null)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)

  useEffect(() => {
    const loadUnassignedQuestions = async () => {
      setIsLoading(true)
      setPageError(null)
      try {
        // This API call needs to be implemented in your backend
        const data = await getUnassignedQuestions()
        setUnassignedQuestions(Array.isArray(data) ? data : [])
      } catch (err: any) {
        console.error(err)
        setPageError(err?.message || 'Failed to load unassigned questions.')
      } finally {
        setIsLoading(false)
      }
    }

    loadUnassignedQuestions()
  }, [])

  const handleAction = (action: string, payload: any) => {
    console.log('Action:', action, 'Payload:', payload)
    switch (action) {
      case 'edit':
        window.alert(`编辑: ${payload.content}`)
        break
      case 'delete':
        if (window.confirm(`确定要删除这道题目吗?`)) {
          // dispatch(deleteQuestion(payload.id))
        }
        break
      case 'move':
        setAssignmentQuestion(payload)
        setIsAssignmentModalOpen(true)
        break
      case 'tags':
        window.alert('管理标签...')
        break
      default:
        break
    }
  }

  const handleAssignToCollections = async (collectionIds: string[]) => {
    if (!assignmentQuestion || collectionIds.length === 0) return

    try {
      setIsLoading(true)
      
      // Assign question to each selected collection
      await Promise.all(
        collectionIds.map(collectionId =>
          addQuestionsToCollection(collectionId, [assignmentQuestion.id])
        )
      )

      // Refresh unassigned questions list (remove the assigned question)
      setUnassignedQuestions(prev => prev.filter(q => q.id !== assignmentQuestion.id))

      // Show success message
      window.alert(`题目已成功分配到 ${collectionIds.length} 个集合!`)
    } catch (e: any) {
      console.error('Failed to assign question:', e)
      setPageError(e?.message || '分配题目到集合失败。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    window.alert('创建新题目...')
  }

  return (
    <div className="unified-questions-page">
      <header className="unified-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <h1>未分配题目</h1>
            <p>这些题目还没有被分配到任何集合中。您可以将它们拖拽到集合中或使用菜单进行分配。</p>
          </div>
        </div>
      </header>

      {pageError && <div className="questions-error">{pageError}</div>}

      <main className="unified-main-grid">
        {unassignedQuestions.map((q: any) => (
          <QuestionCard
            key={`unassigned-question-${String(q.id)}`}
            question={q}
            onAction={handleAction}
            onClick={() => {
              // You can implement a detail modal here similar to the main questions page
              console.log('Question clicked:', q)
            }}
            draggable
          />
        ))}
      </main>

      {(!unassignedQuestions.length && !isLoading) && (
        <div className="questions-empty">
          <p style={{ fontWeight: 900, fontSize: '1.25rem' }}>没有找到未分配的题目。</p>
          <p>所有题目都已经被分配到集合中，或者您可以创建一个新题目。</p>
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="animate-bounce">加载中...</div>
        </div>
      )}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="fab" aria-label="Create new question">
            <IconPlus size={24} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="card-dropdown-content" sideOffset={15} align="end">
            <DropdownMenu.Item className="card-dropdown-item" onSelect={handleCreate}>
              <IconEdit />
              <span>新题目</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Collection Assignment Modal Component */}
      <CollectionAssignmentModal 
        question={assignmentQuestion}
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        onAssign={handleAssignToCollections}
      />
    </div>
  )
}

const CollectionAssignmentModal = ({ 
  question, 
  isOpen, 
  onClose,
  onAssign 
}: { 
  question: any
  isOpen: boolean
  onClose: () => void
  onAssign: (collectionIds: string[]) => void
}) => {
  const [availableCollections, setAvailableCollections] = useState<any[]>([])
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadCollections = async () => {
      if (!isOpen) return
      setIsLoading(true)
      try {
        const collections = await getCollectionsForAssignment()
        setAvailableCollections(Array.isArray(collections) ? collections : [])
      } catch (err) {
        console.error('Failed to load collections:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadCollections()
  }, [isOpen])

  const handleToggleCollection = (collectionId: string) => {
    const newSelected = new Set(selectedCollections)
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId)
    } else {
      newSelected.add(collectionId)
    }
    setSelectedCollections(newSelected)
  }

  const handleAssign = () => {
    onAssign(Array.from(selectedCollections))
    setSelectedCollections(new Set())
    onClose()
  }

  if (!isOpen || !question) return null

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '70vh',
          overflow: 'auto',
          border: '4px solid black',
          boxShadow: '8px 8px 0 rgba(0, 0, 0, 1)',
        }}
      >
        <div style={{ 
          padding: '24px',
          borderBottom: '3px solid black',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconMove size={24} />
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>
              分配到集合
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'white',
              border: '3px solid black',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Question Preview */}
          <div style={{ 
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#FEFCE8',
            border: '2px solid black',
            borderRadius: '8px',
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.875rem' }}>题目</div>
            <div style={{ fontWeight: 500, fontSize: '0.9rem', lineHeight: '1.4' }}>
              {question.content.length > 100 ? `${question.content.substring(0, 100)}...` : question.content}
            </div>
          </div>

          {/* Collections List */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 900, marginBottom: '16px', fontSize: '1.125rem' }}>
              选择集合
            </h3>
            
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
                加载集合中...
              </div>
            ) : availableCollections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
                暂无可用集合。请先创建一个集合。
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflow: 'auto' }}>
                {availableCollections.map((collection) => (
                  <label
                    key={collection.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      border: '2px solid black',
                      borderRadius: '8px',
                      backgroundColor: selectedCollections.has(collection.id) ? '#E0F2FE' : 'white',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCollections.has(collection.id)}
                      onChange={() => handleToggleCollection(collection.id)}
                      style={{
                        marginRight: '12px',
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{collection.title}</div>
                      {collection.description && (
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '2px' }}>
                          {collection.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '3px solid black',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              取消
            </button>
            <button
              onClick={handleAssign}
              disabled={selectedCollections.size === 0}
              style={{
                padding: '12px 24px',
                border: '3px solid black',
                borderRadius: '8px',
                backgroundColor: selectedCollections.size > 0 ? '#22C55E' : '#E5E7EB',
                color: selectedCollections.size > 0 ? 'white' : '#9CA3AF',
                fontWeight: 700,
                cursor: selectedCollections.size > 0 ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem',
              }}
            >
              分配 ({selectedCollections.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UnassignedQuestionsPage() {
  return (
    <Suspense fallback={<div className="loading-overlay">加载中...</div>}>
      <UnassignedQuestionsContent />
    </Suspense>
  )
}
