'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '@/lib/slices/authSlice'
import { AppDispatch, RootState } from '@/lib/store'
import Link from 'next/link'
import { AppLogo } from '@/components/common/Icons'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading, error: reduxError } = useSelector((state: RootState) => state.auth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await dispatch(loginUser({ email, password })).unwrap()
      router.push('/app')
    } catch (err: any) {
      setError(err.message || '登录失败，请检查邮箱和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        html,
        body {
          height: 100%;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        }

        body {
          background-color: #FDE047;
          color: #000000;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-direction: column;
          overflow: hidden;
        }

        /* Giant outline typography background - on body level */
        body::before {
          content: 'NOTEBOOK';
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-12deg);
          font-size: clamp(8rem, 20vw, 24rem);
          font-weight: 900;
          color: transparent;
          -webkit-text-stroke: 3px rgba(0, 0, 0, 0.12);
          text-stroke: 3px rgba(0, 0, 0, 0.12);
          text-transform: uppercase;
          letter-spacing: -0.02em;
          opacity: 1;
          line-height: 0.9;
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
          z-index: 0;
        }

        .main-container {
          width: calc(100% - 4rem);
          max-width: 1200px;
          min-height: 600px;
          display: flex;
          background-color: #FFFFFF;
          border: 3px solid #000000;
          border-radius: 12px;
          box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
          overflow: hidden;
          position: relative;
          z-index: 10;
          animation: formEntry 600ms ease-out;
          margin: 0 auto;
        }

        .left-panel {
          flex: 1;
          padding: 4rem;
          background-color: #F3F4F6;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          border-right: 3px solid #000000;
        }

        .left-panel h1 {
          font-size: 2.5rem;
          font-weight: 900;
          color: #000000;
          letter-spacing: -0.025em;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .app-logo-inline {
          width: 230px;
          height: 230px;
          background-color: #FFD100;
          border: 3px solid #000000;
          border-radius: 8px;
          box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          position: relative;
        }

        .app-logo-inline::before {
          content: '';
          position: absolute;
          inset: 4px;
          border: 1px dashed rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .left-panel p {
          font-size: 1.1rem;
          color: #6B7280;
          max-width: 350px;
          text-align: center;
          margin: 0 auto;
          font-weight: 600;
        }

        .right-panel {
          flex: 1;
          padding: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .right-panel h2 {
          font-size: 2rem;
          font-weight: 900;
          text-align: center;
          margin-bottom: 0.75rem;
          color: #000000;
          letter-spacing: -0.025em;
        }

        .subtitle {
          font-size: 1.05rem;
          text-align: center;
          color: #6B7280;
          margin-bottom: 3rem;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 1.75rem;
          position: relative;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.625rem;
          font-size: 0.95rem;
          font-weight: 700;
          color: #000000;
        }

        .form-group input {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 2px solid #000000;
          border-radius: 6px;
          background-color: #FFFFFF;
          color: #000000;
          font-size: 1rem;
          transition: all 0.2s ease-out;
          box-sizing: border-box;
          font-weight: 600;
        }

        .form-group input:focus {
          outline: none;
          border-color: #000000;
          box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
          transform: translate(-2px, -2px);
        }

        .form-group input::placeholder {
          color: #9CA3AF;
          font-weight: 500;
        }

        .forgot-password {
          display: inline-block;
          text-align: right;
          font-size: 0.9rem;
          color: #000000;
          margin-top: 0.75rem;
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 3px;
          transition: all 0.2s ease;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .forgot-password:hover {
          background-color: #bef264;
          text-decoration: none;
          box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
          transform: translate(-1px, -1px);
        }

        .btn {
          display: block;
          width: 100%;
          padding: 1rem 1.25rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #000000 !important;
          color: #FFFFFF !important;
          margin-top: 2.5rem !important;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.01em;
          border: 3px solid #000000 !important;
          box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.5);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translate(-2px, -2px) !important;
          box-shadow: 6px 6px 0px 0px rgba(0, 0, 0, 0.5) !important;
          background-color: #1F2937 !important;
        }

        .btn-primary:active:not(:disabled) {
          transform: translate(0, 0);
          box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
        }

        .login-link {
          margin-top: 2.5rem;
          text-align: center;
          font-size: 1rem;
          color: #6B7280;
          font-weight: 600;
        }

        .login-link a {
          color: #000000;
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 3px;
          font-weight: 700;
          transition: all 0.2s ease;
          margin-left: 0.25rem;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .login-link a:hover {
          background-color: #bef264;
          text-decoration: none;
          box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
          transform: translate(-1px, -1px);
        }

        .error-message {
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          background-color: #FEE2E2;
          color: #991B1B;
          border: 2px solid #000000;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 700;
          animation: slideIn 300ms ease-out;
        }

        @keyframes formEntry {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes logoEntry {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .main-container {
            flex-direction: column;
            max-width: 600px;
            min-height: auto;
            width: calc(100% - 2rem);
            margin: 1rem auto;
          }

          .left-panel {
            padding: 2.5rem;
            text-align: center;
          }

          .left-panel h1 {
            font-size: 1.75rem;
          }

          .left-panel p {
            max-width: 100%;
            margin: 0 auto;
            font-size: 1rem;
          }

          .right-panel {
            padding: 2.5rem;
          }

          .right-panel h2 {
            font-size: 1.5rem;
          }

          .subtitle {
            font-size: 0.95rem;
          }
        }

        @media (max-width: 480px) {
          .main-container {
            flex-direction: column;
            border-radius: var(--radius-lg);
            width: calc(100% - 1rem);
            margin: 0.5rem auto;
            max-width: 100%;
          }

          .left-panel {
            padding: 2rem 1.5rem;
          }

          .right-panel {
            padding: 2rem 1.5rem;
          }

          .left-panel h1 {
            font-size: 1.75rem;
          }

          .logo {
            height: 40px;
          }
        }
      `}</style>

      <div className="main-container">
        <div className="left-panel">
          <h1>Welcome back</h1>
          
          <div className="app-logo-inline">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: '60%', height: '60%' }}
            >
              {/* Four corner scan lines */}
              <path d="M7 3H3v4" />
              <path d="M17 3h4v4" />
              <path d="M17 21h4v-4" />
              <path d="M7 21H3v-4" />
              
              {/* Center question mark (representing error/question) */}
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          
          <p>Enter your credentials to access your account and continue your journey.</p>
        </div>

        <div className="right-panel">
          <h2>Sign in to your account</h2>
          <p className="subtitle">Welcome back! Please enter your details</p>

          {(error || reduxError) && <div className="error-message">{error || reduxError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <a href="#" className="forgot-password">Forgot your password?</a>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || isLoading}>
              {loading || isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="login-link">
              Don't have an account?<Link href="/register">Create account</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
