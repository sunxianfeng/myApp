'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { globalSearch, generateReferenceAnswer, generateHint, generateSimilarQuestions } from '@/lib/api'
import MathRenderer from '@/components/common/MathRenderer'
import { BookOpen, Lightbulb, Loader2, Sparkles } from 'lucide-react'

// Helper function to generate colors from collection ID
const generateColorFromString = (str: string) => {
  const colors = [
    '#FECACA', '#FED7AA', '#FDE68A', '#D9F99D', '#BBF7D0',
    '#A7F3D0', '#A5F3FC', '#BFDBFE', '#C7D2FE', '#DDD6FE',
    '#F3E8FF', '#FBCFE8'
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// IconFolder component (from Tabler icons)
const IconFolder = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
  </svg>
)

// IconX component (from Tabler icons)
const IconX = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
)

// Search Icon Component
function SearchIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      className={className} 
      style={style}
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth="2.5"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    </svg>
  )
}

// Question Type Map
const questionTypeMap: Record<string, string> = {
  multiple_choice: '选择题',
  single_choice: '选择题',
  fill_blank: '填空题',
  true_false: '判断题',
  essay: '解答题',
  other: '其他',
}

// Question Card Component
function QuestionCard({ question, onClick }: { question: any; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false)
  
  const contentText = typeof question.content === 'string' 
    ? question.content 
    : question.content?.text || JSON.stringify(question.content)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#FFFFFF',
        border: '3px solid #000000',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: isHovered 
          ? '8px 8px 0px 0px rgba(0,0,0,1)' 
          : '4px 4px 0px 0px rgba(0,0,0,1)',
        transform: isHovered ? 'translate(-2px, -2px)' : 'translate(0, 0)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            backgroundColor: '#FEF08A',
            color: '#000000',
            padding: '0.25rem 0.75rem',
            borderRadius: '0.5rem',
            border: '2px solid #000000',
            fontSize: '0.875rem',
            fontWeight: 700,
          }}>
            {questionTypeMap[question.question_type] || question.question_type}
          </span>
          {question.difficulty_level && (
            <span style={{
              backgroundColor: '#DBEAFE',
              color: '#000000',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.5rem',
              border: '2px solid #000000',
              fontSize: '0.875rem',
              fontWeight: 700,
            }}>
              {question.difficulty_level}
            </span>
          )}
        </div>
        {question.number && (
          <span style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#6b7280',
          }}>
            #{question.number}
          </span>
        )}
      </div>
      
      <div style={{
        fontSize: '1rem',
        color: '#000000',
        lineHeight: '1.6',
        marginBottom: '0.75rem',
        maxHeight: '4.5rem',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
      }}>
        <MathRenderer content={contentText} />
      </div>

      {question.options && question.options.length > 0 && (
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {question.options.slice(0, 2).map((opt: any, idx: number) => (
            <div key={idx}>
              <strong>{opt.label}.</strong> {opt.content.substring(0, 30)}...
            </div>
          ))}
          {question.options.length > 2 && (
            <div style={{ fontStyle: 'italic', marginTop: '0.25rem' }}>
              ...还有 {question.options.length - 2} 个选项
            </div>
          )}
        </div>
      )}
      
      {question.created_at && (
        <div style={{
          fontSize: '0.75rem',
          color: '#9ca3af',
          marginTop: '0.75rem',
          fontWeight: 600,
        }}>
          创建于 {new Date(question.created_at).toLocaleDateString('zh-CN')}
        </div>
      )}
    </div>
  )
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
  
  if (!isOpen || !question) return null

  const collectionColor = collection ? generateColorFromString(collection.id) : '#E5E7EB'
  
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
                    <Loader2 size={18} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <BookOpen size={18} />
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
                    <Loader2 size={18} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Lightbulb size={18} />
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
                <Sparkles size={20} style={{ color: '#3B82F6' }} />
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
              <div style={{ fontWeight: 900 }}>{question.question_type || 'N/A'}</div>
            </div>
            
            {question.difficulty_level && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>难度</div>
                <div style={{ fontWeight: 900 }}>{question.difficulty_level}</div>
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

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isHoveringInput, setIsHoveringInput] = useState(false)
  const [isFocusedInput, setIsFocusedInput] = useState(false)
  const [isHoveringButton, setIsHoveringButton] = useState(false)
  const [hoveredTip, setHoveredTip] = useState<string | null>(null)
  const [isHoveringLogo, setIsHoveringLogo] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Smooth scroll to search box when results appear
  useEffect(() => {
    if (hasSearched && searchResults.length > 0 && searchContainerRef.current) {
      setTimeout(() => {
        searchContainerRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)
    }
  }, [hasSearched, searchResults.length])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setHasSearched(false)
    
    try {
      // 使用向量搜索（use_vector: true）从 Qdrant Cloud 搜索
      const response = await globalSearch({
        q: searchQuery.trim(),
        limit: 20,
        use_vector: true  // 启用向量搜索
      })
      
      const questions = response?.questions || []
      setSearchResults(questions)
      setHasSearched(true)
    } catch (error: any) {
      console.error('Search failed:', error)
      setSearchResults([])
      setHasSearched(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleQuestionClick = (question: any) => {
    setSelectedQuestion(question)
    setIsModalOpen(true)
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 1rem',
      paddingTop: hasSearched ? '2rem' : '0',
      paddingBottom: '3rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'padding-top 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }}>
      {/* 装饰性元素 - 仅在未搜索时显示 */}
      {!hasSearched && (
        <>
          {/* Decorative Doodles - Top Left */}
          <div style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            opacity: 0.08,
            transform: 'rotate(-15deg)',
            pointerEvents: 'none'
          }}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <text x="10" y="40" fontFamily="'ZCOOL KuaiLe', cursive" fontSize="48" fontWeight="900" fill="#000000">∑</text>
              <text x="60" y="80" fontFamily="'ZCOOL KuaiLe', cursive" fontSize="36" fontWeight="900" fill="#000000">π</text>
              <circle cx="30" cy="90" r="15" stroke="#000000" strokeWidth="3" fill="none" />
            </svg>
          </div>

          {/* Decorative Doodles - Top Right */}
          <div style={{
            position: 'absolute',
            top: '3rem',
            right: '3rem',
            opacity: 0.06,
            transform: 'rotate(12deg)',
            pointerEvents: 'none'
          }}>
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
              <path d="M30 20 L30 50 L20 80 L80 80 L70 50 L70 20 Z" stroke="#000000" strokeWidth="3" fill="none" />
              <line x1="25" y1="20" x2="75" y2="20" stroke="#000000" strokeWidth="3" />
              <circle cx="50" cy="60" r="8" fill="#000000" opacity="0.3" />
            </svg>
          </div>

          {/* Decorative Doodles - Bottom Left */}
          <div style={{
            position: 'absolute',
            bottom: '3rem',
            left: '3rem',
            opacity: 0.07,
            transform: 'rotate(8deg)',
            pointerEvents: 'none'
          }}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <rect x="10" y="20" width="60" height="50" stroke="#000000" strokeWidth="3" fill="none" rx="4" />
              <line x1="40" y1="20" x2="40" y2="70" stroke="#000000" strokeWidth="3" />
              <line x1="20" y1="35" x2="35" y2="35" stroke="#000000" strokeWidth="2" />
              <line x1="20" y1="45" x2="35" y2="45" stroke="#000000" strokeWidth="2" />
            </svg>
          </div>

          {/* Decorative Doodles - Bottom Right */}
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            right: '2rem',
            opacity: 0.08,
            transform: 'rotate(-10deg)',
            pointerEvents: 'none'
          }}>
            <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
              <circle cx="55" cy="45" r="25" stroke="#000000" strokeWidth="3" fill="none" />
              <path d="M45 70 L45 85 L65 85 L65 70" stroke="#000000" strokeWidth="3" fill="none" />
              <line x1="55" y1="85" x2="55" y2="95" stroke="#000000" strokeWidth="3" />
              <line x1="48" y1="95" x2="62" y2="95" stroke="#000000" strokeWidth="3" />
              <line x1="30" y1="25" x2="20" y2="15" stroke="#000000" strokeWidth="2" />
              <line x1="80" y1="25" x2="90" y2="15" stroke="#000000" strokeWidth="2" />
              <line x1="25" y1="45" x2="10" y2="45" stroke="#000000" strokeWidth="2" />
            </svg>
          </div>

          <div style={{
            position: 'absolute',
            top: '50%',
            left: '10%',
            opacity: 0.05,
            transform: 'rotate(25deg)',
            pointerEvents: 'none'
          }}>
            <div aria-hidden style={{ fontFamily: "'ZCOOL KuaiLe', cursive", fontSize: '72px', fontWeight: 900, color: '#000000', lineHeight: 1 }}>✓</div>
          </div>

          <div style={{
            position: 'absolute',
            top: '30%',
            right: '8%',
            opacity: 0.06,
            transform: 'rotate(-20deg)',
            pointerEvents: 'none'
          }}>
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <polygon points="30,5 40,35 10,20 50,20 20,35" stroke="#000000" strokeWidth="3" fill="none" />
            </svg>
          </div>
        </>
      )}

      {/* Main Search Area */}
      <div 
        ref={searchContainerRef}
        style={{
          width: '100%',
          maxWidth: hasSearched ? '1200px' : '48rem',
          margin: hasSearched ? '0 auto' : '0 auto',
          marginTop: hasSearched ? '0' : 'auto',
          marginBottom: hasSearched ? '2rem' : 'auto',
          position: 'relative',
          zIndex: 10,
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Logo Badge - 搜索后缩小 */}
        {!hasSearched && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '3rem',
            opacity: hasSearched ? 0 : 1,
            transform: hasSearched ? 'scale(0.8)' : 'scale(1)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <div 
              onMouseEnter={() => setIsHoveringLogo(true)}
              onMouseLeave={() => setIsHoveringLogo(false)}
              style={{
                fontFamily: "'ZCOOL KuaiLe', cursive, sans-serif",
                fontSize: '3rem',
                fontWeight: 900,
                backgroundColor: '#000000',
                color: '#FFFFFF',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.75rem',
                boxShadow: isHoveringLogo 
                  ? '6px 6px 0px 0px rgba(0, 0, 0, 1)' 
                  : '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                letterSpacing: '0.05em',
                transform: isHoveringLogo 
                  ? 'rotate(-5deg) scale(1.05)' 
                  : 'rotate(-4deg)',
                display: 'inline-block',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                animation: isHoveringLogo ? 'wiggle 0.5s ease-in-out' : 'none'
              }}>
              题宝
            </div>
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handleSearch}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            width: '100%',
            margin: '0 auto'
          }}>
            {/* Input Field */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocusedInput(true)}
              onBlur={() => setIsFocusedInput(false)}
              onMouseEnter={() => setIsHoveringInput(true)}
              onMouseLeave={() => setIsHoveringInput(false)}
              placeholder="搜索题目..."
              disabled={isSearching}
              className="search-input-no-blue"
              style={{
                flex: 1,
                width: '100%',
                height: hasSearched ? '3.5rem' : '4rem',
                padding: '0 1.5rem',
                fontSize: hasSearched ? '1.125rem' : '1.25rem',
                fontWeight: 700,
                color: '#000000',
                background: '#FFFFFF',
                border: '4px solid #000000',
                borderRadius: '1rem',
                boxShadow: isFocusedInput 
                  ? '10px 10px 0px 0px rgba(0,0,0,1)' 
                  : isHoveringInput 
                    ? '8px 8px 0px 0px rgba(0,0,0,1)' 
                    : '6px 6px 0px 0px rgba(0,0,0,1)',
                outline: 'none',
                outlineWidth: '0',
                outlineStyle: 'none',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isFocusedInput 
                  ? 'translate(-5px, -5px) scale(1.01)' 
                  : isHoveringInput 
                    ? 'translate(-3px, -3px)' 
                    : 'translate(0, 0)',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            />
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              onMouseEnter={() => setIsHoveringButton(true)}
              onMouseLeave={() => setIsHoveringButton(false)}
              aria-label="搜索"
              style={{
                flexShrink: 0,
                width: hasSearched ? '3.5rem' : '4rem',
                height: hasSearched ? '3.5rem' : '4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: (isSearching || !searchQuery.trim()) 
                  ? '#000000' 
                  : isHoveringButton 
                    ? '#FDE047' 
                    : '#000000',
                color: (isSearching || !searchQuery.trim()) 
                  ? '#FFFFFF' 
                  : isHoveringButton 
                    ? '#000000' 
                    : '#FFFFFF',
                border: '4px solid #000000',
                borderRadius: '1rem',
                boxShadow: isHoveringButton && !isSearching && searchQuery.trim()
                  ? '8px 8px 0px 0px rgba(0,0,0,1)'
                  : '6px 6px 0px 0px rgba(0,0,0,1)',
                cursor: (isSearching || !searchQuery.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isHoveringButton && !isSearching && searchQuery.trim() 
                  ? 'translate(-3px, -3px) scale(1.05)' 
                  : 'translate(0, 0)',
                opacity: (isSearching || !searchQuery.trim()) ? 0.7 : 1
              }}
            >
              {isSearching ? (
                <svg 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  style={{ 
                    width: '1.5rem', 
                    height: '1.5rem',
                    animation: 'spin 1s linear infinite',
                    stroke: 'currentColor'
                  }}
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <SearchIcon style={{ width: '1.5rem', height: '1.5rem', color: 'currentColor' }} />
              )}
            </button>
          </div>
        </form>

        {/* Search Tips - 仅在未搜索时显示 */}
        {!hasSearched && (
          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#000000',
            opacity: hasSearched ? 0 : 1,
            transform: hasSearched ? 'translateY(-10px)' : 'translateY(0)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <p style={{ marginBottom: '0.75rem', color: '#000000', fontWeight: 600 }}>试试搜索：</p>
            <div>
              {['二次函数', '物理力学', '化学反应'].map((tip) => (
                <span
                  key={tip}
                  onClick={() => setSearchQuery(tip)}
                  onMouseEnter={() => setHoveredTip(tip)}
                  onMouseLeave={() => setHoveredTip(null)}
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    margin: '0.25rem',
                    background: hoveredTip === tip ? '#FEF08A' : '#FFFFFF',
                    border: '2px solid #000000',
                    borderRadius: '0.75rem',
                    fontWeight: 700,
                    color: '#000000',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: hoveredTip === tip 
                      ? '4px 4px 0px 0px rgba(0,0,0,1)' 
                      : '2px 2px 0px 0px rgba(0,0,0,1)',
                    transform: hoveredTip === tip ? 'translate(-1px, -1px)' : 'none'
                  }}
                >
                  {tip}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results Section */}
      {hasSearched && (
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          animation: 'fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          {/* Results Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            padding: '0 0.5rem',
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              color: '#000000',
            }}>
              {searchResults.length === 0 ? (
                '未找到结果'
              ) : (
                <>找到 <span style={{ color: '#A3E635' }}>{searchResults.length}</span> 道题目</>
              )}
            </h2>
            <button
              onClick={() => {
                setHasSearched(false)
                setSearchResults([])
                setSearchQuery('')
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#FFFFFF',
                border: '2px solid #000000',
                borderRadius: '0.75rem',
                fontWeight: 700,
                color: '#000000',
                cursor: 'pointer',
                boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-1px, -1px)'
                e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(0, 0)'
                e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgba(0,0,0,1)'
              }}
            >
              清除搜索
            </button>
          </div>

          {/* Results Grid */}
          {searchResults.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem',
            }}>
              {searchResults.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onClick={() => handleQuestionClick(question)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {searchResults.length === 0 && (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '3px solid #000000',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
              }}>
                🔍
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                color: '#000000',
                marginBottom: '0.5rem',
              }}>
                没有找到相关题目
              </h3>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                marginBottom: '1.5rem',
              }}>
                试试其他关键词，或者上传新的题目
              </p>
              <button
                onClick={() => router.push('/upload')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#A3E635',
                  border: '3px solid #000000',
                  borderRadius: '0.75rem',
                  fontWeight: 700,
                  color: '#000000',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)'
                  e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)'
                  e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)'
                }}
              >
                上传题目
              </button>
            </div>
          )}
        </div>
      )}

      {/* Keyframes for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          @keyframes wiggle {
            0%, 100% { transform: rotate(-5deg) scale(1.05); }
            25% { transform: rotate(-6deg) scale(1.06); }
            50% { transform: rotate(-4deg) scale(1.05); }
            75% { transform: rotate(-6deg) scale(1.06); }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Force remove all default focus styles */
          .search-input-no-blue,
          .search-input-no-blue:focus,
          .search-input-no-blue:focus-visible,
          .search-input-no-blue:active {
            outline: none !important;
            outline-width: 0 !important;
            outline-style: none !important;
            outline-color: transparent !important;
            box-shadow: inherit !important;
            border-color: #000000 !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }
          
          /* Remove any ring or glow effects */
          .search-input-no-blue:focus {
            --tw-ring-offset-shadow: 0 0 #0000 !important;
            --tw-ring-shadow: 0 0 #0000 !important;
            --tw-ring-color: transparent !important;
          }
        `
      }} />
      
      {/* Question Detail Modal */}
      <QuestionDetailModal
        question={selectedQuestion}
        collection={null}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedQuestion(null)
        }}
      />
    </div>
  )
}