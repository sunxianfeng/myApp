'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '@/lib/store'
import {
  fetchCollection,
  selectCurrentCollection,
  selectCollectionLoading,
  clearCurrentCollection
} from '@/lib/slices/collectionSlice'
import './print.css'

// Helper to get question content text
const getQuestionContentText = (content: string | { text?: string } | any): string => {
  if (typeof content === 'string') return content
  if (content && typeof content === 'object' && 'text' in content) return content.text || ''
  return String(content || '')
}

export default function PrintCollectionPage() {
  const router = useRouter()
  const params = useParams()
  const dispatch = useDispatch<AppDispatch>()
  
  const collectionId = params?.id as string
  const collection = useSelector(selectCurrentCollection)
  const isLoading = useSelector(selectCollectionLoading)
  
  useEffect(() => {
    if (collectionId) {
      dispatch(fetchCollection({ id: collectionId, includeQuestions: true }))
    }
    
    return () => {
      dispatch(clearCurrentCollection())
    }
  }, [collectionId, dispatch])

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="print-loading">
        <div className="print-loading-spinner">加载中...</div>
      </div>
    )
  }

  if (!collection || !collection.questions || collection.questions.length === 0) {
    return (
      <div className="print-error">
        <h2>错误</h2>
        <p>未找到题目集合或集合为空</p>
        <button onClick={() => router.back()} className="print-back-btn">返回</button>
      </div>
    )
  }

  const questions = collection.questions || []
  const sortedQuestions = [...questions].sort((a, b) => {
    return new Date(a.added_at || '').getTime() - new Date(b.added_at || '').getTime()
  })

  return (
    <div className="print-container">
      {/* 打印按钮（不打印） */}
      <div className="print-controls no-print">
        <button onClick={handlePrint} className="print-control-btn primary">
          🖨️ 打印 / 保存为 PDF
        </button>
      </div>

      {/* 可打印内容 */}
      <div className="print-page">
        {/* 试卷头部 */}
        <div className="print-header">
          <h1 className="print-title">{collection.title}</h1>
          {collection.description && collection.description !== '从题目管理页面创建' && (
            <p className="print-description">{collection.description}</p>
          )}
          <div className="print-meta">
            <div className="print-meta-item">
              <span className="print-meta-label">题目数量：</span>
              <span className="print-meta-value">{sortedQuestions.length}</span>
            </div>
            <div className="print-meta-item">
              <span className="print-meta-label">生成日期：</span>
              <span className="print-meta-value">{new Date().toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
          <div className="print-divider"></div>
        </div>

        {/* 题目列表 */}
        <div className="print-questions">
          {sortedQuestions.map((question, index) => (
            <div key={question.id} className="print-question">
              <div className="print-question-header">
                <span className="print-question-number">{index + 1}.</span>
                <span className="print-question-type">
                  [{question.question_type === 'multiple_choice' ? '选择题' :
                    question.question_type === 'fill_blank' ? '填空题' :
                    question.question_type === 'true_false' ? '判断题' :
                    question.question_type === 'essay' ? '问答题' : '其他'}]
                </span>
                {question.difficulty_level && (
                  <span className="print-question-difficulty">
                    难度: {question.difficulty_level === 'easy' ? '简单' :
                          question.difficulty_level === 'medium' ? '中等' :
                          question.difficulty_level === 'hard' ? '困难' : question.difficulty_level}
                  </span>
                )}
              </div>

              <div className="print-question-content">
                {getQuestionContentText(question.content)}
              </div>

              {/* 题目选项 - 只显示选择题和判断题的选项 */}
              {question.options && 
               question.question_type !== 'fill_blank' && 
               question.question_type !== 'essay' && (
                <div className="print-question-options">
                  {(() => {
                    let options = question.options
                    
                    // Parse options if it's a string
                    if (typeof options === 'string') {
                      try {
                        options = JSON.parse(options)
                      } catch {
                        return <div className="print-option-text">{options}</div>
                      }
                    }
                    
                    // If it's an array, format as A, B, C, D...
                    if (Array.isArray(options)) {
                      const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
                      return options.map((option, idx) => (
                        <div key={idx} className="print-option">
                          <span className="print-option-label">{optionLabels[idx]}.</span>
                          <span className="print-option-text">
                            {typeof option === 'object' ? option.text || option.content || JSON.stringify(option) : option}
                          </span>
                        </div>
                      ))
                    }
                    
                    // If it's an object, try to extract options
                    if (typeof options === 'object' && options !== null) {
                      const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
                      const optionEntries = Object.entries(options)
                      
                      if (optionEntries.length > 0) {
                        return optionEntries.map(([key, value], idx) => (
                          <div key={key} className="print-option">
                            <span className="print-option-label">{optionLabels[idx] || key}.</span>
                            <span className="print-option-text">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
                            </span>
                          </div>
                        ))
                      }
                    }
                    
                    return <div className="print-option-text">{JSON.stringify(options)}</div>
                  })()}
                </div>
              )}

              {/* 答题空间 */}
              {(question.question_type === 'fill_blank' || question.question_type === 'essay') && (
                <div className="print-answer-space">
                  <div className="print-answer-lines"></div>
                  <div className="print-answer-lines"></div>
                  <div className="print-answer-lines"></div>
                  {question.question_type === 'essay' && (
                    <>
                      <div className="print-answer-lines"></div>
                      <div className="print-answer-lines"></div>
                    </>
                  )}
                </div>
              )}

              {/* 备注 */}
              {question.notes && (
                <div className="print-question-notes">
                  <strong>备注：</strong>{question.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 答案页（可选：在新页面打印答案） */}
        <div className="print-answers-section page-break">
          <h2 className="print-answers-title">参考答案</h2>
          <div className="print-divider"></div>
          
          {sortedQuestions.map((question, index) => (
            <div key={`answer-${question.id}`} className="print-answer-item">
              <div className="print-answer-header">
                <span className="print-answer-number">{index + 1}.</span>
                {question.correct_answer && (
                  <span className="print-answer-text">
                    <strong>答案：</strong>{question.correct_answer}
                  </span>
                )}
              </div>
              
              {question.explanation && (
                <div className="print-answer-explanation">
                  <strong>解析：</strong>{question.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 页脚 */}
        <div className="print-footer">
          <p>本试卷由错题本系统生成 · {new Date().toLocaleDateString('zh-CN')}</p>
        </div>
      </div>
    </div>
  )
}

