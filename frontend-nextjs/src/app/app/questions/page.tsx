'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import {
  Folder as IconFolder,
  LayoutGrid as IconGrid,
  List as IconList,
  MoreHorizontal as IconMore,
  Plus as IconPlus,
  Trash2 as IconTrash,
  Tag as IconTag,
  ArrowRightLeft as IconMove,
  X as IconX,
} from 'lucide-react'

const IconEdit = () => (
  <span aria-hidden style={{ display: 'inline-block', width: 14, height: 14, fontWeight: 900 }}>
    ✎
  </span>
)

import type { AppDispatch } from '@/lib/store'
import {
  addCollection,
  fetchCollections,
  selectCollections,
  selectCollectionLoading,
  addQuestionsToCol,
} from '@/lib/slices/collectionSlice'
import { getCollectionsWithQuestions } from '@/lib/api'

import './questions-neobrutalism.css'

// Helper to generate a consistent, visually appealing color from a string (e.g., collection ID)
const generateColorFromString = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 70%, 80%)`
}

// Question Detail Modal Component
const QuestionDetailModal = ({ 
  question, 
  collection, 
  isOpen, 
  onClose 
}: { 
  question: any
  collection: any
  isOpen: boolean
  onClose: () => void 
}) => {
  if (!isOpen || !question) return null

  const collectionColor = collection ? generateColorFromString(collection.id) : '#E5E7EB'

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
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
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
          backgroundColor: collectionColor,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconFolder size={24} />
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>
              Question Details
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
            <IconX size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Collection Info */}
          <div style={{ 
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#F3F4F6',
            border: '2px solid black',
            borderRadius: '8px',
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.875rem' }}>Collection</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: collectionColor,
                  border: '2px solid black',
                  borderRadius: '3px',
                }} 
              />
              <span style={{ fontWeight: 900 }}>{collection?.title || 'Uncategorized'}</span>
            </div>
          </div>

          {/* Question Content */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>Question</h3>
            <div style={{ 
              padding: '16px',
              backgroundColor: '#FEFCE8',
              border: '3px solid black',
              borderRadius: '8px',
              fontSize: '1rem',
              lineHeight: '1.6',
            }}>
              {question.content}
            </div>
          </div>

          {/* Full Content (if available) */}
          {question.full_content && question.full_content !== question.content && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>Full Content</h3>
              <div style={{ 
                padding: '16px',
                backgroundColor: '#F0FDF4',
                border: '3px solid black',
                borderRadius: '8px',
                fontSize: '0.95rem',
                lineHeight: '1.6',
              }}>
                {question.full_content}
              </div>
            </div>
          )}

          {/* Options (if available) */}
          {question.options && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>Options</h3>
              <div style={{ 
                padding: '16px',
                backgroundColor: '#EFF6FF',
                border: '3px solid black',
                borderRadius: '8px',
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                  {typeof question.options === 'string' 
                    ? question.options 
                    : JSON.stringify(question.options, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Correct Answer (if available) */}
          {question.correct_answer && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>Correct Answer</h3>
              <div style={{ 
                padding: '16px',
                backgroundColor: '#DCFCE7',
                border: '3px solid black',
                borderRadius: '8px',
                fontWeight: 700,
              }}>
                {question.correct_answer}
              </div>
            </div>
          )}

          {/* Explanation (if available) */}
          {question.explanation && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>Explanation</h3>
              <div style={{ 
                padding: '16px',
                backgroundColor: '#FEF3C7',
                border: '3px solid black',
                borderRadius: '8px',
                fontSize: '0.95rem',
                lineHeight: '1.6',
              }}>
                {question.explanation}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '2px dashed black',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>Type</div>
              <div style={{ fontWeight: 900 }}>{question.question_type || 'N/A'}</div>
            </div>
            
            {question.difficulty_level && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>Difficulty</div>
                <div style={{ fontWeight: 900 }}>{question.difficulty_level}</div>
              </div>
            )}
            
            {question.subject && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>Subject</div>
                <div style={{ fontWeight: 900 }}>{question.subject}</div>
              </div>
            )}
            
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>Created</div>
              <div style={{ fontWeight: 900 }}>{new Date(question.created_at).toLocaleDateString()}</div>
            </div>
            
            {question.topic_tags && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '8px', color: '#6B7280' }}>Tags</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(typeof question.topic_tags === 'string' 
                    ? question.topic_tags.split(',') 
                    : Array.isArray(question.topic_tags) 
                      ? question.topic_tags 
                      : []
                  ).map((tag: string, idx: number) => (
                    <span 
                      key={idx}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#E5E7EB',
                        border: '2px solid black',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                      }}
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const QuestionCard = ({
  question,
  collection,
  onAction,
  onClick,
  draggable,
}: {
  question: any
  collection: any
  onAction: (action: string, payload: any) => void
  onClick?: () => void
  draggable?: boolean
}) => {
  const collectionColor = collection ? generateColorFromString(collection.id) : '#E5E7EB'

  return (
    <div
      className="unified-question-card"
      style={{ borderLeftColor: collectionColor }}
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
          <IconFolder size={14} style={{ marginRight: '6px' }} />
          {collection?.title || 'Uncategorized'}
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
                <span>Edit Question</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="card-dropdown-item"
                onSelect={() => onAction('tags', question)}
              >
                <IconTag size={14} />
                <span>Manage Tags</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="card-dropdown-item"
                onSelect={() => onAction('move', question)}
              >
                <IconMove size={14} />
                <span>Change Collection</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="card-dropdown-separator" />
              <DropdownMenu.Item
                className="card-dropdown-item danger"
                onSelect={() => onAction('delete', question)}
              >
                <IconTrash size={14} />
                <span>Delete</span>
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

const QuestionsContent = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  const collections = useSelector(selectCollections)
  const isLoading = useSelector(selectCollectionLoading)

  const [allQuestions, setAllQuestions] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // View mode state - card is default
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  // Modal state for question details
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
  const [selectedQuestionCollection, setSelectedQuestionCollection] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Holds authoritative collection->questions mapping from backend unified endpoint
  const [collectionsWithQuestions, setCollectionsWithQuestions] = useState<any[] | null>(null)

  // Track UI drag state (optional feedback)
  const [dragOverCollectionId, setDragOverCollectionId] = useState<string | null>(null)

  useEffect(() => {
    const loadInitialData = async () => {
      setIsProcessing(true)
      setPageError(null)
      try {
        // 1) Load collections into redux (used elsewhere + for create actions)
        await dispatch(fetchCollections()).unwrap()

        // 2) Load unified data for this page (collections + questions)
        const data = await getCollectionsWithQuestions()
        if (Array.isArray(data)) {
          setCollectionsWithQuestions(data)

          // Flatten questions so empty-state logic still works.
          const flattened = data.flatMap((c: any) => (Array.isArray(c.questions) ? c.questions : []))
          setAllQuestions(flattened)
        } else {
          setCollectionsWithQuestions([])
          setAllQuestions([])
        }
      } catch (err: any) {
        console.error(err)
        setPageError(err?.message || 'Failed to load data.')
      } finally {
        setIsProcessing(false)
      }
    }

    loadInitialData()
  }, [dispatch])

  const defaultCollectionBlock = useMemo(() => {
    // We treat "default" collection as the one coming back with a falsy id or title "Uncategorized" or "默认错题本".
    // If backend does not provide it, we fall back to an empty block.
    const cols = collectionsWithQuestions
    if (!Array.isArray(cols) || !cols.length) return null

    const found = cols.find((c: any) => 
      !c?.id || 
      c?.title === 'Uncategorized' || 
      c?.title === '默认错题本' || 
      c?.title === 'Default'
    )
    return found || null
  }, [collectionsWithQuestions])

  const defaultQuestions = useMemo(() => {
    const q = defaultCollectionBlock?.questions
    return Array.isArray(q) ? q : []
  }, [defaultCollectionBlock])

  // For the unified card view, we only show:
  // 1) collections (cards) - excluding the default collection
  // 2) questions from all collections (including default)
  const collectionCards = useMemo(() => {
    // Always prefer collectionsWithQuestions as it includes the questions array
    // Fall back to redux collections only if unified data isn't loaded yet
    const allCols = Array.isArray(collectionsWithQuestions) && collectionsWithQuestions.length
      ? collectionsWithQuestions.filter((c: any) => !!c?.id)
      : Array.isArray(collections) && collections.length 
        ? collections 
        : []
    
    // Deduplicate by ID and filter out the default collection
    const collectionMap = new Map()
    const isDefault = (c: any) => 
      !c?.id || 
      c?.title === 'Uncategorized' || 
      c?.title === '默认错题本' || 
      c?.title === 'Default'
    
    allCols.forEach((c: any) => {
      if (!isDefault(c) && c?.id) {
        // Prefer the version with questions array if available
        if (!collectionMap.has(c.id) || (Array.isArray(c.questions) && !collectionMap.get(c.id).questions)) {
          collectionMap.set(c.id, c)
        }
      }
    })
    
    return Array.from(collectionMap.values())
  }, [collections, collectionsWithQuestions])

  const nonDefaultCollectionCards = useMemo(() => {
    // This is now the same as collectionCards since we already filter default
    return collectionCards
  }, [collectionCards])

  const allQuestionsWithCollection = useMemo(() => {
    if (!collectionsWithQuestions) return [];
    const questionMap = new Map();
    
    collectionsWithQuestions.forEach((collection: any) => {
      if (!collection || !Array.isArray(collection.questions)) return;
      collection.questions.forEach((question: any) => {
        // Ensure we use string ID as key for proper deduplication
        const questionId = String(question.id);
        if (!questionMap.has(questionId)) {
          // Check if this is a default collection
          const isDefaultCol = !collection.id || 
            collection.title === 'Uncategorized' || 
            collection.title === '默认错题本' || 
            collection.title === 'Default';
          
          questionMap.set(questionId, {
            ...question,
            // Keep the actual collection info for all questions
            collection: isDefaultCol 
              ? { id: 'default', title: 'Uncategorized' }
              : collection,
          });
        }
      });
    });
    
    return Array.from(questionMap.values());
  }, [collectionsWithQuestions]);

  const handleAction = (action: string, payload: any) => {
    console.log('Action:', action, 'Payload:', payload)
    switch (action) {
      case 'edit':
        window.alert(`Editing: ${payload.content}`)
        break
      case 'delete':
        if (window.confirm(`Are you sure you want to delete this question?`)) {
          // dispatch(deleteQuestion(payload.id))
        }
        break
      case 'move':
        window.alert('Move to another collection...')
        break
      case 'tags':
        window.alert('Manage tags...')
        break
      default:
        break
    }
  }

  const handleCreate = (type: 'question' | 'collection') => {
    if (type === 'collection') {
      const title = window.prompt('Enter new collection name:')
      if (title) {
        dispatch(addCollection({ title, description: '' }))
      }
    } else {
      window.alert('Creating a new question...')
    }
  }

  const handleDropQuestionToCollection = async (collectionId: string, questionId: string) => {
    try {
      setIsProcessing(true)
      await dispatch(addQuestionsToCol({ collectionId, questionIds: [questionId] })).unwrap()

      // Refresh unified data so UI reflects changes.
      const data = await getCollectionsWithQuestions()
      if (Array.isArray(data)) {
        setCollectionsWithQuestions(data)
        const flattened = data.flatMap((c: any) => (Array.isArray(c.questions) ? c.questions : []))
        setAllQuestions(flattened)
      }
    } catch (e: any) {
      setPageError(e?.message || 'Failed to move question.')
    } finally {
      setIsProcessing(false)
      setDragOverCollectionId(null)
    }
  }

  return (
    <div className="unified-questions-page">
      <header className="unified-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <h1>Question Management</h1>
            <p>Collections + default questions. Click into a collection or a question for details.</p>
          </div>

          <div style={{ display: 'flex', gap: 8 }} suppressHydrationWarning>
            <button
              className="neo-btn neo-btn-white"
              aria-pressed={viewMode === 'card'}
              onClick={() => setViewMode('card')}
              style={{ opacity: mounted ? 1 : 0, pointerEvents: mounted ? 'auto' : 'none' }}
            >
              <IconGrid size={16} style={{ marginRight: 6 }} />
            </button>
            <button
              className="neo-btn neo-btn-white"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              style={{ opacity: mounted ? 1 : 0, pointerEvents: mounted ? 'auto' : 'none' }}
            >
              <IconList size={16} style={{ marginRight: 6 }} />
            </button>
          </div>
        </div>
      </header>

      {pageError && <div className="questions-error">{pageError}</div>}

      {/* Unified view: collections + default questions */}
      <main className={viewMode === 'card' ? 'unified-main-grid' : 'unified-main-list'}>
        {viewMode === 'list' && (
          <div className="list-view-header">
            <div></div>
            <div>Name</div>
            <div>Type</div>
            <div>Collection</div>
            <div>Date Created</div>
            <div></div>
          </div>
        )}

        {viewMode === 'card' ? (
          <>
            {/* Collection cards */}
            {nonDefaultCollectionCards.map((c: any, idx: number) => {
              const cId = String(c.id)
              const isDragOver = dragOverCollectionId === cId
              return (
                <div
                  key={`collection-${cId}-${idx}`}
                  className={`unified-question-card${isDragOver ? ' drag-over' : ''}`}
                  style={{
                    borderLeft: `6px solid ${generateColorFromString(cId)}`,
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/app/collections/${cId}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') router.push(`/app/collections/${cId}`)
                  }}
                  onDragOver={(e) => {
                    // allow drop
                    e.preventDefault()
                    setDragOverCollectionId(cId)
                  }}
                  onDragLeave={() => {
                    setDragOverCollectionId((prev) => (prev === cId ? null : prev))
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const qId = e.dataTransfer.getData('application/x-question-id')
                    if (!qId) return
                    handleDropQuestionToCollection(cId, qId)
                  }}
                >
                  <div className="card-content">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
                      <IconFolder size={32} />
                      <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{c.title}</div>
                      <div style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        color: '#333',
                        textShadow: '0 0 3px white, 0 0 5px white',
                        lineHeight: 1,
                      }}>
                        {Array.isArray(c.questions) ? c.questions.length : 0}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 600 }}>
                        {Array.isArray(c.questions) && c.questions.length === 1 ? 'question' : 'questions'}
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="card-meta-tag">Collection</span>
                    <span className="card-meta-date">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )
            })}

            {/* All questions */}
            {allQuestionsWithCollection.map((q: any) => (
              <QuestionCard
                key={`question-${String(q.id)}`}
                question={q}
                collection={q.collection}
                onAction={handleAction}
                onClick={() => {
                  setSelectedQuestion(q)
                  setSelectedQuestionCollection(q.collection)
                  setIsModalOpen(true)
                }}
                draggable
              />
            ))}
          </>
        ) : (
          <>
            {/* List view - Collections */}
            {nonDefaultCollectionCards.map((c: any, idx: number) => {
              const cId = String(c.id)
              return (
                <div
                  key={`list-collection-${cId}-${idx}`}
                  className="list-view-row"
                  onClick={() => router.push(`/app/collections/${cId}`)}
                >
                  <div className="list-view-icon">
                    <IconFolder size={20} color={generateColorFromString(cId)} />
                  </div>
                  <div className="list-view-name">{c.title}</div>
                  <div className="list-view-type">Collection</div>
                  <div className="list-view-collection">—</div>
                  <div className="list-view-date">{new Date(c.created_at).toLocaleDateString()}</div>
                  <div className="list-view-actions">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button
                          className="card-action-btn"
                          aria-label="Collection Actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconMore size={16} />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content className="card-dropdown-content" sideOffset={5}>
                          <DropdownMenu.Item className="card-dropdown-item" onSelect={() => router.push(`/app/collections/${cId}`)}>
                            <IconFolder size={14} />
                            <span>Open Collection</span>
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="card-dropdown-separator" />
                          <DropdownMenu.Item className="card-dropdown-item danger" onSelect={() => window.alert('Delete collection')}>
                            <IconTrash size={14} />
                            <span>Delete</span>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              )
            })}

            {/* List view - Questions */}
            {allQuestionsWithCollection.map((q: any) => (
              <div
                key={`list-question-${String(q.id)}`}
                className="list-view-row"
                onClick={() => {
                  setSelectedQuestion(q)
                  setSelectedQuestionCollection(q.collection)
                  setIsModalOpen(true)
                }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-question-id', String(q.id))
                  e.dataTransfer.effectAllowed = 'move'
                }}
              >
                <div className="list-view-icon">
                  <IconEdit />
                </div>
                <div className="list-view-name">{q.content}</div>
                <div className="list-view-type">{q.question_type || 'Question'}</div>
                <div className="list-view-collection">
                  <IconFolder size={12} />
                  {q.collection?.title || 'Uncategorized'}
                </div>
                <div className="list-view-date">{new Date(q.created_at).toLocaleDateString()}</div>
                <div className="list-view-actions">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="card-action-btn"
                        aria-label="Question Actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconMore size={16} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className="card-dropdown-content" sideOffset={5}>
                        <DropdownMenu.Item className="card-dropdown-item" onSelect={() => handleAction('edit', q)}>
                          <IconEdit />
                          <span>Edit Question</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item className="card-dropdown-item" onSelect={() => handleAction('tags', q)}>
                          <IconTag size={14} />
                          <span>Manage Tags</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item className="card-dropdown-item" onSelect={() => handleAction('move', q)}>
                          <IconMove size={14} />
                          <span>Change Collection</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="card-dropdown-separator" />
                        <DropdownMenu.Item className="card-dropdown-item danger" onSelect={() => handleAction('delete', q)}>
                          <IconTrash size={14} />
                          <span>Delete</span>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>
            ))}
          </>
        )}
      </main>

      {(!allQuestions.length && !isProcessing) && (
        <div className="questions-empty">
          <p style={{ fontWeight: 900, fontSize: '1.25rem' }}>No questions found.</p>
          <p>Get started by creating a new question or collection.</p>
        </div>
      )}

      {(isProcessing || isLoading) && (
        <div className="loading-overlay">
          <div className="animate-bounce">Loading...</div>
        </div>
      )}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="fab" aria-label="Create new">
            <IconPlus size={24} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="card-dropdown-content" sideOffset={15} align="end">
            <DropdownMenu.Item className="card-dropdown-item" onSelect={() => handleCreate('question')}>
              <IconEdit />
              <span>New Question</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item className="card-dropdown-item" onSelect={() => handleCreate('collection')}>
              <IconFolder size={14} />
              <span>New Collection</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Question Detail Modal */}
      <QuestionDetailModal
        question={selectedQuestion}
        collection={selectedQuestionCollection}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedQuestion(null)
          setSelectedQuestionCollection(null)
        }}
      />
    </div>
  )
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="loading-overlay">Loading...</div>}>
      <QuestionsContent />
    </Suspense>
  )
}
