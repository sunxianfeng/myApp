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
        <span className="card-meta-tag">{question.question_type || 'N/A'}</span>
        <span className="card-meta-date">{new Date(question.created_at || question.added_at).toLocaleDateString()}</span>
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
      {/* Header */}
      <header className="unified-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <button
              onClick={() => router.push('/app/questions')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#3B82F6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
              <IconArrowLeft size={16} />
              Back to Questions
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>
                {collection.title}
              </h1>
              {collection.is_favorite && <span style={{ fontSize: '2rem' }}>⭐</span>}
            </div>
            
            <p style={{ fontSize: '1rem', color: '#6B7280', marginBottom: '1rem' }}>
              {collection.description || 'No description'}
            </p>
            
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: '#6B7280' }}>
              <span style={{ fontWeight: 600 }}>📚 {collection.question_count} questions</span>
              <span style={{ fontWeight: 600 }}>🎯 {collection.total_practiced} practices</span>
              <span style={{ fontWeight: 600 }}>📅 {new Date(collection.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          <button
            onClick={handleToggleFavorite}
            style={{
              padding: '12px 24px',
              border: '3px solid black',
              borderRadius: '8px',
              backgroundColor: collection.is_favorite ? '#FEF3C7' : 'white',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '4px 4px 0 rgba(0,0,0,1)',
              transition: 'all 0.2s',
            }}
          >
            {collection.is_favorite ? <><IconStar size={16} style={{ display: 'inline', marginRight: '6px' }} /> Unfavorite</> : 'Add to Favorites'}
          </button>
        </div>
      </header>
      
      {/* Toolbar */}
      <div style={{
        backgroundColor: 'white',
        border: '3px solid black',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        boxShadow: '4px 4px 0 rgba(0,0,0,1)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '8px 12px',
                border: '2px solid black',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <option value="added">By Added Time</option>
              <option value="mastery">By Mastery Level</option>
              <option value="practiced">By Practice Count</option>
            </select>
            
            {/* Filter by mastery */}
            <select
              value={filterMastery}
              onChange={(e) => setFilterMastery(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '2px solid black',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Mastery Levels</option>
              <option value="0">Not Mastered (0)</option>
              <option value="1">Poor (1)</option>
              <option value="2">Fair (2)</option>
              <option value="3">Good (3)</option>
              <option value="4">Excellent (4)</option>
              <option value="5">Perfect (5)</option>
            </select>
            
            {/* View toggle */}
            <div style={{ display: 'flex', border: '2px solid black', borderRadius: '6px', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('card')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: viewMode === 'card' ? '#3B82F6' : 'white',
                  color: viewMode === 'card' ? 'white' : 'black',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: viewMode === 'list' ? '#3B82F6' : 'white',
                  color: viewMode === 'list' ? 'white' : 'black',
                  border: 'none',
                  borderLeft: '2px solid black',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                List
              </button>
            </div>
          </div>
          
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6B7280' }}>
            {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      
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
                // Open question detail modal or navigate
                console.log('Question clicked:', question.id)
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
                      {question.question_type || 'N/A'}
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
              maxWidth: '500px',
              width: '100%',
              border: '4px solid black',
              boxShadow: '8px 8px 0 rgba(0, 0, 0, 1)',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '20px' }}>Edit Question Notes</h2>
            
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
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '0.875rem' }}>
                Mastery Level: {masteryLevel}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                value={masteryLevel}
                onChange={(e) => setMasteryLevel(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                <span>0 - Not Mastered</span>
                <span>5 - Perfect</span>
              </div>
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
