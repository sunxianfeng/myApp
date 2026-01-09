'use client'

import React, { Suspense, useEffect, useMemo, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import MathRenderer from '@/components/common/MathRenderer'

// Lucide React icons
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
  Search as IconSearch,
  Loader2 as IconLoader,
  Sparkles as IconSparkles,
  BookOpen as IconBookOpen,
  Lightbulb as IconLightbulb,
} from 'lucide-react'

const IconEdit = () => (
  <span aria-hidden style={{ display: 'inline-block', width: 14, height: 14, fontWeight: 900 }}>
    ✎
  </span>
)

import type { AppDispatch } from '@/lib/store'
import type { RootState } from '@/lib/store'
import {
  addCollection,
  fetchCollections,
  selectCollections,
  selectCollectionLoading,
  addQuestionsToCol,
} from '@/lib/slices/collectionSlice'
import { getCollectionsWithQuestions, getCollectionsForAssignment, addQuestionsToCollection, getQuestions, generateReferenceAnswer, generateSimilarQuestions, generateHint, updateQuestion } from '@/lib/api'
import { deleteExistingQuestion } from '@/lib/slices/questionSlice'

import './questions-neobrutalism.css'
import ConfirmModal from '@/components/ConfirmModal'

// Helper to generate a consistent, visually appealing color from a string (e.g., collection ID)
const generateColorFromString = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 70%, 80%)`
}

// Helper to extract text content from question.content (string or object)
const getQuestionContentText = (content: string | { text?: string } | any): string => {
  if (typeof content === 'string') return content
  if (content && typeof content === 'object' && 'text' in content) return content.text || ''
  return String(content || '')
}

// Helper function to translate question types
const translateQuestionType = (type: string) => {
  const typeMap: { [key: string]: string } = {
    'multiple_choice': '选择题',
    'single_choice': '选择题',
    'fill_blank': '填空题',
    'fill-blank': '填空题',
    'true_false': '判断题',
    'essay': '问答题',
    'other': '其他',
  }
  return typeMap[type] || type
}

// Helper function to translate difficulty levels
const translateDifficulty = (difficulty: string) => {
  const difficultyMap: { [key: string]: string } = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难',
  }
  return difficultyMap[difficulty?.toLowerCase()] || difficulty
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
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false)
  const [isGeneratingHint, setIsGeneratingHint] = useState(false)
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null)
  const [similarQuestions, setSimilarQuestions] = useState<any[] | null>(null)
  const [hintData, setHintData] = useState<{
    level1_knowledge: string[]
    level2_approach: string[]
    level3_steps: string[]
  } | null>(null)
  const [hintLevel, setHintLevel] = useState<number>(0)
  const [userNotes, setUserNotes] = useState<string>('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  
  // Initialize notes from question
  useEffect(() => {
    if (question?.user_notes) {
      setUserNotes(question.user_notes)
    } else {
      setUserNotes('')
    }
  }, [question])
  
  if (!isOpen || !question) return null

  const collectionColor = collection ? generateColorFromString(collection.id) : '#E5E7EB'
  
  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    try {
      await updateQuestion(question.id, { user_notes: userNotes })
      alert('笔记保存成功！')
    } catch (error) {
      console.error('Failed to save notes:', error)
      alert('保存笔记失败，请稍后重试')
    } finally {
      setIsSavingNotes(false)
    }
  }
  
  const handleGetReferenceAnswer = async () => {
    setIsGeneratingAnswer(true)
    try {
      const resp = await generateReferenceAnswer({
        question: {
          id: question.id,
          number: question.number,
          question_type: question.question_type || question.type,
          content: question.content,
          full_content: question.full_content,
          options: question.options,
        },
        language: 'zh',
      })

      const answerText = [resp?.answer, resp?.explanation].filter(Boolean).join('\n\n')
      setGeneratedAnswer(answerText || '未生成到答案')
    } catch (error) {
      console.error('Failed to generate answer:', error)
      alert('生成答案失败，请稍后重试')
    } finally {
      setIsGeneratingAnswer(false)
    }
  }
  
  const handleGenerateHint = async () => {
    if (hintData && hintLevel < 3) {
      setHintLevel(hintLevel + 1)
      return
    }

    if (!hintData) {
      setIsGeneratingHint(true)
      try {
        const resp = await generateHint({
          question: {
            id: question.id,
            number: question.number,
            question_type: question.question_type || question.type,
            content: question.content,
            full_content: question.full_content,
            options: question.options,
          },
          language: 'zh',
        })

        setHintData(resp)
        setHintLevel(1)
      } catch (error) {
        console.error('Failed to generate hint:', error)
        alert('生成思路提示失败，请稍后重试')
      } finally {
        setIsGeneratingHint(false)
      }
    }
  }

  const handleGenerateSimilar = async () => {
    setIsGeneratingSimilar(true)
    try {
      const resp = await generateSimilarQuestions({
        question: {
          id: question.id,
          number: question.number,
          question_type: question.question_type || question.type,
          content: question.content,
          full_content: question.full_content,
          options: question.options,
        },
        count: 2,
        language: 'zh',
      })

      const items = Array.isArray(resp?.questions) ? resp.questions : []
      setSimilarQuestions(
        items.map((q: any, idx: number) => ({
          id: q.id || `similar-${idx + 1}`,
          content: q.content,
          question_type: q.question_type,
          answer: q.answer,
          explanation: q.explanation,
          options: q.options,
        }))
      )
    } catch (error) {
      console.error('Failed to generate similar questions:', error)
      alert('生成相似题目失败，请稍后重试')
    } finally {
      setIsGeneratingSimilar(false)
    }
  }

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
              题目详情
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
          {/* Question Content */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>题目</h3>
            <div style={{ 
              padding: '16px',
              backgroundColor: '#FEFCE8',
              border: '3px solid black',
              borderRadius: '8px',
              fontSize: '1rem',
              lineHeight: '1.6',
            }}>
              <MathRenderer content={question.content} />
            </div>
          </div>

          {/* Full Content (if available) */}
          {question.full_content && question.full_content !== question.content && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>完整内容</h3>
              <div style={{ 
                padding: '16px',
                backgroundColor: '#F0FDF4',
                border: '3px solid black',
                borderRadius: '8px',
                fontSize: '0.95rem',
                lineHeight: '1.6',
              }}>
                <MathRenderer content={question.full_content} />
              </div>
            </div>
          )}

          {/* Options (if available) - only show for multiple choice questions */}
          {question.options && question.question_type !== 'fill_blank' && question.question_type !== 'fill-blank' && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>选项</h3>
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
                          {options.map((option, index) => {
                            const optionText = typeof option === 'object' ? option.text || option.content || JSON.stringify(option) : option
                            return (
                              <div key={index} style={{ marginBottom: '8px' }}>
                                <strong>{optionLabels[index] || index + 1}. </strong>
                                <MathRenderer content={String(optionText)} />
                              </div>
                            )
                          })}
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
                            {optionEntries.map(([key, value], index) => {
                              const optionText = typeof value === 'object' ? JSON.stringify(value) : String(value || '')
                              return (
                                <div key={key} style={{ marginBottom: '8px' }}>
                                  <strong>{optionLabels[index] || key}. </strong>
                                  <MathRenderer content={optionText} />
                                </div>
                              )
                            })}
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
              <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>正确答案</h3>
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
              <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>解析</h3>
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

          {/* User Notes Section */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>我的笔记</h3>
            <div style={{ 
              marginBottom: '12px',
            }}>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="在这里记录你的思考、解题思路或需要注意的地方..."
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#FFFBEB',
                  border: '3px solid black',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '120px',
                  boxSizing: 'border-box',
                }}
                rows={5}
              />
            </div>
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              style={{
                padding: '10px 24px',
                backgroundColor: isSavingNotes ? '#D1D5DB' : '#10B981',
                color: 'white',
                border: '3px solid black',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: isSavingNotes ? 'not-allowed' : 'pointer',
                boxShadow: '4px 4px 0 rgba(0,0,0,1)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSavingNotes) {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)'
                  e.currentTarget.style.boxShadow = '6px 6px 0 rgba(0,0,0,1)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(0, 0)'
                e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,1)'
              }}
            >
              {isSavingNotes ? '保存中...' : '保存笔记'}
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#F9FAFB',
            border: '3px solid black',
            borderRadius: '12px',
          }}>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              flexWrap: 'nowrap',
              alignItems: 'center',
            }}>
              <button
                onClick={handleGetReferenceAnswer}
                disabled={isGeneratingAnswer}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  backgroundColor: isGeneratingAnswer ? '#D1D5DB' : '#3B82F6',
                  color: 'white',
                  border: '3px solid black',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isGeneratingAnswer ? 'not-allowed' : 'pointer',
                  boxShadow: '4px 4px 0 rgba(0,0,0,1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isGeneratingAnswer) {
                    e.currentTarget.style.transform = 'translate(-2px, -2px)'
                    e.currentTarget.style.boxShadow = '6px 6px 0 rgba(0,0,0,1)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)'
                  e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,1)'
                }}
              >
                {isGeneratingAnswer ? (
                  <>
                    <IconLoader size={18} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <IconBookOpen size={18} />
                    获取参考答案
                  </>
                )}
              </button>
              
              <button
                onClick={handleGenerateHint}
                disabled={isGeneratingHint}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  backgroundColor: isGeneratingHint ? '#D1D5DB' : '#10B981',
                  color: 'white',
                  border: '3px solid black',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isGeneratingHint ? 'not-allowed' : 'pointer',
                  boxShadow: '4px 4px 0 rgba(0,0,0,1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isGeneratingHint) {
                    e.currentTarget.style.transform = 'translate(-2px, -2px)'
                    e.currentTarget.style.boxShadow = '6px 6px 0 rgba(0,0,0,1)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)'
                  e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,1)'
                }}
              >
                {isGeneratingHint ? (
                  <>
                    <IconLoader size={18} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <IconLightbulb size={18} />
                    {hintLevel === 0 ? '获取思路提示' : hintLevel < 3 ? '查看更多提示' : '思路提示'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Hint Display */}
          {hintData && hintLevel > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>💡 思路提示</h3>
              
              {hintLevel >= 1 && hintData.level1_knowledge.length > 0 && (
                <div style={{ 
                  padding: '16px',
                  backgroundColor: '#FEF3C7',
                  border: '3px solid black',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '8px', color: '#92400E', fontSize: '0.9rem' }}>
                    📚 第1层：考查的知识点
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {hintData.level1_knowledge.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {hintLevel >= 2 && hintData.level2_approach.length > 0 && (
                <div style={{ 
                  padding: '16px',
                  backgroundColor: '#FED7AA',
                  border: '3px solid black',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '8px', color: '#7C2D12', fontSize: '0.9rem' }}>
                    🎯 第2层：解题思路
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {hintData.level2_approach.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {hintLevel >= 3 && hintData.level3_steps.length > 0 && (
                <div style={{ 
                  padding: '16px',
                  backgroundColor: '#FECACA',
                  border: '3px solid black',
                  borderRadius: '8px',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '8px', color: '#7F1D1D', fontSize: '0.9rem' }}>
                    🔑 第3层：关键步骤
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {hintData.level3_steps.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Generated Answer */}
          {generatedAnswer && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>参考答案</h3>
              <div style={{ 
                padding: '16px',
                backgroundColor: '#DCFCE7',
                border: '3px solid black',
                borderRadius: '8px',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
              }}>
                {generatedAnswer}
              </div>
            </div>
          )}

          {/* Similar Questions */}
          {similarQuestions && similarQuestions.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                fontWeight: 900, 
                marginBottom: '12px', 
                fontSize: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <IconSparkles size={20} style={{ color: '#3B82F6' }} />
                <span>举一反三 - 相似题目</span>
              </h3>
              <div style={{ 
                backgroundColor: '#EFF6FF',
                border: '3px solid black',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                {similarQuestions.map((simQuestion, index) => (
                  <div 
                    key={simQuestion.id} 
                    style={{ 
                      padding: '16px',
                      borderBottom: index < similarQuestions.length - 1 ? '2px solid black' : 'none',
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '8px' 
                    }}>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '0.875rem',
                        color: '#3B82F6'
                      }}>
                        相似题目 {index + 1}
                      </span>
                      {simQuestion.question_type && (
                        <span style={{ 
                          padding: '2px 8px',
                          backgroundColor: 'white',
                          border: '2px solid black',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}>
                          {simQuestion.question_type}
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      marginBottom: '8px'
                    }}>
                      <MathRenderer content={simQuestion.content} />
                    </div>
                    {simQuestion.answer && (
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#059669',
                        fontWeight: 600,
                        marginTop: '8px',
                      }}>
                        答案: {simQuestion.answer}
                      </div>
                    )}
                  </div>
                ))}
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
              <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>类型</div>
              <div style={{ fontWeight: 900 }}>{translateQuestionType(question.question_type) || 'N/A'}</div>
            </div>
            
            {question.difficulty_level && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>难度</div>
                <div style={{ fontWeight: 900 }}>{translateDifficulty(question.difficulty_level)}</div>
              </div>
            )}
            
            {question.subject && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>科目</div>
                <div style={{ fontWeight: 900 }}>{question.subject}</div>
              </div>
            )}
            
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>创建时间</div>
              <div style={{ fontWeight: 900 }}>{new Date(question.created_at).toLocaleDateString()}</div>
            </div>
            
            {question.topic_tags && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '8px', color: '#6B7280' }}>标签</div>
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
  const collectionTitle = isUnassigned ? '未分类' : (collection?.title || '未分类')

  // Track if we just performed an action (to prevent onClick from firing)
  const actionPerformedRef = useRef(false)

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if an action was just performed
    if (actionPerformedRef.current) {
      actionPerformedRef.current = false
      return
    }
    onClick?.()
  }

  const handleAction = (action: string) => {
    actionPerformedRef.current = true
    onAction(action, question)
    // Reset after a short delay in case click doesn't fire
    setTimeout(() => {
      actionPerformedRef.current = false
    }, 100)
  }

  return (
    <div
      className="unified-question-card"
      style={{ borderLeftColor: collectionColor }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={handleCardClick}
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
      {/* Header removed - only show menu button in top-right corner */}
      <div style={{ position: 'absolute', top: '6px', right: '6px', zIndex: 1 }}>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="card-action-btn"
              aria-label="题目操作"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                padding: '4px',
                opacity: 0.6,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6'
              }}
            >
              <IconMore size={20} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              className="card-dropdown-content" 
              sideOffset={5}
              onCloseAutoFocus={(e) => {
                // Prevent focus from returning to trigger, which can cause card click
                e.preventDefault()
              }}
            >
              <DropdownMenu.Item
                className="card-dropdown-item"
                onSelect={(e) => {
                  e.preventDefault()
                  handleAction('move')
                }}
              >
                <IconMove size={14} />
                <span>更改错题集</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="card-dropdown-separator" />
              <DropdownMenu.Item
                className="card-dropdown-item danger"
                onSelect={(e) => {
                  e.preventDefault()
                  handleAction('delete')
                }}
              >
                <IconTrash size={14} />
                <span>删除</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <div className="card-content" style={{ paddingTop: '36px', paddingRight: '8px' }}>
        <MathRenderer content={question.content} />
      </div>
      <div className="card-footer" style={{ borderTop: 'none' }}>
        <span className="card-meta-tag">{translateQuestionType(question.question_type)}</span>
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
  const { isAuthenticated, isLoading: authLoading } = useSelector((state: RootState) => state.auth)

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

  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    question: null as any,
    isLoading: false,
  })

  // Collection deletion modal states
  const [collectionDeleteModal, setCollectionDeleteModal] = useState({
    isOpen: false,
    collection: null as any,
    isLoading: false,
  })

  // Track if we're in the middle of a delete action
  const [isDeleteActionInProgress, setIsDeleteActionInProgress] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Holds authoritative collection->questions mapping from backend unified endpoint
  const [collectionsWithQuestions, setCollectionsWithQuestions] = useState<any[] | null>(null)

  // Track UI drag state (optional feedback)
  const [dragOverCollectionId, setDragOverCollectionId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Separate useEffect for auth redirect - only runs once after auth is initialized
  useEffect(() => {
    if (!mounted) {
      return
    }

    // Wait for auth loading to complete
    if (authLoading) {
      console.log('🔐 Questions: Auth still loading...')
      return
    }

    // Check token in localStorage as well to avoid false negatives
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    
    console.log('=== 🔐 Questions: Auth check ===')
    console.log('isAuthenticated:', isAuthenticated)
    console.log('hasToken:', !!token)
    console.log('authLoading:', authLoading)
    console.log('authChecked:', authChecked)
    console.log('================================')

    // Only redirect if auth is fully loaded AND no token exists AND not authenticated
    if (!authChecked && !authLoading) {
      setAuthChecked(true)
      
      if (!isAuthenticated && !token) {
        console.log('❌ Questions: Not authenticated, redirecting to login')
        router.push('/login')
      } else {
        console.log('✅ Questions: Authenticated, ready to load data')
      }
    }
  }, [mounted, authLoading, isAuthenticated, router, authChecked])

  // Separate useEffect for data loading
  useEffect(() => {
    console.log('📊 Data loading useEffect triggered:', {
      authChecked,
      authLoading,
      mounted,
      isAuthenticated
    })

    // Wait for auth to be checked first
    if (!authChecked || authLoading || !mounted) {
      console.log('⏸️ Waiting for auth check or mount...')
      return
    }

    // Check if we have authentication (either from Redux or localStorage)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    console.log('🔍 Token check:', {
      hasReduxAuth: isAuthenticated,
      hasLocalToken: !!token
    })

    if (!isAuthenticated && !token) {
      // Don't load data if not authenticated
      console.log('⏸️ Questions: Skipping data load - not authenticated')
      return
    }

    console.log('✅ Proceeding with data load...')

    const loadInitialData = async () => {
      setIsProcessing(true)
      setPageError(null)
      
      console.log('🔄 Starting API calls...')
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (isProcessing) {
          console.warn('Loading timeout - forcing load complete')
          setIsProcessing(false)
          setPageError('Loading timeout. Please refresh the page.')
        }
      }, 10000) // 10 second timeout

      try {
        // 1) Load collections into redux (used elsewhere + for create actions)
        // Use catch instead of unwrap to ensure state is updated even on error
        await dispatch(fetchCollections()).unwrap().catch((err: any) => {
          console.error('Failed to fetch collections:', err)
          // Don't re-throw, just log it
        })

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
        clearTimeout(timeoutId)
        setIsProcessing(false)
      }
    }

    loadInitialData()
  }, [mounted, authChecked, authLoading, isAuthenticated, dispatch]) // Update dependencies

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
      
      // Check if question is only in default collection or unassigned
      const nonDefaultCollections = assignedCollections.filter((col: any) => 
        col?.title !== 'Uncategorized' && 
        col?.title !== '默认错题本' && 
        col?.title !== 'Default'
      );
      
      // For display purposes, show the first collection or mark as uncategorized
      const primaryCollection = assignedCollections.length > 0 
        ? assignedCollections[0]
        : { id: 'unassigned', title: 'Uncategorized' };
      
      return {
        ...question,
        collection: primaryCollection,
        assignedCollections, // Store all collections this question belongs to
        isUnassigned: assignedCollections.length === 0,
        isOnlyInDefaultCollection: nonDefaultCollections.length === 0 && assignedCollections.length > 0,
      };
    });
  }, [allQuestions, collectionsWithQuestions]);

  // Show unassigned questions AND questions from the default collection
  const filteredQuestions = useMemo(() => {
    return allQuestionsWithCollection.filter((q: any) => {
      // Show if unassigned
      if (q.isUnassigned) return true

      // Show if only in the default collection
      const isInDefaultCollection = q.assignedCollections?.some((col: any) => 
        col?.title === 'Uncategorized' || 
        col?.title === '默认错题本' || 
        col?.title === 'Default'
      )

      // Show if ONLY in default collection (not in any other non-default collections)
      const nonDefaultCollections = q.assignedCollections?.filter((col: any) => 
        col?.title !== 'Uncategorized' && 
        col?.title !== '默认错题本' && 
        col?.title !== 'Default'
      ) || []

      return isInDefaultCollection && nonDefaultCollections.length === 0
    })
  }, [allQuestionsWithCollection])

  const handleAction = (action: string, payload: any) => {
    console.log('Action:', action, 'Payload:', payload)
    switch (action) {
      case 'edit':
        window.alert(`Editing: ${payload.content}`)
        break
      case 'delete':
        setIsDeleteActionInProgress(true) // Set delete action in progress
        setConfirmModal({
          isOpen: true,
          question: payload,
          isLoading: false,
        })
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

  const handleDeleteQuestion = async (questionId: string) => {
    setConfirmModal(prev => ({ ...prev, isLoading: true }))
    try {
      await dispatch(deleteExistingQuestion(questionId)).unwrap()
      
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
    } catch (error) {
      console.error('Failed to delete question:', error)
      setPageError('删除题目失败，请稍后重试')
    } finally {
      setConfirmModal({ isOpen: false, question: null, isLoading: false })
      setIsProcessing(false)
      setIsDeleteActionInProgress(false) // Reset delete action state
    }
  }

  const handleDeleteCollection = async (collectionId: string) => {
    setCollectionDeleteModal(prev => ({ ...prev, isLoading: true }))
    try {
      // TODO: Implement actual collection deletion API call
      // await dispatch(deleteCollection(collectionId)).unwrap()
      
      // For now, just show that it's coming soon
      console.log('Delete collection:', collectionId)
      alert('删除功能即将实现')
      
      // Refresh data after deletion
      // const [collectionsData, allQuestionsData] = await Promise.all([
      //   getCollectionsWithQuestions(),
      //   getQuestions({ limit: 1000 })
      // ])
      // if (Array.isArray(collectionsData)) {
      //   setCollectionsWithQuestions(collectionsData)
      // }
      // if (allQuestionsData && Array.isArray(allQuestionsData.questions)) {
      //   setAllQuestions(allQuestionsData.questions)
      // } else if (Array.isArray(allQuestionsData)) {
      //   setAllQuestions(allQuestionsData)
      // }
    } catch (error) {
      console.error('Failed to delete collection:', error)
      setPageError('删除错题集失败，请稍后重试')
    } finally {
      setCollectionDeleteModal({ isOpen: false, collection: null, isLoading: false })
      setIsProcessing(false)
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
      <header className="unified-header" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          {/* Search Bar */}
          <div className="relative" style={{ flex: 1, maxWidth: '400px' }}>
            <IconSearch 
              size={16} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" 
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder="搜索..."
              className="neo-search-input"
              style={{
                width: '100%',
                paddingLeft: '2.75rem',
              }}
            />
          </div>
          
          {/* Right Side Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Create Button with Dropdown - Moved from FAB */}
            {mounted && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button 
                    className="neo-create-btn"
                    aria-label="Create new"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '9999px',
                      border: '3px solid black',
                      backgroundColor: '#A3E635',
                      color: 'black',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      boxShadow: '4px 4px 0px 0px #000',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <IconPlus size={18} />
                    <span>新建</span>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="card-dropdown-content" sideOffset={8} align="end">
                    <DropdownMenu.Item className="card-dropdown-item" onSelect={() => handleCreate('question')}>
                      <IconEdit />
                      <span>新建题目</span>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="card-dropdown-item" onSelect={() => handleCreate('collection')}>
                      <IconFolder size={14} />
                      <span>新建错题集</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}

            {/* View Mode Toggle */}
            <div
              className="neo-toggle-group"
              style={{
                opacity: mounted ? 1 : 0,
                pointerEvents: mounted ? 'auto' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0,
              }}
            >
              <button
                type="button"
                className={`neo-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                aria-pressed={viewMode === 'card'}
                onClick={() => setViewMode('card')}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <IconGrid size={14} />
                卡片
              </button>

              <button
                type="button"
                className={`neo-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <IconList size={14} />
                列表
              </button>
            </div>
          </div>
        </div>
      </header>

      {pageError && <div className="questions-error">{pageError}</div>}

      {/* Unified view: collections + default questions */}
      <main 
        className={viewMode === 'card' ? 'unified-main-grid' : 'unified-main-list'}
        style={viewMode === 'list' ? { marginLeft: '16px', marginRight: '16px', padding: 0 } : {}}
      >
        {viewMode === 'list' && (
          <div className="list-view-header">
            <div></div>
            <div>名称</div>
            <div>类型</div>
            <div>错题集</div>
            <div>创建日期</div>
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
                  onClick={() => router.push(`/collections/${cId}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') router.push(`/collections/${cId}`)
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
                  <div className="questions-card-header" style={{ backgroundColor: generateColorFromString(cId), opacity: 0.7, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconFolder size={16} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setCollectionDeleteModal({
                          isOpen: true,
                          collection: c,
                          isLoading: false,
                        })
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        opacity: 0.6,
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.6'
                      }}
                      aria-label="删除错题集"
                    >
                      <IconTrash size={16} />
                    </button>
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
                        道题
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="card-meta-tag">错题集</span>
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
                  // Don't open modal if a delete action is in progress
                  if (!isDeleteActionInProgress) {
                    setSelectedQuestion(q)
                    setSelectedQuestionCollection(q.collection)
                    setIsModalOpen(true)
                  }
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
                  onClick={() => router.push(`/collections/${cId}`)}
                >
                  <div className="list-view-icon">
                    <IconFolder size={20} color={generateColorFromString(cId)} />
                  </div>
                  <div className="list-view-name">{c.title}</div>
                  <div className="list-view-type">错题集</div>
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
                          <DropdownMenu.Item className="card-dropdown-item" onSelect={() => router.push(`/collections/${cId}`)}>
                            <IconFolder size={14} />
                            <span>打开错题集</span>
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="card-dropdown-separator" />
                          <DropdownMenu.Item className="card-dropdown-item danger" onSelect={() => window.alert('删除错题集')}>
                            <IconTrash size={14} />
                            <span>删除</span>
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
                  // Don't open modal if a delete action is in progress
                  if (!isDeleteActionInProgress) {
                    setSelectedQuestion(q)
                    setSelectedQuestionCollection(q.collection)
                    setIsModalOpen(true)
                  }
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
                <div className="list-view-type">{translateQuestionType(q.question_type) || '题目'}</div>
                <div className="list-view-collection">
                  <IconFolder size={12} />
                  <span style={{ 
                    color: q.isUnassigned ? '#9CA3AF' : 'inherit',
                    fontStyle: q.isUnassigned ? 'italic' : 'normal'
                  }}>
                    {q.collection?.title || '未分类'}
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
                      <DropdownMenu.Content 
                        className="card-dropdown-content" 
                        sideOffset={5}
                        onCloseAutoFocus={(e) => {
                          // Prevent focus from returning to trigger, which can cause row click
                          e.preventDefault()
                        }}
                      >
                        <DropdownMenu.Item className="card-dropdown-item" onSelect={(e) => { e.preventDefault(); handleAction('edit', q) }}>
                          <IconEdit />
                          <span>编辑题目</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item className="card-dropdown-item" onSelect={(e) => { e.preventDefault(); handleAction('tags', q) }}>
                          <IconTag size={14} />
                          <span>管理标签</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item className="card-dropdown-item" onSelect={(e) => { e.preventDefault(); handleAction('move', q) }}>
                          <IconMove size={14} />
                          <span>更改错题集</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="card-dropdown-separator" />
                        <DropdownMenu.Item className="card-dropdown-item danger" onSelect={(e) => { e.preventDefault(); handleAction('delete', q) }}>
                          <IconTrash size={14} />
                          <span>删除</span>
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
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '16px' 
          }}>
            <IconLoader size={48} className="animate-spin" style={{ color: '#3B82F6' }} />
            <div style={{ 
              fontWeight: 900, 
              fontSize: '1.25rem',
              color: '#111827',
            }}>
              Loading...
            </div>
          </div>
        </div>
      )}

      {/* NOTE: Floating Action Button (FAB) has been moved to the top toolbar */}

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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => {
          if (!confirmModal.isLoading) {
            setConfirmModal({ ...confirmModal, isOpen: false })
            setIsDeleteActionInProgress(false) // Reset delete action state when modal is closed
          }
        }}
        onConfirm={() => {
          const questionId = confirmModal.question?.id
          if (!questionId) return
          
          handleDeleteQuestion(questionId)
        }}
        title="删除题目"
        message="确定要永久删除这道题目吗？此操作无法撤销，题目将从所有题目集中被移除。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
        isLoading={confirmModal.isLoading}
      />

      {/* Collection Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={collectionDeleteModal.isOpen}
        onClose={() => !collectionDeleteModal.isLoading && setCollectionDeleteModal({ ...collectionDeleteModal, isOpen: false })}
        onConfirm={() => {
          const collectionId = collectionDeleteModal.collection?.id
          if (!collectionId) return
          
          handleDeleteCollection(collectionId)
        }}
        title="删除错题本"
        message={`确定要永久删除错题本"${collectionDeleteModal.collection?.title}"吗？此操作无法撤销，错题本中的所有题目将被移除（但题目本身不会被删除）。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
        isLoading={collectionDeleteModal.isLoading}
      />
    </div>
  )
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={
      <div className="loading-overlay">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '16px' 
        }}>
          <IconLoader size={48} className="animate-spin" style={{ color: '#3B82F6' }} />
          <div style={{ 
            fontWeight: 900, 
            fontSize: '1.25rem',
            color: '#111827',
          }}>
            Loading...
          </div>
        </div>
      </div>
    }>
      <QuestionsContent />
    </Suspense>
  )
}
