'use client'

import React, { useEffect, useRef } from 'react'

interface MathRendererProps {
  content: string
  className?: string
}

/**
 * MathRenderer component that detects and renders LaTeX formulas
 * Supports both inline formulas \(...\) and display formulas \[...\]
 */
const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load KaTeX CSS and JS from CDN
    const loadKaTeX = async () => {
      // Load CSS
      if (!document.querySelector('link[href*="katex"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
        link.integrity = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV'
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      }

      // Load JS
      if (!window.katex) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
        script.integrity = 'sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmUb0ZY0l8'
        script.crossOrigin = 'anonymous'
        script.async = true
        
        script.onload = () => {
          renderMath()
        }
        
        document.head.appendChild(script)
      } else {
        renderMath()
      }
    }

    const renderMath = () => {
      if (!containerRef.current || !window.katex) return

      try {
        const html = renderLatexInText(content)
        containerRef.current.innerHTML = html
      } catch (error) {
        console.error('Error rendering LaTeX:', error)
        // Fallback to plain text
        if (containerRef.current) {
          containerRef.current.textContent = content
        }
      }
    }

    loadKaTeX()
  }, [content])

  return <div ref={containerRef} className={className} />
}

/**
 * Parse text and render LaTeX formulas
 * Supports:
 * - Inline: \(...\) or $...$
 * - Display: \[...\] or $$...$$
 */
function renderLatexInText(text: string): string {
  if (!text) return ''

  // Check if KaTeX is available
  if (!window.katex) {
    return text // Return plain text if KaTeX not loaded
  }

  // First, handle display math (must come before inline to avoid conflicts)
  // Pattern: \[...\] or $$...$$
  let result = text.replace(/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g, (match, p1, p2) => {
    const latex = p1 || p2
    try {
      return `<div class="math-display" style="text-align: center; margin: 1rem 0;">${window.katex!.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
        strict: false,
      })}</div>`
    } catch (e) {
      console.error('Display math render error:', e)
      return `<div class="math-error" style="color: #ef4444;">[Math: ${latex}]</div>`
    }
  })

  // Then handle inline math
  // Pattern: \(...\) or $...$
  result = result.replace(/\\\(([\s\S]*?)\\\)|\$([^\$\n]+?)\$/g, (match, p1, p2) => {
    const latex = p1 || p2
    try {
      return `<span class="math-inline">${window.katex!.renderToString(latex, {
        displayMode: false,
        throwOnError: false,
        strict: false,
      })}</span>`
    } catch (e) {
      console.error('Inline math render error:', e)
      return `<span class="math-error" style="color: #ef4444;">[${latex}]</span>`
    }
  })

  return result
}

// Extend Window interface to include katex
declare global {
  interface Window {
    katex?: {
      renderToString: (tex: string, options?: any) => string
      render: (tex: string, element: HTMLElement, options?: any) => void
    }
  }
}

export default MathRenderer
