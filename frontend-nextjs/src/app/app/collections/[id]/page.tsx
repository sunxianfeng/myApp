'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  Folder as IconFolder,
  MoreHorizontal as IconMore,
  Trash2 as IconTrash,
  Tag as IconTag,
  Edit as IconEdit,
  Star as IconStar,
  ArrowLeft as IconArrowLeft,
  X as IconX,
} from 'lucide-react'

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
import '../../questions/questions-neobrutalism.css'

// Helper to generate a consistent, visually appealing color from a string
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

          {/* Options (if available) - only show for multiple choice questions */}
          {question.options && question.question_type !== 'fill_blank' && question.question_type !== 'fill-blank' && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>Options</h3>
              <div style={{ 
                padding: '16px',
                backgroundColor: '#EFF6FF',
                border: '3px solid black',
                borderRadius: '8px',
              }}>
                {(() => {
                  // Helper function to format options
                  const formatOptions = () => {
                    let options = question.options
                    
                    // Parse options if it's a string
                    if (typeof options === 'string') {
                      try {
                        options = JSON.parse(options)
                      } catch {
                        // If it fails to parse, treat as plain text
                        return <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{options}</div>
                      }
                    }
                    
                    // If it's an array, format as A, B, C, D...
                    if (Array.isArray(options)) {
                      const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
                      return (
                        <div style={{ fontSize: '0.9rem', lineHeight: '1.8' }}>
                          {options.map((option, index) => (
                            <div key={index} style={{ marginBottom: '8px' }}>
                              <strong>{optionLabels[index] || index + 1}. </strong>
                              {typeof option === 'object' ? option.text || option.content || JSON.stringify(option) : option}
                            </div>
                          ))}
                        </div>
                      )
                    }
                    
                    // If it's an object, try to extract options
                    if (typeof options === 'object' && options !== null) {
                      const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
                      const optionEntries = Object.entries(options)
                      
                      if (optionEntries.length > 0) {
                        return (
                          <div style={{ fontSize: '0.9rem', lineHeight: '1.8' }}>
                            {optionEntries.map(([key, value], index) => (
                              <div key={key} style={{ marginBottom: '8px' }}>
                                <strong>{optionLabels[index] || key}. </strong>
                                {typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
                              </div>
                            ))}
                          </div>
                        )
                      }
                    }
                    
                    // Fallback to original display
                    return (
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                        {JSON.stringify(options, null, 2)}
                      </pre>
                    )
                  }
                  
                  return formatOptions()
                })()}
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
              <div style={{ fontWeight: 900 }}>{new Date(question.created_at || question.added_at).toLocaleDateString()}</div>
            </div>
            
            {/* Collection-specific fields */}
            {question.mastery_level !== undefined && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>Mastery Level</div>
                <div style={{ fontWeight: 900 }}>{question.mastery_level}/5</div>
              </div>
            )}
            
            {question.times_practiced !== undefined && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>Times Practiced</div>
                <div style={{ fontWeight: 900 }}>{question.times_practiced}</div>
              </div>
            )}
            
            {question.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '8px', color: '#6B7280' }}>Notes</div>
                <div style={{ 
                  padding: '12px',
                  backgroundColor: '#F8FAFC',
                  border: '2px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                }}>
                  {question.notes}
                </div>
              </div>
            )}
            
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

// Question Card Component (matching questions page style)
const QuestionCard = ({
  question,
  collection,
  onAction,
  onClick,
}: {
  question: any
  collection: any
  onAction: (action: string, payload: any) => void
  onClick?: () => void
}) => {
  const collectionColor = collection?.id ? generateColorFromString(collection.id) : '#E5E7EB'
  const collectionTitle = collection?.title || 'Uncategorized'

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
    >
      <div className="card-header">
        <div className="collection-tag">
          <IconFolder size={14} style={{ marginRight: '6px' }} />
          {collectionTitle}
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
                <IconEdit size={14} />
                <span>Edit Notes</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="card-dropdown-item"
                onSelect={() => onAction('tags', question)}
              >
                <IconTag size={14} />
                <span>Manage Tags</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="card-dropdown-separator" />
              <DropdownMenu.Item
                className="card-dropdown-item danger"
                onSelect={() => onAction('remove', question)}
              >
                <IconTrash size={14} />
                <span>Remove from Collection</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <div className="card-content">{question.content}</div>
      <div className="card-footer">
        <span className="card-meta-tag">{(question as any).question_type || (question as any).type || 'N/A'}</span>
        <span className="card-meta-date">{new Date((question as any).created_at || question.added_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

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
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Modal state for question details
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  
  useEffect(() => {
    if (collectionId) {
      dispatch(fetchCollection({ id: collectionId, includeQuestions: true }))
    }
    
    return () => {
      dispatch(clearCurrentCollection())
    }
  }, [collectionId, dispatch])
  
  const handleRemoveQuestion = async (questionId: string) => {
    if (confirm('Are you sure you want to remove this question from the collection?')) {
      try {
        setIsProcessing(true)
        await dispatch(removeQuestionFromCol({ collectionId, questionId })).unwrap()
        // Refresh the collection data
        await dispatch(fetchCollection({ id: collectionId, includeQuestions: true }))
      } catch (error) {
        console.error('Failed to remove question:', error)
        alert('Failed to remove question from collection')
      } finally {
        setIsProcessing(false)
      }
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
  
  const handleAction = (action: string, payload: any) => {
    switch (action) {
      case 'edit':
        handleStartEdit(payload)
        break
      case 'tags':
        alert('Manage tags feature coming soon...')
        break
      case 'remove':
        handleRemoveQuestion(payload.id)
        break
      default:
        break
    }
  }
  
  // Sort and filter
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
      <div className="unified-questions-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '2rem' }}>⏳</div>
          <p style={{ marginTop: '1rem', fontWeight: 700 }}>Loading...</p>
        </div>
      </div>
    )
  }
  
  if (error || !collection) {
    return (
      <div className="unified-questions-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#EF4444', marginBottom: '1rem', fontWeight: 700 }}>{error || 'Collection not found'}</p>
          <button
            onClick={() => router.back()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: '3px solid black',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '4px 4px 0 rgba(0,0,0,1)',
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="unified-questions-page">
      {/* Header - Responsive */}
      <header className="unified-header">
        <div style={{ marginBottom: '2rem' }}>
          {/* 改进面包屑导航 */}
          <nav style={{ 
            marginBottom: '1.5rem', 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center', 
            fontSize: '0.875rem', 
            fontWeight: 700 
          }}>
            <button
              onClick={() => router.push('/app/questions')}
              style={{
                color: '#9CA3AF',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.875rem',
                padding: 0,
              }}
            >
              我的错题本
            </button>
            <span style={{ color: '#9CA3AF' }}>/</span>
            <span style={{ color: '#000' }}>{collection.title}</span>
          </nav>
          
          {/* 紧凑型 Header 布局 */}
          <div
            style={{
              backgroundColor: 'white',
              border: '3px solid black',
              borderRadius: '16px',
              padding: '0',
              marginBottom: '20px',
              boxShadow: '6px 6px 0 rgba(0,0,0,1)',
              overflow: 'hidden',
            }}
          >
            {/* 顶栏：标题与操作 */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '3px solid black',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {collection.title}
                </h1>
                {collection.is_favorite && (
                  <span style={{ 
                    fontSize: '1.5rem', 
                    lineHeight: 1,
                    flexShrink: 0,
                  }}>
                    ⭐
                  </span>
                )}
                <span style={{ 
                  padding: '4px 12px', 
                  backgroundColor: '#E5E7EB', 
                  border: '2px solid black', 
                  borderRadius: '20px', 
                  fontSize: '0.75rem', 
                  fontWeight: 900 
                }}>
                  {filteredQuestions.length} ITEMS
                </span>
              </div>
              
              <button
                onClick={handleToggleFavorite}
                style={{
                  padding: '8px 16px',
                  border: '2px solid black',
                  borderRadius: '8px',
                  backgroundColor: collection.is_favorite ? '#FEF3C7' : 'white',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0 rgba(0,0,0,1)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexShrink: 0,
                  fontSize: '0.875rem',
                }}
              >
                {collection.is_favorite ? (
                  <>
                    <IconStar size={16} fill="currentColor" />
                    <span>Unfavorite</span>
                  </>
                ) : (
                  <>
                    <IconStar size={16} />
                    <span>Favorite</span>
                  </>
                )}
              </button>
            </div>

            {/* 底栏：紧凑型控制器 */}
            <div style={{
              padding: '12px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'white',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    padding: '6px 10px',
                    border: '2px solid black',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="added">Recently Added</option>
                  <option value="mastery">Mastery Level</option>
                  <option value="practiced">Practice Count</option>
                </select>

                <select
                  value={filterMastery}
                  onChange={(e) => setFilterMastery(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  style={{
                    padding: '6px 10px',
                    border: '2px solid black',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="all">All Mastery</option>
                  <option value="0">Level 0</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
              </div>

              <div style={{ 
                display: 'flex', 
                border: '2px solid black', 
                borderRadius: '6px', 
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setViewMode('card')}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: viewMode === 'card' ? '#3B82F6' : 'white',
                    color: viewMode === 'card' ? 'white' : 'black',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Card
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: viewMode === 'list' ? '#3B82F6' : 'white',
                    color: viewMode === 'list' ? 'white' : 'black',
                    border: 'none',
                    borderLeft: '2px solid black',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Description - only if exists and not the default Chinese text */}
          {collection.description && collection.description !== '从题目管理页面创建' && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{
                fontSize: '1rem',
                color: '#6B7280',
                lineHeight: 1.6,
                maxWidth: '800px',
              }}>
                {collection.description}
              </p>
            </div>
          )}
        </div>
      </header>
      
      {/* Questions Grid - Card View */}
      {viewMode === 'card' && (
        <main className="unified-main-grid">
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              collection={collection}
              onAction={handleAction}
              onClick={() => {
                setSelectedQuestion(question)
                setIsQuestionModalOpen(true)
              }}
            />
          ))}
          
          {filteredQuestions.length === 0 && (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '4rem',
              color: '#6B7280',
            }}>
              <p style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '8px' }}>No questions found</p>
              <p>Try adjusting your filters or add some questions to this collection.</p>
            </div>
          )}
        </main>
      )}
      
      {/* Questions List - List View */}
      {viewMode === 'list' && (
        <div style={{
          backgroundColor: 'white',
          border: '3px solid black',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '4px 4px 0 rgba(0,0,0,1)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#F3F4F6', borderBottom: '2px solid black' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>#</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>Content</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>Mastery</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>Practiced</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((question, index) => (
                <tr key={question.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{index + 1}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', maxWidth: '400px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {question.content}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                    <span style={{ padding: '4px 8px', backgroundColor: '#DBEAFE', color: '#1E40AF', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {(question as any).question_type || (question as any).type || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{ 
                            height: '100%', 
                            backgroundColor: '#10B981', 
                            width: `${((question.mastery_level || 0) / 5) * 100}%`,
                            transition: 'width 0.3s'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>{question.mastery_level || 0}/5</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#6B7280' }}>
                    {question.times_practiced || 0}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleStartEdit(question)}
                        style={{
                          color: '#3B82F6',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveQuestion(question.id)}
                        style={{
                          color: '#EF4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredQuestions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                    <p style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '8px' }}>No questions found</p>
                    <p>Try adjusting your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Edit Modal */}
      {editingQuestion && (
        <div 
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
          onClick={() => setEditingQuestion(null)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '450px',
              width: '100%',
              border: '4px solid black',
              boxShadow: '8px 8px 0 rgba(0, 0, 0, 1)',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.5rem' }}>Update Progress</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Mastery Level
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setMasteryLevel(level)}
                    style={{
                      flex: 1,
                      height: '40px',
                      border: '2px solid black',
                      borderRadius: '6px',
                      backgroundColor: masteryLevel === level ? '#22C55E' : 'white',
                      color: masteryLevel === level ? 'white' : 'black',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: masteryLevel === level ? 'none' : '2px 2px 0 black',
                      transition: 'all 0.2s',
                      fontSize: '0.875rem',
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280', marginTop: '8px' }}>
                <span>Not Mastered</span>
                <span>Perfect</span>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '0.875rem' }}>Notes</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid black',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                rows={4}
                placeholder="Add your notes here..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingQuestion(null)}
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
                Cancel
              </button>
              <button
                onClick={() => handleUpdateQuestion(editingQuestion)}
                style={{
                  padding: '12px 24px',
                  border: '3px solid black',
                  borderRadius: '8px',
                  backgroundColor: '#22C55E',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Question Detail Modal */}
      <QuestionDetailModal
        question={selectedQuestion}
        collection={collection}
        isOpen={isQuestionModalOpen}
        onClose={() => {
          setSelectedQuestion(null)
          setIsQuestionModalOpen(false)
        }}
      />
      
      {/* Loading Overlay */}
      {(isProcessing || isLoading) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>Processing...</div>
          </div>
        </div>
      )}
    </div>
  )
}
