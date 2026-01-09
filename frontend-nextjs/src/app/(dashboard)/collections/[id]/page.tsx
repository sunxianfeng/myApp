'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  Folder as IconFolder,
  MoreHorizontal as IconMore,
  Trash2 as IconTrash,
  Tag as IconTag,
  Edit as IconEdit,
  Star as IconStar,
  ArrowLeft as IconArrowLeft,
  X as IconX,
  FileDown as IconFileDown,
  Printer as IconPrinter,
  BookOpen as IconBookOpen,
  Target as IconTarget,
  TrendingUp as IconTrendingUp,
  LayoutGrid as IconLayoutGrid,
  List as IconList,
  Lightbulb as IconLightbulb,
  Loader2 as IconLoader,
} from 'lucide-react'

import type { AppDispatch } from '@/lib/store'
import {
  fetchCollection,
  removeQuestionFromCol,
  updateQuestionInCol,
  modifyCollection,
  selectCurrentCollection,
  selectCollectionLoading,
  selectCollectionError,
  clearCurrentCollection
} from '@/lib/slices/collectionSlice'
import type { QuestionInCollection } from '@/types/api'
import '../../questions/questions-neobrutalism.css'

// Helper to generate a consistent, visually appealing color from a string
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
    'Easy': '简单',
    'Medium': '中等',
    'Hard': '困难',
  }
  return difficultyMap[difficulty] || difficulty
}

import { generateReferenceAnswer, generateSimilarQuestions, generateHint, updateQuestion } from '@/lib/api'

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
              {question.content}
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
                {question.full_content}
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
                          {options.map((option, index) => (
                            <div key={index} style={{ marginBottom: '8px' }}>
                              <strong>{optionLabels[index] || index + 1}. </strong>
                              {typeof option === 'object' ? option.text || option.content || JSON.stringify(option) : option}
                            </div>
                          ))}
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
                            {optionEntries.map(([key, value], index) => (
                              <div key={key} style={{ marginBottom: '8px' }}>
                                <strong>{optionLabels[index] || key}. </strong>
                                {typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
                              </div>
                            ))}
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
              }}>
                {generatedAnswer}
              </div>
            </div>
          )}

          {/* Similar Questions */}
          {similarQuestions && similarQuestions.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.125rem' }}>相似题目</h3>
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
                    </div>
                    <div style={{ 
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                    }}>
                      {simQuestion.content}
                    </div>
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
              <div style={{ fontWeight: 900 }}>{translateQuestionType(question.question_type) || '未知'}</div>
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
              <div style={{ fontWeight: 900 }}>{new Date(question.created_at || question.added_at).toLocaleDateString()}</div>
            </div>
            
            {/* Collection-specific fields */}
            {question.mastery_level !== undefined && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>掌握程度</div>
                <div style={{ fontWeight: 900 }}>{question.mastery_level}/5</div>
              </div>
            )}
            
            {question.times_practiced !== undefined && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', color: '#6B7280' }}>练习次数</div>
                <div style={{ fontWeight: 900 }}>{question.times_practiced}</div>
              </div>
            )}
            
            {question.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '8px', color: '#6B7280' }}>笔记</div>
                <div style={{ 
                  padding: '12px',
                  backgroundColor: '#F8FAFC',
                  border: '2px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                }}>
                  {question.notes}
                </div>
              </div>
            )}
            
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

// Question Card Component (matching questions page style)
const QuestionCard = ({
  question,
  collection,
  onAction,
  onClick,
}: {
  question: any
  collection: any
  onAction: (action: string, payload: any) => void
  onClick?: () => void
}) => {
  const collectionColor = collection?.id ? generateColorFromString(collection.id) : '#E5E7EB'
  const collectionTitle = collection?.title || '未分类'

  return (
    <div
      className="unified-question-card"
      style={{ borderLeftColor: collectionColor }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return
        if (e.key === 'Enter' || e.key === ' ') onClick()
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
            <DropdownMenu.Content className="card-dropdown-content" sideOffset={5}>
              <DropdownMenu.Item
                className="card-dropdown-item danger"
                onSelect={() => onAction('remove', question)}
              >
                <IconTrash size={14} />
                <span>从错题本移除</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <div className="card-content" style={{ paddingTop: '36px', paddingRight: '8px' }}>{question.content}</div>
      <div className="card-footer" style={{ borderTop: 'none' }}>
        <span className="card-meta-tag">{translateQuestionType((question as any).question_type || (question as any).type) || '未知类型'}</span>
        <span className="card-meta-date">{new Date((question as any).created_at || question.added_at).toLocaleDateString('zh-CN')}</span>
      </div>
    </div>
  )
}

export default function CollectionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const dispatch = useDispatch<AppDispatch>()
  
  const collectionId = params?.id as string
  const collection = useSelector(selectCurrentCollection)
  const isLoading = useSelector(selectCollectionLoading)
  const error = useSelector(selectCollectionError)
  
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [sortBy, setSortBy] = useState<'added' | 'mastery' | 'practiced'>('added')
  const [filterMastery, setFilterMastery] = useState<number | 'all'>('all')
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [masteryLevel, setMasteryLevel] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Modal state for question details
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  
  useEffect(() => {
    if (collectionId) {
      dispatch(fetchCollection({ id: collectionId, includeQuestions: true }))
    }
    
    return () => {
      dispatch(clearCurrentCollection())
    }
  }, [collectionId, dispatch])
  
  const handleRemoveQuestion = async (questionId: string) => {
    if (confirm('确定要从题目集中移除这道题目吗？')) {
      try {
        setIsProcessing(true)
        await dispatch(removeQuestionFromCol({ collectionId, questionId })).unwrap()
        // Refresh the collection data
        await dispatch(fetchCollection({ id: collectionId, includeQuestions: true }))
      } catch (error) {
        console.error('Failed to remove question:', error)
        alert('从题目集移除题目失败')
      } finally {
        setIsProcessing(false)
      }
    }
  }
  
  const handleUpdateQuestion = async (questionId: string) => {
    await dispatch(updateQuestionInCol({
      collectionId,
      questionId,
      data: {
        notes: noteText,
        mastery_level: masteryLevel
      }
    }))
    setEditingQuestion(null)
  }
  
  const handleStartEdit = (question: QuestionInCollection) => {
    setEditingQuestion(question.id)
    setNoteText(question.notes || '')
    setMasteryLevel(question.mastery_level || 0)
  }
  
  const handleToggleFavorite = async () => {
    if (collection) {
      await dispatch(modifyCollection({
        id: collection.id,
        data: { is_favorite: !collection.is_favorite }
      }))
      dispatch(fetchCollection({ id: collectionId, includeQuestions: true }))
    }
  }
  
  const handleExportPDF = () => {
    // Open print preview page in new window
    const printUrl = `/papers/print/${collectionId}`
    window.open(printUrl, '_blank')
  }
  
  const handleAction = (action: string, payload: any) => {
    switch (action) {
      case 'edit':
        handleStartEdit(payload)
        break
      case 'tags':
        alert('管理标签功能即将推出...')
        break
      case 'remove':
        handleRemoveQuestion(payload.id)
        break
      default:
        break
    }
  }
  
  // Sort and filter
  const sortedQuestions = collection?.questions ? [...collection.questions].sort((a, b) => {
    if (sortBy === 'added') {
      return new Date(b.added_at || '').getTime() - new Date(a.added_at || '').getTime()
    } else if (sortBy === 'mastery') {
      return (a.mastery_level || 0) - (b.mastery_level || 0)
    } else if (sortBy === 'practiced') {
      return (b.times_practiced || 0) - (a.times_practiced || 0)
    }
    return 0
  }) : []
  
  const filteredQuestions = filterMastery === 'all'
    ? sortedQuestions
    : sortedQuestions.filter(q => (q.mastery_level || 0) === filterMastery)
  
  if (isLoading) {
    return (
      <div className="unified-questions-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ 
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          border: '3px solid black',
          borderRadius: '16px',
          boxShadow: '8px 8px 0 rgba(0,0,0,1)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⏳</div>
          <p style={{ fontWeight: 900, fontSize: '1.25rem', color: '#1F2937' }}>加载中...</p>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '8px' }}>正在获取题目集数据</p>
        </div>
      </div>
    )
  }
  
  if (error || !collection) {
    return (
      <div className="unified-questions-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ 
          textAlign: 'center',
          padding: '48px',
          backgroundColor: 'white',
          border: '3px solid black',
          borderRadius: '16px',
          boxShadow: '8px 8px 0 rgba(0,0,0,1)',
          maxWidth: '500px',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '24px' }}>😢</div>
          <h2 style={{ 
            fontWeight: 900, 
            fontSize: '1.75rem', 
            marginBottom: '12px',
            color: '#1F2937'
          }}>
            出错了
          </h2>
          <p style={{ 
            color: '#EF4444', 
            marginBottom: '24px', 
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.6,
          }}>
            {error || '未找到题目集'}
          </p>
          <button
            onClick={() => router.back()}
            style={{
              padding: '12px 28px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: '3px solid black',
              borderRadius: '8px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '4px 4px 0 rgba(0,0,0,1)',
              transition: 'all 0.2s',
              fontSize: '1rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(2px, 2px)'
              e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)'
              e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,1)'
            }}
          >
            ← 返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="unified-questions-page">
      {/* Header - Responsive */}
      <header className="unified-header">
        <div style={{ marginBottom: '2rem' }}>
          {/* 改进面包屑导航 */}
          <nav style={{ 
            marginBottom: '1.5rem', 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center', 
            fontSize: '0.875rem', 
            fontWeight: 700 
          }}>
            <button
              onClick={() => router.push('/questions')}
              style={{
                color: '#9CA3AF',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.875rem',
                padding: 0,
              }}
            >
              我的错题本
            </button>
            <span style={{ color: '#9CA3AF' }}>/</span>
            <span style={{ color: '#000' }}>{collection.title}</span>
          </nav>
          
          {/* 紧凑型 Header 布局 */}
          <div
            style={{
              backgroundColor: 'white',
              border: '3px solid black',
              borderRadius: '16px',
              padding: '0',
              marginBottom: '20px',
              boxShadow: '6px 6px 0 rgba(0,0,0,1)',
              overflow: 'hidden',
            }}
          >
            {/* 顶栏：标题与操作 */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '3px solid black',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {collection.title}
                </h1>
                {collection.is_favorite && (
                  <span style={{ 
                    fontSize: '1.5rem', 
                    lineHeight: 1,
                    flexShrink: 0,
                  }}>
                    ⭐
                  </span>
                )}
                {/* Integrated Stats - Unified Style */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    backgroundColor: 'white', 
                    border: '2px solid black', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: 900,
                    color: '#111827',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '2px 2px 0 rgba(0,0,0,1)',
                  }}>
                    {filteredQuestions.length} ITEMS
                  </span>
                  <span style={{ 
                    padding: '4px 12px', 
                    backgroundColor: 'white', 
                    border: '2px solid black', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: 900,
                    color: '#111827',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '2px 2px 0 rgba(0,0,0,1)',
                  }}>
                    <IconBookOpen size={14} />
                    {collection.question_count || 0} 题
                  </span>
                  <span style={{ 
                    padding: '4px 12px', 
                    backgroundColor: 'white', 
                    border: '2px solid black', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: 900,
                    color: '#111827',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '2px 2px 0 rgba(0,0,0,1)',
                  }}>
                    <IconTarget size={14} />
                    {collection.total_practiced || 0} 练习
                  </span>
                  <span style={{ 
                    padding: '4px 12px', 
                    backgroundColor: 'white', 
                    border: '2px solid black', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: 900,
                    color: '#111827',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '2px 2px 0 rgba(0,0,0,1)',
                  }}>
                    <IconTrendingUp size={14} />
                    {sortedQuestions.length > 0 
                      ? (sortedQuestions.reduce((sum, q) => sum + (q.mastery_level || 0), 0) / sortedQuestions.length).toFixed(1)
                      : '0.0'} 掌握
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={handleExportPDF}
                  style={{
                    padding: '8px 16px',
                    border: '2px solid black',
                    borderRadius: '8px',
                    backgroundColor: '#A3E635',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '3px 3px 0 rgba(0,0,0,1)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#84CC16'
                    e.currentTarget.style.transform = 'translate(1px, 1px)'
                    e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#A3E635'
                    e.currentTarget.style.transform = 'translate(0, 0)'
                    e.currentTarget.style.boxShadow = '3px 3px 0 rgba(0,0,0,1)'
                  }}
                >
                  <IconFileDown size={16} />
                  <span>导出错题</span>
                </button>
                
                <button
                  onClick={handleToggleFavorite}
                  style={{
                    padding: '8px 16px',
                    border: '2px solid black',
                    borderRadius: '8px',
                    backgroundColor: collection.is_favorite ? '#FFD100' : 'white',
                    color: 'black',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '3px 3px 0 rgba(0,0,0,1)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={(e) => {
                    if (!collection.is_favorite) {
                      e.currentTarget.style.backgroundColor = '#FEF3C7'
                    }
                    e.currentTarget.style.transform = 'translate(1px, 1px)'
                    e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = collection.is_favorite ? '#FFD100' : 'white'
                    e.currentTarget.style.transform = 'translate(0, 0)'
                    e.currentTarget.style.boxShadow = '3px 3px 0 rgba(0,0,0,1)'
                  }}
                >
                  {collection.is_favorite ? (
                    <>
                      <IconStar size={16} fill="currentColor" />
                      <span>Unfavorite</span>
                    </>
                  ) : (
                    <>
                      <IconStar size={16} />
                      <span>Favorite</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 底栏：紧凑型控制器 */}
            <div style={{
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'white',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#6B7280' }}>排序:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid black',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      boxShadow: '2px 2px 0 rgba(0,0,0,1)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <option value="added">最近添加</option>
                    <option value="mastery">掌握程度</option>
                    <option value="practiced">练习次数</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#6B7280' }}>筛选:</span>
                  <select
                    value={filterMastery}
                    onChange={(e) => setFilterMastery(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid black',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      boxShadow: '2px 2px 0 rgba(0,0,0,1)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <option value="all">所有掌握度</option>
                    <option value="0">⭐ 未掌握</option>
                    <option value="1">⭐ 初步理解</option>
                    <option value="2">⭐⭐ 基本掌握</option>
                    <option value="3">⭐⭐⭐ 熟练掌握</option>
                    <option value="4">⭐⭐⭐⭐ 精通</option>
                    <option value="5">⭐⭐⭐⭐⭐ 完美</option>
                  </select>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                border: '2px solid black', 
                borderRadius: '8px', 
                overflow: 'hidden',
                boxShadow: '2px 2px 0 rgba(0,0,0,1)',
              }}>
                <button
                  onClick={() => setViewMode('card')}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: viewMode === 'card' ? '#A3E635' : 'white',
                    color: 'black',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <IconLayoutGrid size={16} />
                  卡片
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: viewMode === 'list' ? '#A3E635' : 'white',
                    color: 'black',
                    border: 'none',
                    borderLeft: '2px solid black',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <IconList size={16} />
                  列表
                </button>
              </div>
            </div>
          </div>

          {/* Description - only if exists and not the default Chinese text */}
          {collection.description && collection.description !== '从题目管理页面创建' && (
            <div style={{ 
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#F3F4F6',
              border: '2px solid #D1D5DB',
              borderRadius: '12px',
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>
                📝 描述
              </div>
              <p style={{
                fontSize: '1rem',
                color: '#4B5563',
                lineHeight: 1.6,
                margin: 0,
              }}>
                {collection.description}
              </p>
            </div>
          )}
        </div>
      </header>
      
      {/* Questions Grid - Card View */}
      {viewMode === 'card' && (
        <main className="unified-main-grid">
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              collection={collection}
              onAction={handleAction}
              onClick={() => {
                setSelectedQuestion(question)
                setIsQuestionModalOpen(true)
              }}
            />
          ))}
          
          {filteredQuestions.length === 0 && (
            <div style={{ 
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 2rem',
              backgroundColor: 'white',
              border: '3px dashed #D1D5DB',
              borderRadius: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📝</div>
              <p style={{ 
                fontWeight: 900, 
                fontSize: '1.5rem', 
                marginBottom: '12px',
                color: '#1F2937'
              }}>
                暂无题目
              </p>
              <p style={{ 
                fontSize: '1rem', 
                color: '#6B7280',
                marginBottom: '1.5rem',
                maxWidth: '500px',
                lineHeight: 1.6,
              }}>
                {filterMastery !== 'all' 
                  ? '当前筛选条件下没有找到题目，尝试调整筛选条件。'
                  : '这个题目集还没有添加题目，去题目库添加一些吧！'}
              </p>
              <button
                onClick={() => router.push('/questions')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#A3E635',
                  color: 'black',
                  border: '3px solid black',
                  borderRadius: '8px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0 rgba(0,0,0,1)',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(2px, 2px)'
                  e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)'
                  e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,1)'
                }}
              >
                前往题目库
              </button>
            </div>
          )}
        </main>
      )}
      
      {/* Questions List - List View */}
      {viewMode === 'list' && (
        <div style={{
          backgroundColor: 'white',
          border: '3px solid black',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '4px 4px 0 rgba(0,0,0,1)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#F3F4F6', borderBottom: '2px solid black' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>#</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>内容</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>类型</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>掌握度</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>练习次数</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((question, index) => (
                <tr key={question.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{index + 1}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', maxWidth: '400px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {getQuestionContentText(question.content)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                    <span style={{ padding: '4px 8px', backgroundColor: '#DBEAFE', color: '#1E40AF', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {translateQuestionType((question as any).question_type || (question as any).type) || '未知'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{ 
                            height: '100%', 
                            backgroundColor: '#10B981', 
                            width: `${((question.mastery_level || 0) / 5) * 100}%`,
                            transition: 'width 0.3s'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>{question.mastery_level || 0}/5</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#6B7280' }}>
                    {question.times_practiced || 0}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleStartEdit(question)}
                        style={{
                          color: '#3B82F6',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveQuestion(question.id)}
                        style={{
                          color: '#EF4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredQuestions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '3rem', opacity: 0.5 }}>📝</div>
                      <p style={{ 
                        fontWeight: 900, 
                        fontSize: '1.25rem', 
                        marginBottom: '8px',
                        color: '#1F2937'
                      }}>
                        暂无题目
                      </p>
                      <p style={{ color: '#6B7280', maxWidth: '400px', lineHeight: 1.6 }}>
                        {filterMastery !== 'all' 
                          ? '当前筛选条件下没有找到题目，尝试调整筛选条件。'
                          : '这个题目集还没有添加题目，去题目库添加一些吧！'}
                      </p>
                      <button
                        onClick={() => router.push('/questions')}
                        style={{
                          marginTop: '12px',
                          padding: '10px 20px',
                          backgroundColor: '#A3E635',
                          color: 'black',
                          border: '2px solid black',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '3px 3px 0 rgba(0,0,0,1)',
                          transition: 'all 0.2s',
                        }}
                      >
                        前往题目库
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Edit Modal */}
      {editingQuestion && (
        <div 
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
          onClick={() => setEditingQuestion(null)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '450px',
              width: '100%',
              border: '4px solid black',
              boxShadow: '8px 8px 0 rgba(0, 0, 0, 1)',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.5rem' }}>更新学习进度</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                掌握程度
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setMasteryLevel(level)}
                    style={{
                      flex: 1,
                      height: '40px',
                      border: '2px solid black',
                      borderRadius: '6px',
                      backgroundColor: masteryLevel === level ? '#22C55E' : 'white',
                      color: masteryLevel === level ? 'white' : 'black',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: masteryLevel === level ? 'none' : '2px 2px 0 black',
                      transition: 'all 0.2s',
                      fontSize: '0.875rem',
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280', marginTop: '8px' }}>
                <span>未掌握</span>
                <span>完美掌握</span>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '0.875rem' }}>笔记</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid black',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                rows={4}
                placeholder="在这里添加你的笔记..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingQuestion(null)}
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
                取消
              </button>
              <button
                onClick={() => handleUpdateQuestion(editingQuestion)}
                style={{
                  padding: '12px 24px',
                  border: '3px solid black',
                  borderRadius: '8px',
                  backgroundColor: '#22C55E',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                保存更改
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Question Detail Modal */}
      <QuestionDetailModal
        question={selectedQuestion}
        collection={collection}
        isOpen={isQuestionModalOpen}
        onClose={() => {
          setSelectedQuestion(null)
          setIsQuestionModalOpen(false)
        }}
      />
      
      {/* Loading Overlay */}
      {(isProcessing || isLoading) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>Processing...</div>
          </div>
        </div>
      )}
    </div>
  )
}
