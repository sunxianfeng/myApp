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
import { getCollectionsWithQuestions, getCollectionsForAssignment, addQuestionsToCollection, getQuestions } from '@/lib/api'

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

// Collection Assignment Modal Component
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
              Assign to Collections
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
          {/* Question Preview */}
          <div style={{ 
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#FEFCE8',
            border: '2px solid black',
            borderRadius: '8px',
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.875rem' }}>Question</div>
            <div style={{ fontWeight: 500, fontSize: '0.9rem', lineHeight: '1.4' }}>
              {question.content.length > 100 ? `${question.content.substring(0, 100)}...` : question.content}
            </div>
          </div>

          {/* Collections List */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 900, marginBottom: '16px', fontSize: '1.125rem' }}>
              Select Collections
            </h3>
            
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
                Loading collections...
              </div>
            ) : availableCollections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
                No collections available. Create one first.
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
                    onMouseEnter={(e) => {
                      if (!selectedCollections.has(collection.id)) {
                        e.currentTarget.style.backgroundColor = '#F8FAFC'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedCollections.has(collection.id)) {
                        e.currentTarget.style.backgroundColor = 'white'
                      }
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
                    <div 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: generateColorFromString(collection.id),
                        border: '2px solid black',
                        borderRadius: '3px',
                        marginLeft: '8px',
                      }} 
                    />
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
              Cancel
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
              Assign ({selectedCollections.size})
            </button>
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
  // Handle unassigned questions with a special color and icon
  const isUnassigned = question.isUnassigned || collection?.id === 'unassigned' || !collection?.id
  const collectionColor = isUnassigned ? '#E5E7EB' : generateColorFromString(collection.id)
  const collectionTitle = isUnassigned ? 'Uncategorized' : (collection?.title || 'Uncategorized')

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

  // Modal state for collection assignment
  const [assignmentQuestion, setAssignmentQuestion] = useState<any>(null)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)

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
        const [collectionsData, allQuestionsData] = await Promise.all([
          getCollectionsWithQuestions(),
          getQuestions({ limit: 1000 }) // Fetch all questions
        ])

        if (Array.isArray(collectionsData)) {
          setCollectionsWithQuestions(collectionsData)
        } else {
          setCollectionsWithQuestions([])
        }

        // Set all questions (will be filtered to show only unassigned ones)
        if (allQuestionsData && Array.isArray(allQuestionsData.questions)) {
          setAllQuestions(allQuestionsData.questions)
        } else if (Array.isArray(allQuestionsData)) {
          setAllQuestions(allQuestionsData)
        } else {
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
    if (!allQuestions.length) return [];
    
    // Create a map of question ID to collections for quick lookup
    const questionToCollectionsMap = new Map<string, any[]>();
    
    if (collectionsWithQuestions) {
      collectionsWithQuestions.forEach((collection: any) => {
        if (!collection || !Array.isArray(collection.questions)) return;
        collection.questions.forEach((question: any) => {
          const questionId = String(question.id);
          if (!questionToCollectionsMap.has(questionId)) {
            questionToCollectionsMap.set(questionId, []);
          }
          questionToCollectionsMap.get(questionId)!.push(collection);
        });
      });
    }
    
    // Map all questions and assign their collection info
    return allQuestions.map((question: any) => {
      const questionId = String(question.id);
      const assignedCollections = questionToCollectionsMap.get(questionId) || [];
      
      // For display purposes, show the first collection or mark as uncategorized
      const primaryCollection = assignedCollections.length > 0 
        ? assignedCollections[0]
        : { id: 'unassigned', title: 'Uncategorized' };
      
      return {
        ...question,
        collection: primaryCollection,
        assignedCollections, // Store all collections this question belongs to
        isUnassigned: assignedCollections.length === 0,
      };
    });
  }, [allQuestions, collectionsWithQuestions]);

  // Only show unassigned questions (questions not in any collection)
  const filteredQuestions = useMemo(() => {
    return allQuestionsWithCollection.filter(q => q.isUnassigned);
  }, [allQuestionsWithCollection]);

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
        setAssignmentQuestion(payload)
        setIsAssignmentModalOpen(true)
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

  const handleAssignToCollections = async (collectionIds: string[]) => {
    if (!assignmentQuestion || collectionIds.length === 0) return

    try {
      setIsProcessing(true)
      
      // Assign question to each selected collection
      await Promise.all(
        collectionIds.map(collectionId =>
          addQuestionsToCollection(collectionId, [assignmentQuestion.id])
        )
      )

      // Refresh both collections and all questions data to reflect changes
      const [collectionsData, allQuestionsData] = await Promise.all([
        getCollectionsWithQuestions(),
        getQuestions({ limit: 1000 })
      ])

      if (Array.isArray(collectionsData)) {
        setCollectionsWithQuestions(collectionsData)
      }

      if (allQuestionsData && Array.isArray(allQuestionsData.questions)) {
        setAllQuestions(allQuestionsData.questions)
      } else if (Array.isArray(allQuestionsData)) {
        setAllQuestions(allQuestionsData)
      }

      // Show success message
      window.alert(`Question assigned to ${collectionIds.length} collection(s) successfully!`)
    } catch (e: any) {
      console.error('Failed to assign question:', e)
      setPageError(e?.message || 'Failed to assign question to collections.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDropQuestionToCollection = async (collectionId: string, questionId: string) => {
    try {
      setIsProcessing(true)
      
      await dispatch(addQuestionsToCol({ collectionId, questionIds: [questionId] })).unwrap()

      // Small delay to ensure backend processing is complete
      await new Promise(resolve => setTimeout(resolve, 500))

      // Refresh both collections and all questions data to reflect changes
      const [collectionsData, allQuestionsData] = await Promise.all([
        getCollectionsWithQuestions(),
        getQuestions({ limit: 1000 })
      ])

      if (Array.isArray(collectionsData)) {
        setCollectionsWithQuestions(collectionsData)
      }

      if (allQuestionsData && Array.isArray(allQuestionsData.questions)) {
        setAllQuestions(allQuestionsData.questions)
      } else if (Array.isArray(allQuestionsData)) {
        setAllQuestions(allQuestionsData)
      }

      // Also refresh the Redux collections state to keep it in sync
      await dispatch(fetchCollections()).unwrap()
    } catch (e: any) {
      console.error('Failed to move question:', e)
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
            <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#374151', margin: 0 }}>
              Drag questions into collections to organize them.
            </p>
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
                  <div className="card-header" style={{ backgroundColor: generateColorFromString(cId), opacity: 0.7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconFolder size={16} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.title}</span>
                    </div>
                  </div>
                  <div className="card-content">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', height: '100%' }}>
                      <div style={{
                        fontSize: '2rem',
                        fontWeight: 400,
                        color: '#333',
                        textShadow: '0 0 3px white, 0 0 5px white',
                        lineHeight: 1,
                        margin: '8px 0',
                      }}>
                        {Array.isArray(c.questions) ? c.questions.length : 0}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>
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
            {filteredQuestions.map((q: any) => (
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
            {filteredQuestions.map((q: any) => (
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
                  <span style={{ 
                    color: q.isUnassigned ? '#9CA3AF' : 'inherit',
                    fontStyle: q.isUnassigned ? 'italic' : 'normal'
                  }}>
                    {q.collection?.title || 'Uncategorized'}
                  </span>
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

      {/* Collection Assignment Modal */}
      <CollectionAssignmentModal
        question={assignmentQuestion}
        isOpen={isAssignmentModalOpen}
        onClose={() => {
          setIsAssignmentModalOpen(false)
          setAssignmentQuestion(null)
        }}
        onAssign={handleAssignToCollections}
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
