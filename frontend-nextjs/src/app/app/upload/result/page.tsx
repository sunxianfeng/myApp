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
      <div className="!flex !items-center !justify-center !min-h-[60vh] !p-6">
        <div className="!bg-white !border-4 !border-black !p-12 !max-w-xl !w-full !text-center !shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="!text-3xl !font-black !text-black !mb-4">暂无识别结果</h2>
          <p className="!text-lg !font-bold !text-gray-600 !mb-8">请返回上传页面，选择图片或文档进行 OCR 解析。</p>
          <button 
            className="!bg-[#FFD100] !text-black !border-4 !border-black !px-10 !py-4 !font-black !text-xl !shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:!shadow-none hover:!translate-x-[3px] hover:!translate-y-[3px] !transition-all" 
            onClick={handleReturnToUpload}
          >
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
    <div className="!max-w-[1200px] !mx-auto !p-6 !flex !flex-col !gap-8">
      {/* Hero Section */}
      <div className="!bg-[#FFD100] !border-4 !border-black !p-8 !flex !flex-col md:!flex-row !justify-between !items-center !gap-6 !shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="!flex-1">
          <p className="!text-sm !font-black !uppercase !tracking-widest !mb-2 !text-black">OCR 解析完成</p>
          <h1 className="!text-3xl !font-black !text-black !mb-2">识别结果确认</h1>
          <p className="!text-lg !font-bold !text-black/80">
            共识别 <span className="!underline !decoration-4">{totalQuestions}</span> 道题目。请选择需要保存的题目并纠正识别错误。
          </p>
        </div>
        <div className="!flex !gap-4">
          <button 
            className="!bg-white !text-black !border-4 !border-black !px-6 !py-3 !font-black !text-lg !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:!translate-x-[2px] hover:!translate-y-[2px] hover:!shadow-none !transition-all"
            onClick={handleReturnToUpload}
          >
            继续上传
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="!flex !flex-col md:!flex-row !justify-between !items-center !gap-4 !bg-[#A3E635] !border-4 !border-black !p-4 !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="!flex !gap-4">
          <button
            className="!bg-white !border-2 !border-black !px-4 !py-2 !font-black !text-sm !shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:!shadow-none hover:!translate-x-[1px] hover:!translate-y-[1px] !transition-all"
            onClick={() => setItems(prev => prev.map(it => ({ ...it, selected: true })))}
          >
            全选题目
          </button>
          <button
            className="!bg-white !border-2 !border-black !px-4 !py-2 !font-black !text-sm !shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:!shadow-none hover:!translate-x-[1px] hover:!translate-y-[1px] !transition-all"
            onClick={() => setItems(prev => prev.map(it => ({ ...it, selected: false })))}
          >
            取消全选
          </button>
        </div>
        <div className="!flex !items-center !gap-6">
          {saveError && <span className="!text-red-600 !font-black !bg-white !px-3 !py-1 !border-2 !border-black">{saveError}</span>}
          <button
            className="!bg-[#FF7A00] !text-white !border-4 !border-black !px-8 !py-3 !font-black !text-lg !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:!opacity-50 disabled:!shadow-none disabled:!translate-x-0 disabled:!translate-y-0 hover:!translate-x-[2px] hover:!translate-y-[2px] hover:!shadow-none !transition-all"
            disabled={saving || items.filter((i: EditableQuestion) => i.selected).length === 0}
            onClick={handleSaveSelected}
          >
            {saving ? '正在保存...' : `保存已选 (${items.filter((i: EditableQuestion) => i.selected).length})`}
          </button>
        </div>
      </div>

      <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-8">
        {items.map(item => (
          <article 
            key={item.id} 
            className={`!bg-white !border-4 !border-black !p-6 !flex !flex-col !gap-4 !transition-all ${
              item.selected ? '!shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] !border-[#6366f1]' : '!shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            <header className="!flex !justify-between !items-start !gap-4">
              <div className="!flex !flex-col !gap-2">
                <p className="!text-xl !font-black !text-black">第 {item.number} 题</p>
                <span className="!inline-block !bg-[#E0E7FF] !text-black !border-2 !border-black !px-3 !py-1 !text-sm !font-black !rounded-none">
                  {renderQuestionType(item.question_type)}
                </span>
              </div>
              <div className="!flex !gap-2">
                <button
                  className={`!w-12 !h-12 !border-4 !border-black !flex !items-center !justify-center !transition-all ${
                    item.selected ? '!bg-[#6366f1] !text-white' : '!bg-white !text-black hover:!bg-gray-100'
                  }`}
                  onClick={() => toggleSelect(item.id)}
                >
                  {item.selected ? (
                    <svg className="!w-8 !h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <div className="!w-6 !h-6 !border-4 !border-black" />
                  )}
                </button>
                <button 
                  onClick={() => toggleExpand(item.id)} 
                  className="!w-12 !h-12 !bg-white !border-4 !border-black !flex !items-center !justify-center !font-black hover:!bg-gray-100"
                >
                  {item.expanded ? '－' : '＋'}
                </button>
              </div>
            </header>

            {item.editing ? (
              <div className="!flex !flex-col !gap-4">
                <textarea
                  value={item.draftContent}
                  onChange={e => updateDraftContent(item.id, e.target.value)}
                  className="!w-full !border-4 !border-black !p-4 !font-bold !bg-white !focus:ring-0 !min-h-[150px]"
                />
                {item.draftOptions.length > 0 && (
                  <div className="!flex !flex-col !gap-3">
                    {item.draftOptions.map((opt, idx) => (
                      <div key={idx} className="!flex !items-center !gap-3">
                        <label className="!font-black !text-lg !min-w-[2rem]">{opt.label}</label>
                        <input
                          value={opt.content}
                          onChange={e => updateDraftOption(item.id, idx, e.target.value)}
                          className="!flex-1 !border-4 !border-black !p-3 !font-bold"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="!flex !gap-3 !justify-end">
                  <button onClick={() => applyEdit(item.id)} className="!bg-[#A3E635] !border-4 !border-black !px-6 !py-2 !font-black !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:!shadow-none hover:!translate-x-[2px] hover:!translate-y-[2px] !transition-all">
                    保存纠正
                  </button>
                  <button onClick={() => cancelEdit(item.id)} className="!bg-white !border-4 !border-black !px-6 !py-2 !font-black !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:!shadow-none hover:!translate-x-[2px] hover:!translate-y-[2px] !transition-all">
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                {item.expanded ? (
                  <div className="!flex !flex-col !gap-4">
                    <p className="!text-lg !font-bold !leading-relaxed">{item.content}</p>
                    {item.full_content && item.full_content !== item.content && (
                      <p className="!text-sm !font-medium !text-gray-600 !border-l-4 !border-black !pl-4 !py-2 !bg-gray-50">{item.full_content}</p>
                    )}
                    {Array.isArray(item.options) && item.options.length > 0 && (
                      <div className="!flex !flex-col !gap-3 !mt-2">
                        {item.options.map((opt: any, idx: number) => (
                          <div key={idx} className="!flex !gap-4 !p-3 !bg-[#F8F7F5] !border-2 !border-black">
                            <span className="!font-black !text-black !min-w-[1.5rem]">{opt.label || String.fromCharCode(65 + idx)}</span>
                            <p className="!font-bold">{opt.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="!bg-[#F8F7F5] !border-2 !border-black !p-3 !flex !gap-4 !items-center">
                    <span className="!font-black !bg-black !text-white !px-2 !py-1">#{item.number}</span>
                    <span className="!font-bold !truncate">{item.content}</span>
                  </div>
                )}
                <div className="!flex !justify-end !mt-2">
                  <button 
                    onClick={() => startEdit(item.id)} 
                    className="!bg-[#FF7A00] !text-white !border-4 !border-black !px-6 !py-2 !font-black !flex !items-center !gap-2 !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:!shadow-none hover:!translate-x-[2px] hover:!translate-y-[2px] !transition-all"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
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
          <div className="!col-span-full !bg-white !border-4 !border-black !p-12 !text-center !shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="!text-2xl !font-black">未识别到题目内容。</p>
          </div>
        )}
      </div>

      {fileResults.length > 0 && (
        <div className="!bg-white !border-4 !border-black !p-8 !shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="!text-2xl !font-black !mb-6 !uppercase !tracking-tight">文件解析状态</h2>
          <div className="!grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-3 !gap-6">
            {fileResults.map((item: any, index: number) => (
              <div
                key={index}
                className={`!border-4 !border-black !p-4 !flex !flex-col !gap-2 !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                  item.success ? '!bg-[#A3E635]' : '!bg-[#FF7A00]/20'
                }`}
              >
                <div className="!flex !justify-between !items-start">
                  <p className="!font-black !truncate !max-w-[150px]">{item.filename}</p>
                  <span className={`!px-2 !py-0.5 !text-xs !font-black !border-2 !border-black ${item.success ? '!bg-white' : '!bg-white !text-red-600'}`}>
                    {item.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
                {item.success ? (
                  <p className="!text-sm !font-bold">识别到 {item.total_questions} 道题目</p>
                ) : (
                  <p className="!text-sm !font-bold !text-red-600">{item.error || '解析失败'}</p>
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
