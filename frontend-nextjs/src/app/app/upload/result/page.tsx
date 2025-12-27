'use client'

import './result-neobrutalism.css'
import React, { useMemo, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { AppDispatch, RootState } from '@/lib/store'
import { clearUploadResult } from '@/lib/slices/uploadSlice'
import { bulkCreateQuestions } from '@/lib/api'
import {
  fetchCollections,
  addCollection,
  addQuestionsToCol,
  selectCollections,
  selectCollectionSaving
} from '@/lib/slices/collectionSlice'
import type { CollectionCreate } from '@/types/api'

const questionTypeMap: Record<string, string> = {
  multiple_choice: '选择题',
  fill_blank: '填空题',
  true_false: '判断题',
  essay: '解答题',
}

const UploadResultPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const resultFromStore = useSelector((state: RootState) => state.upload.latestResult)

  // Use `undefined` as "initializing" state to avoid briefly rendering the empty-state.
  // IMPORTANT: initialize from store synchronously to prevent hydration mismatch
  // (server HTML is generated without store data; client may have it on first render).
  const [result, setResult] = useState<any>(() => resultFromStore ?? undefined)

  useEffect(() => {
    // Prefer store result when available
    if (resultFromStore) {
      setResult(resultFromStore)
      return
    }

    // If result is not in store (e.g. direct navigation), check if we should use mock data.
    // This logic runs only on the client, avoiding hydration mismatch.
    const enableMock = new URLSearchParams(window.location.search).get('mock') !== '0'
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
  
  const totalQuestions = result?.data?.total_questions ?? questions.length
  const fileResults = result?.data?.results ?? []
  
  useEffect(() => {
    dispatch(fetchCollections())
  }, [dispatch])

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
      <div className="empty-state">
        <div className="empty-state-card">
          <h2>暂无识别结果</h2>
          <p>请返回上传页面，选择图片或文档进行 OCR 解析。</p>
          <button className="empty-state-btn" onClick={handleReturnToUpload}>
            返回上传页面
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="result-page" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Compact Header */}
      <header className="result-hero" style={{ padding: '1.5rem 2rem', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>确认题目</h1>
          <p className="font-bold">找到 {totalQuestions} 道题目，点击"纠正"可修改文字内容</p>
        </div>
        <button className="neo-btn neo-btn-white" onClick={handleReturnToUpload}>重新上传</button>
      </header>

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
                  className="edit-textarea"
                />
                {item.draftOptions.length > 0 && (
                  <div className="edit-options-list">
                    {item.draftOptions.map((opt, idx) => (
                      <div key={idx} className="edit-option-row">
                        <label className="edit-option-label">{opt.label}</label>
                        <input
                          value={opt.content}
                          onChange={e => updateDraftOption(item.id, idx, e.target.value)}
                          className="edit-option-input"
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
                    <p className="question-text">{item.content}</p>
                    {item.full_content && item.full_content !== item.content && (
                      <p className="question-full-text">{item.full_content}</p>
                    )}
                    {Array.isArray(item.options) && item.options.length > 0 && (
                      <div className="question-options-list">
                        {item.options.map((opt: any, idx: number) => (
                          <div key={idx} className="question-option-item">
                            <span className="option-label">{opt.label || String.fromCharCode(65 + idx)}</span>
                            <p className="option-text">{opt.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="question-collapsed-view">
                    <span className="collapsed-number">#{item.number}</span>
                    <span className="collapsed-text">{item.content}</span>
                  </div>
                )}
              </>
            )}
          </article>
        ))}

        {items.length === 0 && (
          <div className="no-questions-message">
            <p>未识别到题目内容。</p>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar */}
      <div style={{
        position: 'sticky',
        bottom: '20px',
        zIndex: 100,
        marginTop: '2rem',
        backgroundColor: '#A3E635',
        border: '4px solid black',
        boxShadow: '8px 8px 0px black',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
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
