'use client'

import React, { useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { AppDispatch, RootState } from '@/lib/store'
import { clearUploadResult } from '@/lib/slices/uploadSlice'
import { bulkCreateQuestions } from '@/lib/api'

const questionTypeMap: Record<string, string> = {
  multiple_choice: '选择题',
  fill_blank: '填空题',
  true_false: '判断题',
  essay: '解答题',
}

const UploadResultPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const result = useSelector((state: RootState) => state.upload.latestResult)

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

  const [items, setItems] = useState<EditableQuestion[]>(() => questions.map((q: any, idx: number): EditableQuestion => ({
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
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const totalQuestions = result?.data?.total_questions ?? questions.length
  const fileResults = result?.data?.results ?? []

  const handleReturnToUpload = () => {
    dispatch(clearUploadResult())
    router.push('/app/upload')
  }

  const successFiles = useMemo(
    () => fileResults.filter((item: any) => item.success).length,
    [fileResults]
  )

  if (!result) {
    return (
      <div className="results-page">
        <div className="results-empty-card">
          <h2>暂无识别结果</h2>
          <p>请返回上传页面，选择图片或文档进行 OCR 解析。</p>
          <button className="btn btn-primary" onClick={handleReturnToUpload}>
            返回上传页面
          </button>
        </div>
      </div>
    )
  }

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
    setSaving(true)
    setSaveError(null)
    try {
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
      const resp = await bulkCreateQuestions(payload)
      alert(`保存成功，创建 ${resp.created_count} 题。`)
      // 可选：跳转到题目列表页
      // router.push('/app/questions')
    } catch (e: any) {
      setSaveError(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="results-page">
      <div className="results-hero-card">
        <div className="hero-left">
          <p className="results-hero-label">OCR 解析完成</p>
          <p className="results-hero-sub">共识别 {totalQuestions} 道题目。请选择需要保存的题目并可对识别内容进行纠正。</p>
        </div>
        <div className="hero-right">
          <button className="action-btn primary upload-back-btn" onClick={handleReturnToUpload}>
            继续上传
          </button>
          <div style={{width: '12px'}} />
        </div>
      </div>
      {/* 统一右侧操作按钮 */}
      <div className="results-actions unified">
        <div className="actions-right">
          <button
            className="action-btn"
            onClick={() => setItems(prev => prev.map(it => ({ ...it, selected: true })))}
          >全选</button>
          <button
            className="action-btn"
            onClick={() => setItems(prev => prev.map(it => ({ ...it, selected: false })))}
          >取消全选</button>
          <button
            className="action-btn primary"
            disabled={saving || items.filter((i: EditableQuestion) => i.selected).length === 0}
            onClick={handleSaveSelected}
          >{saving ? '保存中...' : `保存所选 (${items.filter((i: EditableQuestion) => i.selected).length})`}</button>
          {saveError && <span className="save-error">{saveError}</span>}
        </div>
      </div>

      <div className="question-grid">
        {items.map(item => (
          <article key={item.id} className={`question-card ${!item.expanded ? 'collapsed' : ''}`}>
            <header className="question-card-header">
              <div className="question-header-left">
                <p className="question-order">第 {item.number} 题</p>
                <span className="question-type-pill">{renderQuestionType(item.question_type)}</span>
              </div>
              <div className="question-header-right">
                <div
                  className={`question-select-box ${item.selected ? 'selected' : ''}`}
                  role="checkbox"
                  aria-checked={item.selected}
                  tabIndex={0}
                  onClick={() => toggleSelect(item.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(item.id) } }}
                >
                  {item.selected ? (
                    <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <span className="select-text">选择</span>
                  )}
                </div>
                <button onClick={() => startEdit(item.id)} className="correction-btn header-correction" aria-label="纠正题目">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                  纠正
                </button>
                <button className="question-collapse-btn" onClick={() => toggleExpand(item.id)} aria-label={item.expanded ? '折叠' : '展开'}>
                  {item.expanded ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 15 12 9 18 15" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  )}
                </button>
              </div>
            </header>

            {item.editing ? (
              <div className="question-edit-panel">
                <textarea
                  value={item.draftContent}
                  onChange={e => updateDraftContent(item.id, e.target.value)}
                  className="question-edit-textarea"
                  rows={6}
                />
                {item.draftOptions.length > 0 && (
                  <div className="question-edit-options">
                    {item.draftOptions.map((opt, idx) => (
                      <div key={idx} className="question-edit-option-row">
                        <label>{opt.label}</label>
                        <input
                          value={opt.content}
                          onChange={e => updateDraftOption(item.id, idx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="question-edit-actions unified">
                  <button onClick={() => applyEdit(item.id)} className="edit-btn">保存纠正</button>
                  <button onClick={() => cancelEdit(item.id)} className="edit-btn">取消</button>
                </div>
              </div>
            ) : (
              <>
                {item.expanded ? (
                  <>
                    <p className="question-content">{item.content}</p>
                    {item.full_content && item.full_content !== item.content && (
                      <p className="question-detail">{item.full_content}</p>
                    )}
                    {Array.isArray(item.options) && item.options.length > 0 && (
                      <div className="question-options">
                        {item.options.map((opt: any, idx: number) => (
                          <div key={idx} className="question-option">
                            <span>{opt.label || String.fromCharCode(65 + idx)}</span>
                            <p>{opt.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="question-collapsed-line">
                    <span className="collapsed-number">#{item.number}</span>
                    <span className="collapsed-text">{item.content.slice(0, 40)}{item.content.length > 40 ? '…' : ''}</span>
                  </div>
                )}
                <div className="question-actions-row">
                  <button onClick={() => startEdit(item.id)} className="correction-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                    纠正
                  </button>
                </div>
              </>
            )}
          </article>
        ))}

        {items.length === 0 && (
          <div className="question-empty">
            <p>未识别到题目内容。</p>
          </div>
        )}
      </div>

      {fileResults.length > 0 && (
        <div className="file-status-section">
          <h2>文件解析状态</h2>
          <div className="file-status-grid">
            {fileResults.map((item: any, index: number) => (
              <div
                key={index}
                className={`file-status-card ${item.success ? 'success' : 'failed'}`}
              >
                <div className="file-status-header">
                  <p className="file-name">{item.filename}</p>
                  <span className="file-tag">{item.success ? '成功' : '失败'}</span>
                </div>
                {item.success ? (
                  <p className="file-desc">识别到 {item.total_questions} 道题目</p>
                ) : (
                  <p className="file-desc error">{item.error || '解析失败'}</p>
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
