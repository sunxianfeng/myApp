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
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false)
  const [newCollectionTitle, setNewCollectionTitle] = useState('')
  
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
    // 显示选择错题本的弹窗
    setShowCollectionModal(true)
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
      console.log('Token 前10个字符:', token?.substring(0, 10))
      
      const resp = await bulkCreateQuestions(payload)
      
      // 第二步：如果选择了错题本，将题目添加到错题本中
      if (selectedCollectionId || showNewCollectionForm) {
        let targetCollectionId = selectedCollectionId
        
        // 如果是创建新错题本
        if (showNewCollectionForm && newCollectionTitle.trim()) {
          const newCollection: CollectionCreate = {
            title: newCollectionTitle,
            description: `从 ${result?.data?.filename || '上传'} 创建`,
            is_favorite: false,
            is_public: false,
          }
          const collectionResp = await dispatch(addCollection(newCollection)).unwrap()
          targetCollectionId = collectionResp.id
        }
        
        // 添加题目到错题本
        if (targetCollectionId && resp.question_ids) {
          await dispatch(addQuestionsToCol({
            collectionId: targetCollectionId,
            questionIds: resp.question_ids
          })).unwrap()
          alert(`保存成功！创建 ${resp.created_count} 题，并已添加到错题本。`)
          router.push(`/app/collections/${targetCollectionId}`)
        } else {
          alert(`保存成功，创建 ${resp.created_count} 题。`)
        }
      } else {
        alert(`保存成功，创建 ${resp.created_count} 题。`)
      }
      
      setShowCollectionModal(false)
      setSelectedCollectionId('')
      setShowNewCollectionForm(false)
      setNewCollectionTitle('')
    } catch (e: any) {
      setSaveError(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="result-page" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Section */}
      <div className="result-hero">
        <div className="hero-left">
          <p className="hero-label">OCR 解析完成 (NEO)</p>
          <h1>识别结果确认</h1>
          <p>
            共识别 <span className="highlight">{totalQuestions}</span> 道题目。请选择需要保存的题目并纠正识别错误。
          </p>
        </div>
        <div className="result-hero-buttons">
          <button className="neo-btn neo-btn-white" onClick={handleReturnToUpload}>
            继续上传
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bulk-actions-bar">
        <div className="bulk-select-buttons">
          <button
            className="neo-btn neo-btn-white"
            onClick={() => setItems(prev => prev.map(it => ({ ...it, selected: true })))}
          >
            全选题目
          </button>
          <button
            className="neo-btn neo-btn-white"
            onClick={() => setItems(prev => prev.map(it => ({ ...it, selected: false })))}
          >
            取消全选
          </button>
        </div>
        <div className="bulk-save-section">
          {saveError && <span className="save-error-message">{saveError}</span>}
          <button
            className="neo-btn neo-btn-orange"
            disabled={saving || items.filter((i: EditableQuestion) => i.selected).length === 0}
            onClick={handleSaveSelected}
          >
            {saving ? '正在保存...' : `保存已选 (${items.filter((i: EditableQuestion) => i.selected).length})`}
          </button>
        </div>
      </div>

      <div className="questions-grid">
        {items.map(item => (
          <article 
            key={item.id} 
            className={`question-card ${item.selected ? 'selected' : ''}`}
          >
            <header className="question-card-header">
              <div className="question-info">
                <p className="question-number">第 {item.number} 题</p>
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
                  <div className="question-content-section">
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
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => startEdit(item.id)} 
                    className="correction-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                    纠正题目
                  </button>
                </div>
              </>
            )}
          </article>
        ))}

        {items.length === 0 && (
          <div className="no-questions-message">
            <p>未识别到题目内容。</p>
          </div>
        )}
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
      
      {/* 选择错题本弹窗 - Neobrutalism Style */}
      {showCollectionModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h2 className="modal-title">保存到错题本</h2>
            
            {!showNewCollectionForm ? (
              <div className="modal-content">
                <div className="modal-field">
                  <label className="modal-label">
                    选择错题本
                  </label>
                  <select
                    value={selectedCollectionId}
                    onChange={(e) => setSelectedCollectionId(e.target.value)}
                    className="modal-select"
                  >
                    <option value="">不选择错题本（仅保存题目）</option>
                    {collections.map(col => (
                      <option key={col.id} value={col.id}>
                        {col.title} ({col.question_count} 题)
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => setShowNewCollectionForm(true)}
                  className="create-collection-btn"
                >
                  + 创建新错题本
                </button>
                
                <div className="modal-actions">
                  <button
                    onClick={() => {
                      setShowCollectionModal(false)
                      setSelectedCollectionId('')
                    }}
                    className="modal-btn-cancel"
                    disabled={saving}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    className="modal-btn-confirm"
                    disabled={saving}
                  >
                    {saving ? '保存中...' : '确认保存'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-content">
                <div className="modal-field">
                  <label className="modal-label">
                    新错题本名称 *
                  </label>
                  <input
                    type="text"
                    value={newCollectionTitle}
                    onChange={(e) => setNewCollectionTitle(e.target.value)}
                    className="modal-input"
                    placeholder="例如：数学错题集"
                    autoFocus
                  />
                </div>
                
                <div className="modal-actions">
                  <button
                    onClick={() => {
                      setShowNewCollectionForm(false)
                      setNewCollectionTitle('')
                    }}
                    className="modal-btn-cancel"
                    disabled={saving}
                  >
                    返回
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    className="modal-btn-confirm"
                    disabled={saving || !newCollectionTitle.trim()}
                  >
                    {saving ? '创建并保存中...' : '创建并保存'}
                  </button>
                </div>
              </div>
            )}
            
            {saveError && (
              <div className="modal-error">
                {saveError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadResultPage
