'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { FileText, Folder, Tag, MoreHorizontal, Edit, Trash2, Plus, ChevronsUpDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import type { AppDispatch } from '@/lib/store'
import {
  addCollection,
  addQuestionsToCol,
  fetchCollections,
  removeQuestionFromCol,
  selectCollections,
  selectCollectionLoading,
} from '@/lib/slices/collectionSlice'
import { getCollection, getQuestions } from '@/lib/api'

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

const QuestionCard = ({ question, collection, onAction }: { question: any, collection: any, onAction: (action: string, payload: any) => void }) => {
  const collectionColor = collection ? generateColorFromString(collection.id) : '#E5E7EB'

  return (
    <div className="unified-question-card" style={{ borderLeftColor: collectionColor }}>
      <div className="card-header">
        <div className="collection-tag">
          <Folder size={14} style={{ marginRight: '6px' }} />
          {collection?.title || 'Uncategorized'}
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="card-action-btn" aria-label="Question Actions">
              <MoreHorizontal size={20} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="card-dropdown-content" sideOffset={5}>
              <DropdownMenu.Item className="card-dropdown-item" onSelect={() => onAction('edit', question)}>
                <Edit size={14} />
                <span>Edit Question</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item className="card-dropdown-item" onSelect={() => onAction('tags', question)}>
                <Tag size={14} />
                <span>Manage Tags</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item className="card-dropdown-item" onSelect={() => onAction('move', question)}>
                <ChevronsUpDown size={14} />
                <span>Change Collection</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="card-dropdown-separator" />
              <DropdownMenu.Item
                className="card-dropdown-item danger"
                onSelect={() => onAction('delete', question)}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <div className="card-content">
        {question.content}
      </div>
      <div className="card-footer">
        <span className="card-meta-tag">{question.question_type}</span>
        <span className="card-meta-date">
          {new Date(question.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

const QuestionsContent = () => {
  const dispatch = useDispatch<AppDispatch>()
  const collections = useSelector(selectCollections)
  const isLoading = useSelector(selectCollectionLoading)

  const [allQuestions, setAllQuestions] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    const loadInitialData = async () => {
      setIsProcessing(true)
      setPageError(null)
      try {
        // Fetch all collections to map questions to them
        await dispatch(fetchCollections()).unwrap()
        
        // Fetch all questions
        const questionsResponse = await getQuestions({ limit: 1000 }) // Fetch a large number
        if (Array.isArray(questionsResponse.questions)) {
          setAllQuestions(questionsResponse.questions)
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

  const handleAction = (action: string, payload: any) => {
    console.log('Action:', action, 'Payload:', payload)
    // Implement action handlers here (e.g., open modals, dispatch updates)
    switch (action) {
      case 'edit':
        // Open edit modal for payload (question)
        window.alert(`Editing: ${payload.content}`)
        break
      case 'delete':
        // Show confirmation and then delete
        if (window.confirm(`Are you sure you want to delete this question?`)) {
          // dispatch(deleteQuestion(payload.id))
        }
        break
      case 'move':
        // Show collection selection modal
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
      // Open create question modal/page
      window.alert('Creating a new question...')
    }
  }

  const questionsWithCollection = useMemo(() => {
    if (!collections.length) return allQuestions.map(q => ({ ...q, collection: null }))

    const collectionMap = new Map(collections.map((c: any) => [c.id, c]))

    // This is a simplified mapping. In a real scenario, you'd fetch questions per collection
    // or have collection_id on the question object. Here, we simulate it.
    // Let's assume `source_document_id` can act as a grouping key similar to collection_id for now.
    return allQuestions.map(q => {
      const collection = collectionMap.get(q.source_document_id) || collections.find((c:any) => c.title === 'Default') || collections[0]
      return { ...q, collection }
    })
  }, [allQuestions, collections])

  return (
    <div className="unified-questions-page">
      <header className="unified-header">
        <h1>All Questions</h1>
        <p>A unified view of all questions across your collections.</p>
      </header>

      {pageError && <div className="questions-error">{pageError}</div>}

      <main className="unified-main-grid">
        {questionsWithCollection.map(q => (
          <QuestionCard
            key={q.id}
            question={q}
            collection={q.collection}
            onAction={handleAction}
          />
        ))}
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
            <Plus size={24} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="card-dropdown-content" sideOffset={15} align="end">
            <DropdownMenu.Item className="card-dropdown-item" onSelect={() => handleCreate('question')}>
              <Edit size={14} />
              <span>New Question</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item className="card-dropdown-item" onSelect={() => handleCreate('collection')}>
              <Folder size={14} />
              <span>New Collection</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
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
