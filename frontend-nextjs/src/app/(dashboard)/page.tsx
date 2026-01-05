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
  const [isHoveringLogo, setIsHoveringLogo] = useState(false)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      router.push(`/questions?search=${encodeURIComponent(searchQuery.trim())}`)
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
      padding: '0 1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
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
          {/* Math symbols */}
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
          {/* Chemistry beaker */}
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
          {/* Book icon */}
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
          {/* Light bulb - idea */}
          <circle cx="55" cy="45" r="25" stroke="#000000" strokeWidth="3" fill="none" />
          <path d="M45 70 L45 85 L65 85 L65 70" stroke="#000000" strokeWidth="3" fill="none" />
          <line x1="55" y1="85" x2="55" y2="95" stroke="#000000" strokeWidth="3" />
          <line x1="48" y1="95" x2="62" y2="95" stroke="#000000" strokeWidth="3" />
          {/* Rays */}
          <line x1="30" y1="25" x2="20" y2="15" stroke="#000000" strokeWidth="2" />
          <line x1="80" y1="25" x2="90" y2="15" stroke="#000000" strokeWidth="2" />
          <line x1="25" y1="45" x2="10" y2="45" stroke="#000000" strokeWidth="2" />
        </svg>
      </div>

      {/* Floating decorative elements - scattered */}
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

      {/* Main Search Area - Rounded Neo-Brutalism */}
      <div style={{
        width: '100%',
        maxWidth: '48rem',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Logo Badge - Black Badge with White Text & Hover Animation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '3rem'
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
            {/* Input Field - Rounded Neo-Brutalism with Enhanced Focus */}
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
                height: '4rem',
                padding: '0 1.5rem',
                fontSize: '1.25rem',
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
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
                border: '4px solid #000000',
                borderRadius: '1rem',
                boxShadow: isHoveringButton && !isSearching && searchQuery.trim()
                  ? '8px 8px 0px 0px rgba(0,0,0,1)'
                  : '6px 6px 0px 0px rgba(0,0,0,1)',
                cursor: (isSearching || !searchQuery.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
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

      {/* Keyframes for spinner, wiggle animation, and input focus override */}
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
    </div>
  )
}

