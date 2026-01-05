'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getQuestion } from '@/lib/api'
import MathRenderer from '@/components/common/MathRenderer'

export default function QuestionDetailPage() {
  const router = useRouter()
  const params = useParams()

  const questionId = useMemo(() => (params?.id as string) || '', [params])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [question, setQuestion] = useState<any | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!questionId) return
      setIsLoading(true)
      setError(null)
      try {
        const q = await getQuestion(questionId)
        setQuestion(q)
      } catch (e: any) {
        setError(e?.message || 'Failed to load question.')
      } finally {
        setIsLoading(false)
      }
    }

    run()
  }, [questionId])

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => router.back()} style={{ marginBottom: 16 }}>
          ← Back
        </button>
        <div style={{ color: '#b91c1c', fontWeight: 700 }}>{error || 'Question not found'}</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <button onClick={() => router.back()} style={{ marginBottom: 16 }}>
        ← Back
      </button>

      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Question Detail</h1>
      <div style={{ color: '#6B7280', marginBottom: 16 }}>ID: {question.id}</div>

      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 16, background: 'white' }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Content</div>
        <div style={{ lineHeight: 1.6 }}>
          <MathRenderer content={question.content} />
        </div>

        <hr style={{ margin: '16px 0', borderColor: '#E5E7EB' }} />

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: '#374151' }}>
          <div>
            <span style={{ color: '#6B7280' }}>Type:</span> {question.question_type}
          </div>
          <div>
            <span style={{ color: '#6B7280' }}>Created:</span>{' '}
            {question.created_at ? new Date(question.created_at).toLocaleString() : '—'}
          </div>
        </div>

        {question.options?.length ? (
          <>
            <hr style={{ margin: '16px 0', borderColor: '#E5E7EB' }} />
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Options</div>
            <ul style={{ marginLeft: 18 }}>
              {question.options.map((o: any, idx: number) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  <strong>{o.label}.</strong> <MathRenderer content={o.content} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  )
}
