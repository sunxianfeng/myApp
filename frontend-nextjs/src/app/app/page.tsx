'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Search Icon Component
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    </svg>
  )
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
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
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4">
      <style jsx global>{`
        /* Google-style Search with Rounded Neo-Brutalism */
        
        .home-search-container {
          width: 100%;
          max-width: 580px;
          margin: 0 auto;
        }

        .home-logo {
          font-size: 4rem;
          font-weight: 900;
          text-align: center;
          margin-bottom: 2.5rem;
          letter-spacing: -0.03em;
          color: #000000;
        }

        .home-logo-accent {
          color: #FBBF24;
        }

        /* Rounded Neo-Brutalism Search Box */
        .search-box-wrapper {
          position: relative;
          width: 100%;
        }

        .search-box {
          width: 100%;
          height: 56px;
          padding: 0 60px 0 52px;
          font-size: 1rem;
          font-weight: 500;
          color: #000000;
          background: #FFFFFF;
          border: 3px solid #000000;
          border-radius: 28px;
          box-shadow: 4px 4px 0px 0px #000000;
          outline: none;
          transition: all 0.15s ease;
        }

        .search-box::placeholder {
          color: #9CA3AF;
          font-weight: 400;
        }

        .search-box:hover {
          box-shadow: 5px 5px 0px 0px #000000;
          transform: translate(-1px, -1px);
        }

        .search-box:focus {
          box-shadow: 6px 6px 0px 0px #000000;
          transform: translate(-2px, -2px);
          border-color: #FBBF24;
        }

        .search-icon-left {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          width: 22px;
          height: 22px;
          color: #9CA3AF;
          pointer-events: none;
          transition: color 0.15s ease;
        }

        .search-box:focus ~ .search-icon-left,
        .search-box-wrapper:hover .search-icon-left {
          color: #FBBF24;
        }

        .search-btn-submit {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FBBF24;
          border: 2px solid #000000;
          border-radius: 50%;
          box-shadow: 2px 2px 0px 0px #000000;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .search-btn-submit:hover:not(:disabled) {
          background: #F59E0B;
          box-shadow: 3px 3px 0px 0px #000000;
          transform: translateY(-50%) translate(-1px, -1px);
        }

        .search-btn-submit:active:not(:disabled) {
          box-shadow: 1px 1px 0px 0px #000000;
          transform: translateY(-50%) translate(0, 0);
        }

        .search-btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .search-btn-submit svg {
          width: 20px;
          height: 20px;
          color: #000000;
        }

        /* Tips */
        .search-tips {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.875rem;
          color: #6B7280;
        }

        .search-tips span {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          margin: 0.25rem;
          background: #FEF3C7;
          border: 2px solid #000000;
          border-radius: 9999px;
          font-weight: 600;
          color: #000000;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 2px 2px 0px 0px #000000;
        }

        .search-tips span:hover {
          background: #FBBF24;
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px 0px #000000;
        }

        /* Loading spinner */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>

      {/* Main Search Area - Google Style */}
      <div className="home-search-container">
        {/* Logo Title */}
        <h1 className="home-logo">
          题<span className="home-logo-accent">宝</span>
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch}>
          <div className="search-box-wrapper">
            <SearchIcon className="search-icon-left" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索题目..."
              className="search-box"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="search-btn-submit"
              aria-label="搜索"
            >
              {isSearching ? (
                <svg className="loading-spinner" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <SearchIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>

        {/* Search Tips */}
        <div className="search-tips">
          <p style={{ marginBottom: '0.5rem', color: '#9CA3AF' }}>试试搜索：</p>
          <span onClick={() => setSearchQuery('二次函数')}>二次函数</span>
          <span onClick={() => setSearchQuery('物理力学')}>物理力学</span>
          <span onClick={() => setSearchQuery('化学反应')}>化学反应</span>
        </div>
      </div>
    </div>
  )
}
