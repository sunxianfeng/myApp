'use client'

import './result-neobrutalism.css'
import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { AppDispatch, RootState } from '@/lib/store'
import { clearUploadResult, loadFromStorage, saveToStorage, clearStorage, STORAGE_KEYS } from '@/lib/slices/uploadSlice'
import { backgroundTaskManager } from '@/lib/backgroundTaskManager'
import { bulkCreateQuestions } from '@/lib/api'
import {
  fetchCollections,
  addCollection,
  addQuestionsToCol,
  selectCollections,
  selectCollectionSaving
} from '@/lib/slices/collectionSlice'
import type { CollectionCreate } from '@/types/api'
import MathRenderer from '@/components/common/MathRenderer'

const questionTypeMap: Record<string, string> = {
  multiple_choice: '选择题',
  fill_blank: '填空题',
  true_false: '判断题',
  essay: '解答题',
}

// Accept Next.js 16 page props to prevent hydration mismatch
interface PageProps {
  params?: Promise<any> | any
  searchParams?: Promise<any> | any
}

const UploadResultPage = (props: PageProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const resultFromStore = useSelector((state: RootState) => state.upload.latestResult)

  // Prevent fallback effects from overwriting a real result.
  const hasRealResultRef = useRef(false)

  // persistent debug appender
  const appendDebug = (key: string, ...parts: any[]) => {
    try {
      if (typeof window === 'undefined') return
      const prev = JSON.parse(localStorage.getItem(key) || '[]')
      prev.push({ ts: Date.now(), payload: parts })
      localStorage.setItem(key, JSON.stringify(prev))
    } catch (e) {
      // ignore
    }
  }

  // Use `undefined` as "initializing" state to avoid briefly rendering the empty-state.
  // IMPORTANT: Always initialize with undefined to match server-side rendering
  // and prevent hydration mismatch. Load data in useEffect after mount.
  const [result, setResult] = useState<any>(undefined)

  // Poll for background task completion
  useEffect(() => {
    // First, check if we have a result from Redux store
    if (resultFromStore && !hasRealResultRef.current) {
      hasRealResultRef.current = true
      setResult(normalizeResultShape(resultFromStore))
      return
    }

    // Check if there's a background task running (or completed) - prefer authoritative task store
    const taskStatus = loadFromStorage(STORAGE_KEYS.TASK_STATUS)
    const taskId = loadFromStorage(STORAGE_KEYS.TASK_ID)
    const taskResult = loadFromStorage(STORAGE_KEYS.TASK_RESULT)
    const timestamp = loadFromStorage(STORAGE_KEYS.TASK_TIMESTAMP)

    console.log('[result] onMount storage:', { taskId, taskStatus, taskResult, timestamp })
    appendDebug('debug_result_logs', '[result] onMount storage', { taskId, taskStatus, taskResult, timestamp })

    // Check if task is too old (older than 30 minutes)
    const isTaskExpired = timestamp && Date.now() - timestamp > 30 * 60 * 1000

    const tryRecoverNewestCompletedTask = () => {
      try {
        if (typeof window === 'undefined') return null
        let newest: { ts: number; result: any } | null = null
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('task-')) {
            try {
              const raw = localStorage.getItem(key)
              if (!raw) continue
              const t = JSON.parse(raw)
              if (t && t.status === 'completed' && t.result) {
                if (!newest || t.timestamp > newest.ts) {
                  newest = { ts: t.timestamp, result: t.result }
                }
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
        return newest
      } catch (e) {
        return null
      }
    }

    // If result exists and is not expired, load it
    if (taskResult && !isTaskExpired && taskStatus === 'completed') {
      hasRealResultRef.current = true
      setResult(normalizeResultShape(taskResult))
      return
    }

    // If we have a taskId but storage doesn't clearly indicate running/completed,
    // consult the backgroundTaskManager authoritative task entry. This covers cases
    // where tasks are persisted under keys like `task-<id>` but the simple STORAGE_KEYS
    // weren't updated (e.g. navigation race or recovery scenarios).
    if (typeof taskId === 'string' && taskId) {
      try {
        const immediateTask = backgroundTaskManager.getTask(taskId)
        if (immediateTask) {
          appendDebug('debug_result_logs', '[result] immediateTask read', immediateTask)
          console.log('[result] immediateTask read:', immediateTask)

          if (immediateTask.status === 'completed' && immediateTask.result) {
            hasRealResultRef.current = true
            const normalized = normalizeResultShape(immediateTask.result)
            setResult(normalized)
            saveToStorage(STORAGE_KEYS.TASK_RESULT, normalized)
            saveToStorage(STORAGE_KEYS.TASK_STATUS, 'completed')
            saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
            return
          }

          if (immediateTask.status === 'failed') {
            appendDebug('debug_result_logs', '[result] immediateTask failed', immediateTask.error)
            // Clear stale storage status so UI can recover
            clearStorage([STORAGE_KEYS.TASK_STATUS, STORAGE_KEYS.TASK_TIMESTAMP])
            return
          }

          // If it's running, start polling.
          if (immediateTask.status === 'running' && !isTaskExpired) {
            return backgroundTaskManager.pollForCompletion(
              taskId,
              (realResult) => {
                hasRealResultRef.current = true
                console.log('[result] polled realResult:', realResult)
                appendDebug('debug_result_logs', '[result] polled realResult', realResult)
                const normalized = normalizeResultShape(realResult)
                setResult(normalized)

                // Persist so other pages (and future loads) can pick it up consistently.
                saveToStorage(STORAGE_KEYS.TASK_RESULT, normalized)
                saveToStorage(STORAGE_KEYS.TASK_STATUS, 'completed')
                saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())

                // Show notification
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('题目识别完成！', {
                    body: '点击查看识别结果。',
                    icon: '/favicon.ico',
                    requireInteraction: true,
                  })
                }
              },
              (error) => {
                alert(error || '任务执行失败，请重试')
                clearStorage([STORAGE_KEYS.TASK_STATUS, STORAGE_KEYS.TASK_TIMESTAMP])
              }
            )
          }
        }
      } catch (e) {
        console.error('Failed to read immediateTask:', e)
      }
    }

    // Fallback: if no authoritative task was found using TASK_ID, scan all `task-` keys
    // and pick the newest completed task result.
    const newest = tryRecoverNewestCompletedTask()
    if (newest) {
      appendDebug('debug_result_logs', '[result] fallback newest completed task found', { ts: newest.ts })
      hasRealResultRef.current = true
      const normalized = normalizeResultShape(newest.result)
      setResult(normalized)
      saveToStorage(STORAGE_KEYS.TASK_RESULT, normalized)
      saveToStorage(STORAGE_KEYS.TASK_STATUS, 'completed')
      saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
      return
    }

    // Recovery loop: for a short window after navigation, keep trying to recover
    // (handles localStorage races and cases where completion lands right after mount).
    if (!isTaskExpired && (taskId || taskStatus === 'running')) {
      const startedAt = Date.now()
      const intervalId = window.setInterval(() => {
        if (hasRealResultRef.current) {
          window.clearInterval(intervalId)
          return
        }

        const latestTaskId = loadFromStorage(STORAGE_KEYS.TASK_ID)
        if (typeof latestTaskId === 'string' && latestTaskId) {
          const t = backgroundTaskManager.getTask(latestTaskId)
          if (t?.status === 'completed' && t.result) {
            hasRealResultRef.current = true
            const normalized = normalizeResultShape(t.result)
            setResult(normalized)
            saveToStorage(STORAGE_KEYS.TASK_RESULT, normalized)
            saveToStorage(STORAGE_KEYS.TASK_STATUS, 'completed')
            saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
            window.clearInterval(intervalId)
            return
          }
        }

        const newest2 = tryRecoverNewestCompletedTask()
        if (newest2) {
          hasRealResultRef.current = true
          const normalized = normalizeResultShape(newest2.result)
          setResult(normalized)
          saveToStorage(STORAGE_KEYS.TASK_RESULT, normalized)
          saveToStorage(STORAGE_KEYS.TASK_STATUS, 'completed')
          saveToStorage(STORAGE_KEYS.TASK_TIMESTAMP, Date.now())
          window.clearInterval(intervalId)
          return
        }

        if (Date.now() - startedAt > 15_000) {
          window.clearInterval(intervalId)
          appendDebug('debug_result_logs', '[result] recovery timed out', {
            latestTaskId,
          })
          // Let the second effect decide the final state.
        }
      }, 500)

      return () => window.clearInterval(intervalId)
    }
  }, [resultFromStore]) // Add resultFromStore as dependency

  useEffect(() => {
    // Prefer store result when available
    if (resultFromStore) {
      hasRealResultRef.current = true
      setResult(normalizeResultShape(resultFromStore))
      return
    }

    // If we already hydrated a real result (from storage or polling), never overwrite it.
    if (hasRealResultRef.current) {
      return
    }

    // If storage already has a real result (or task is still running), do not overwrite it.
    const taskStatus = loadFromStorage(STORAGE_KEYS.TASK_STATUS)
    const taskResult = loadFromStorage(STORAGE_KEYS.TASK_RESULT)
    const taskId = loadFromStorage(STORAGE_KEYS.TASK_ID)
    const timestamp = loadFromStorage(STORAGE_KEYS.TASK_TIMESTAMP)
    const isTaskExpired = timestamp && Date.now() - timestamp > 30 * 60 * 1000

    if (!isTaskExpired) {
      if (taskStatus === 'completed' && taskResult) {
        hasRealResultRef.current = true
        console.log('[result] storage completed result (raw):', taskResult)
        appendDebug('debug_result_logs', '[result] storage completed result (raw)', taskResult)
        setResult(normalizeResultShape(taskResult))
        return
      }

      // While running, keep the page in "waiting" state; the polling effect will resolve it.
      if (taskStatus === 'running') {
        return
      }
    }

    // If we still have a taskId and it's not expired, don't show the empty-state yet.
    // This prevents flicker/false-negative when STORAGE_KEYS are briefly missing.
    const mockParam = new URLSearchParams(window.location.search).get('mock')
    const enableMock = mockParam === '1' || mockParam === 'true'
    if (enableMock) {
      const mockQuestions: any[] = [
        {
          id: 'mock-1',
          number: 1,
          question_type: 'multiple_choice',
          content: '下列关于 JavaScript 的说法正确的是（ ）。',
          full_content: '下列关于 JavaScript 的说法正确的是（ ）。',
          options: [
            { label: 'A', content: 'JavaScript 是一种编译型语言' },
            { label: 'B', content: 'JavaScript 主要运行在浏览器和 Node.js 环境中' },
            { label: 'C', content: 'JavaScript 只能用于前端开发' },
            { label: 'D', content: 'JavaScript 不能操作 DOM' },
          ],
        },
        {
          id: 'mock-2',
          number: 2,
          question_type: 'fill_blank',
          content: 'React 中用于管理组件状态的 Hook 是 ________。',
          full_content: 'React 中用于管理组件状态的 Hook 是 ________。',
          options: [],
        },
      ]

      setResult({
        data: {
          questions: mockQuestions,
          total_questions: mockQuestions.length,
          results: [{ filename: 'mock.png', success: true, total_questions: mockQuestions.length }],
          document_title: 'Mock 文档',
          filename: 'mock.png',
          file_type: 'image',
          file_size: undefined,
        },
      })
    } else {
      // Explicitly set to null to render the empty-state
      setResult(null)
    }
  }, [resultFromStore])

  const questions = result?.data?.questions ?? []

  // Accept both shapes: raw array (i.e. result is an array) or wrapped { data: { questions: [...] } }
  const normalizeResultShape = (r: any) => {
    if (!r) return null
    if (Array.isArray(r)) {
      return { data: { questions: r, total_questions: r.length, results: [] } }
    }
    // If it already looks like { data: { questions: [...] } }
    if (r.data && Array.isArray(r.data.questions)) return r
    // If r has questions directly
    if (r.questions && Array.isArray(r.questions)) return { data: { questions: r.questions, total_questions: r.questions.length, results: [] } }
    return r
  }
  interface EditableQuestion {
    id: string
    number: number
    question_type: string
    content: string
    full_content: string
    options: Array<{ label: string; content: string }>
    selected: boolean
    expanded: boolean
    editing: boolean
    draftContent: string
    draftOptions: Array<{ label: string; content: string }>
  }

  const [items, setItems] = useState<EditableQuestion[]>([])

  useEffect(() => {
    if (questions.length > 0) {
      setItems(questions.map((q: any, idx: number): EditableQuestion => ({
        id: q.id || `temp-${idx}`,
        number: q.number || idx + 1,
        question_type: q.type || q.question_type || 'multiple_choice',
        content: q.content,
        full_content: q.full_content || q.content,
        options: q.options || [],
        selected: false,
        expanded: true,
        editing: false,
        draftContent: q.full_content || q.content,
        draftOptions: (q.options || []).map((o: any) => ({ label: o.label, content: o.content }))
      })))
    }
  }, [questions])

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  const collections = useSelector(selectCollections)
  const isCollectionSaving = useSelector(selectCollectionSaving)
  const [mounted, setMounted] = useState(false)
  
  const totalQuestions = result?.data?.total_questions ?? questions.length
  const fileResults = result?.data?.results ?? []
  
  useEffect(() => {
    setMounted(true)
    return () => {
      setMounted(false)
    }
  }, [])
  
  useEffect(() => {
    if (mounted) {
      dispatch(fetchCollections()).catch((err: any) => {
        console.error('Failed to fetch collections:', err)
      })
    }
  }, [dispatch, mounted])

  const handleReturnToUpload = () => {
    dispatch(clearUploadResult())
    router.push('/app/upload')
  }

  const successFiles = useMemo(
    () => fileResults.filter((item: any) => item.success).length,
    [fileResults]
  )

  // NOTE: result is always defined due to the mocked fallback above,
  // so we do not render the empty-state screen here.

  const renderQuestionType = (type?: string) => {
    if (!type) return '其他'
    return questionTypeMap[type] || '其他'
  }

  const toggleSelect = (id: string) => {
    setItems((prev: EditableQuestion[]) => prev.map((it: EditableQuestion) => it.id === id ? { ...it, selected: !it.selected } : it))
  }

  const toggleExpand = (id: string) => {
    setItems((prev: EditableQuestion[]) => prev.map((it: EditableQuestion) => it.id === id ? { ...it, expanded: !it.expanded } : it))
  }

  const startEdit = (id: string) => {
    setItems((prev: EditableQuestion[]) => prev.map((it: EditableQuestion) => it.id === id ? { ...it, editing: true } : it))
  }

  const cancelEdit = (id: string) => {
    setItems((prev: EditableQuestion[]) => prev.map((it: EditableQuestion) => it.id === id ? { ...it, editing: false, draftContent: it.full_content, draftOptions: it.options } : it))
  }

  const applyEdit = (id: string) => {
    setItems((prev: EditableQuestion[]) => prev.map((it: EditableQuestion) => it.id === id ? { ...it, editing: false, content: it.draftContent, full_content: it.draftContent, options: it.draftOptions } : it))
  }

  const updateDraftContent = (id: string, value: string) => {
    setItems((prev: EditableQuestion[]) => prev.map((it: EditableQuestion) => it.id === id ? { ...it, draftContent: value } : it))
  }

  const updateDraftOption = (id: string, idx: number, value: string) => {
    setItems((prev: EditableQuestion[]) => prev.map((it: EditableQuestion) => {
      if (it.id !== id) return it
      const draftOptions = it.draftOptions.map((opt: { label: string; content: string }, i: number) => i === idx ? { ...opt, content: value } : opt)
      return { ...it, draftOptions }
    }))
  }

  const handleSaveSelected = async () => {
    const selected = items.filter((i: EditableQuestion) => i.selected)
    if (selected.length === 0) {
      alert('请先勾选需要保存的题目')
      return
    }
    // 直接执行保存逻辑，不再显示弹窗
    handleConfirmSave()
  }
  
  const handleConfirmSave = async () => {
    const selected = items.filter((i: EditableQuestion) => i.selected)
    setSaving(true)
    setSaveError(null)
    try {
      // 检查认证状态
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        throw new Error('未登录或登录已过期，请重新登录')
      }
      
      // 第一步：保存题目到数据库
      const payload = {
        document_title: result?.data?.document_title || '用户确认文档',
        filename: result?.data?.filename || 'manual.docx',
        file_type: result?.data?.file_type || 'image',
        file_size: result?.data?.file_size || undefined,
        questions: selected.map((s: EditableQuestion) => ({
          number: s.number,
          content: s.content,
          full_content: s.full_content,
          question_type: s.question_type,
          options: s.options,
        }))
      }
      
      console.log('准备保存题目，payload:', payload)
      
      const resp = await bulkCreateQuestions(payload)
      
      // 第二步：找到或创建 "Default" 错题本
      let defaultCollection = collections.find(c => c.title === '默认错题本' || c.title === 'Default')
      
      let targetCollectionId = defaultCollection?.id
      
      if (!targetCollectionId) {
        const newCollection: CollectionCreate = {
          title: '默认错题本',
          description: '系统默认错题本，用于存放新识别的题目',
          is_favorite: false,
          is_public: false,
        }
        const collectionResp = await dispatch(addCollection(newCollection)).unwrap()
        targetCollectionId = collectionResp.id
      }
      
      // 第三步：将题目添加到错题本
      if (targetCollectionId && resp.question_ids) {
        await dispatch(addQuestionsToCol({
          collectionId: targetCollectionId,
          questionIds: resp.question_ids
        })).unwrap()
      }

      // 直接跳转到「题目管理」页面（不弹窗），并携带这次新建的题目 ID
      const ids = Array.isArray(resp.question_ids) ? resp.question_ids : []
      const query = ids.length ? `?ids=${encodeURIComponent(ids.join(','))}` : ''
      router.push(`/app/questions${query}`)
    } catch (e: any) {
      setSaveError(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // While initializing on first client render, don't show "暂无识别结果".
  if (result === undefined) {
    return null
  }

  if (!result) {
    return (
      <div className="result-page" style={{ maxWidth: '1200px', margin: '0 auto', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1.5rem',
          border: '3px solid #000000',
          boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
          padding: '4rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          maxWidth: '600px',
          width: '100%'
        }}>
          {/* Hero Icon - Empty Box */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: '#A3E635', marginBottom: '1.5rem' }}
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          
          {/* Heading */}
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '900',
            color: '#000000',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            暂无识别结果
          </h2>
          
          {/* Body Text */}
          <p style={{
            fontSize: '1.125rem',
            color: '#6b7280',
            maxWidth: '28rem',
            lineHeight: '1.75',
            marginBottom: '2rem'
          }}>
            请返回上传页面，选择图片或文档进行 OCR 解析。
          </p>
          
          {/* CTA Button */}
          <button
            onClick={handleReturnToUpload}
            style={{
              backgroundColor: '#A3E635',
              color: '#000000',
              fontWeight: '700',
              fontSize: '1rem',
              padding: '0.875rem 2rem',
              borderRadius: '9999px',
              border: '2px solid #000000',
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(2px, 2px)'
              e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgba(0,0,0,1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)'
              e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translate(4px, 4px)'
              e.currentTarget.style.boxShadow = '0px 0px 0px 0px rgba(0,0,0,1)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translate(2px, 2px)'
              e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgba(0,0,0,1)'
            }}
          >
            返回上传页面
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="result-page" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* File Folder Header Card */}
      <div className="result-hero-container">
        <header className="result-hero-header">
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '900' }}>
              {items.length > 0 ? '确认题目' : '识别结果（0）'}
            </h1>
            {items.length > 0 && (
              <p style={{ fontWeight: '500', color: '#1F2937', lineHeight: '1.6' }}>
                找到 <span style={{ fontWeight: '900', color: '#000000' }}>{totalQuestions}</span> 道题目，点击"快速修改"可编辑内容
              </p>
            )}
          </div>
          {items.length > 0 && (
            <button className="neo-btn neo-btn-white" onClick={handleReturnToUpload}>重新上传</button>
          )}
        </header>
      </div>

      {/* Questions List */}
      <main className="questions-grid">
        {items.map(item => (
          <article 
            key={item.id} 
            className={`question-card ${item.selected ? 'selected' : ''}`}
          >
            <header className="question-card-header">
              <div className="question-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <p className="question-number">第 {item.number} 题</p>
                <button onClick={() => startEdit(item.id)} className="correction-btn" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
                  快速修改
                </button>
                {renderQuestionType(item.question_type) !== '其他' && (
                  <span className="question-type-badge">
                    {renderQuestionType(item.question_type)}
                  </span>
                )}
              </div>
              <div className="question-controls">
                <button
                  className={`checkbox-btn ${item.selected ? 'checked' : ''}`}
                  onClick={() => toggleSelect(item.id)}
                >
                  {item.selected ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <div className="empty-box" />
                  )}
                </button>
                <button 
                  onClick={() => toggleExpand(item.id)} 
                  className="expand-btn"
                >
                  {item.expanded ? '－' : '＋'}
                </button>
              </div>
            </header>

            {item.editing ? (
              <div className="question-edit-form">
                <textarea
                  value={item.draftContent}
                  onChange={e => updateDraftContent(item.id, e.target.value)}
                  placeholder="输入题目内容（支持LaTeX公式，如 $x^2$）"
                  className="bg-white border-2 border-black p-4 text-black focus:ring-2 focus:ring-black focus:outline-none"
                />
                {item.draftOptions.length > 0 && (
                  <div className="edit-options-list">
                    {item.draftOptions.map((opt, idx) => (
                      <div key={idx} className="edit-option-row">
                        <label className="edit-option-label">{opt.label}</label>
                        <textarea
                          value={opt.content}
                          onChange={e => updateDraftOption(item.id, idx, e.target.value)}
                          placeholder={`输入选项 ${opt.label} 的内容（支持换行和LaTeX公式）`}
                          rows={2}
                          className="bg-white border-2 border-black p-4 text-black focus:ring-2 focus:ring-black focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="edit-actions">
                  <button onClick={() => applyEdit(item.id)} className="edit-btn-save">
                    保存纠正
                  </button>
                  <button onClick={() => cancelEdit(item.id)} className="edit-btn-cancel">
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                {item.expanded ? (
                  <div className="question-content-section" style={{ marginTop: '1rem' }}>
                    <MathRenderer content={item.content} className="question-text" />
                    {item.full_content && item.full_content !== item.content && (
                      <MathRenderer content={item.full_content} className="question-full-text" />
                    )}
                    {Array.isArray(item.options) && item.options.length > 0 && (
                      <div className="question-options-list">
                        {item.options.map((opt: any, idx: number) => (
                          <div key={idx} className="question-option-item">
                            <span className="option-label">{opt.label || String.fromCharCode(65 + idx)}</span>
                            <MathRenderer content={opt.content} className="option-text" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="question-collapsed-view">
                    <span className="collapsed-number">#{item.number}</span>
                    <MathRenderer content={item.content} className="collapsed-text" />
                  </div>
                )}
              </>
            )}
          </article>
        ))}

        {items.length === 0 && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1.5rem',
            border: '3px solid #000000',
            boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
            padding: '4rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            margin: '2rem auto',
            maxWidth: '600px'
          }}>
            {/* Hero Icon - Search with X */}
            <svg
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#A3E635', marginBottom: '1.5rem' }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <line x1="14" y1="8" x2="8" y2="14" />
              <line x1="8" y1="8" x2="14" y2="14" />
            </svg>
            
            {/* Heading */}
            <h3 style={{
              fontSize: '2rem',
              fontWeight: '900',
              color: '#000000',
              marginBottom: '1rem',
              lineHeight: '1.2'
            }}>
              未识别到题目
            </h3>
            
            {/* Body Text */}
            <p style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              maxWidth: '28rem',
              lineHeight: '1.75',
              marginBottom: '2rem'
            }}>
              请确保上传的图片清晰、光线充足，且包含可识别的题目文本。
            </p>
            
            {/* CTA Button */}
            <button
              onClick={handleReturnToUpload}
              style={{
                backgroundColor: '#A3E635',
                color: '#000000',
                fontWeight: '700',
                fontSize: '1rem',
                padding: '0.875rem 2rem',
                borderRadius: '9999px',
                border: '2px solid #000000',
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(2px, 2px)'
                e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgba(0,0,0,1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(0, 0)'
                e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translate(4px, 4px)'
                e.currentTarget.style.boxShadow = '0px 0px 0px 0px rgba(0,0,0,1)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translate(2px, 2px)'
                e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgba(0,0,0,1)'
              }}
            >
              重新上传
            </button>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar - Green Controller/Game Boy - Only show when there are questions */}
      {items.length > 0 && (
        <div style={{
          position: 'sticky',
          bottom: '20px',
          zIndex: 100,
          marginTop: '2rem',
          marginBottom: '2rem', /* Float above bottom */
          backgroundColor: '#A3E635',
          border: '4px solid black',
          borderRadius: '1rem', /* rounded-2xl - Soft but Sturdy */
          boxShadow: '5px 5px 0px 0px rgba(0,0,0,1)',
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="neo-btn neo-btn-white" 
              onClick={() => setItems(prev => prev.map(it => ({ ...it, selected: true })))}
            >
              全选
            </button>
            <button 
              className="neo-btn neo-btn-white" 
              onClick={() => setItems(prev => prev.map(it => ({ ...it, selected: false })))}
            >
              清空
            </button>
          </div>
          
          {saveError && <span style={{ color: '#EF4444', fontWeight: '700' }}>{saveError}</span>}
          
          <button 
            className="neo-btn neo-btn-orange" 
            onClick={handleSaveSelected}
            disabled={saving || items.filter(i => i.selected).length === 0}
            style={{ fontSize: '1.2rem' }}
          >
            {saving ? '保存中...' : `保存勾选的 ${items.filter(i => i.selected).length} 题`}
          </button>
        </div>
      )}

      {fileResults.length > 0 && (
        <div className="file-status-section">
          <h2 className="file-status-title">文件解析状态</h2>
          <div className="file-status-grid">
            {fileResults.map((item: any, index: number) => (
              <div
                key={index}
                className={`file-status-card ${item.success ? 'success' : 'failed'}`}
              >
                <div className="file-status-header">
                  <p className="file-name">{item.filename}</p>
                  <span className={`file-status-tag ${item.success ? 'success' : 'failed'}`}>
                    {item.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
                {item.success ? (
                  <p className="file-description">识别到 {item.total_questions} 道题目</p>
                ) : (
                  <p className="file-description error">{item.error || '解析失败'}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadResultPage
