'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isHoveringInput, setIsHoveringInput] = useState(false)
  const [isFocusedInput, setIsFocusedInput] = useState(false)
  const [isHoveringButton, setIsHoveringButton] = useState(false)
  const [hoveredTip, setHoveredTip] = useState<string | null>(null)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      router.push(`/app/questions?search=${encodeURIComponent(searchQuery.trim())}`)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 1rem'
    }}>
      {/* Main Search Area - Rounded Neo-Brutalism */}
      <div style={{
        width: '100%',
        maxWidth: '48rem',
        margin: '0 auto'
      }}>
        {/* Logo Title - Comic Book Style */}
        <h1 style={{
          fontSize: '6rem',
          fontWeight: 900,
          textAlign: 'center',
          marginBottom: '2.5rem',
          letterSpacing: '-0.03em',
          color: '#FBBF24',
          WebkitTextStroke: '3px black',
          filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,1))',
          textTransform: 'uppercase'
        }}>
          题宝
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            width: '100%',
            maxWidth: '48rem',
            margin: '0 auto'
          }}>
            {/* Input Field - Rounded Neo-Brutalism */}
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
              style={{
                flex: 1,
                width: '100%',
                height: '4rem',
                padding: '0 1.5rem',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#000000',
                background: '#FFFFFF',
                border: isFocusedInput ? '4px solid #000000' : '4px solid #000000',
                borderRadius: '1rem',
                boxShadow: isFocusedInput 
                  ? '6px 6px 0px 0px rgba(0,0,0,1)' 
                  : isHoveringInput 
                    ? '5px 5px 0px 0px rgba(0,0,0,1)' 
                    : '4px 4px 0px 0px rgba(0,0,0,1)',
                outline: 'none',
                transition: 'all 0.15s ease',
                transform: isFocusedInput 
                  ? 'translate(-2px, -2px)' 
                  : isHoveringInput 
                    ? 'translate(-1px, -1px)' 
                    : 'none'
              }}
            />
            
            {/* Submit Button - Black with White Text */}
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              onMouseEnter={() => setIsHoveringButton(true)}
              onMouseLeave={() => setIsHoveringButton(false)}
              aria-label="搜索"
              style={{
                flexShrink: 0,
                width: '4rem',
                height: '4rem',
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
                border: '2px solid #000000',
                borderRadius: '1rem',
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                cursor: (isSearching || !searchQuery.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                transform: isHoveringButton && !isSearching && searchQuery.trim() 
                  ? 'translate(-1px, -5px)' 
                  : 'none',
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

        {/* Search Tips - Clean White Buttons */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#000000'
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
      </div>

      {/* Keyframes for spinner */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  )
}
