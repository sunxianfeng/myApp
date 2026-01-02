'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser } from '@/lib/slices/authSlice'
import { AppDispatch, RootState } from '@/lib/store'
import Link from 'next/link'
import { AppLogo } from '@/components/common/Icons'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading, error: reduxError } = useSelector((state: RootState) => state.auth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      await dispatch(registerUser({ name, email, password })).unwrap()
      router.push('/login')
    } catch (err: any) {
      setError(err.message || '注册失败，请重试')
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

        .logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 2.5rem;
        }

        .logo {
          height: 48px;
          animation: logoEntry 800ms ease-out;
        }

        .left-panel h1 {
          font-size: 2.5rem;
          font-weight: 900;
          color: #000000;
          letter-spacing: -0.025em;
          margin-bottom: 1rem;
          text-align: center;
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

        .password-hint {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: #6B7280;
          font-weight: 600;
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
          color: #3B82F6;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.15s ease;
          margin-left: 0.25rem;
        }

        .login-link a:hover {
          text-decoration: underline;
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
          <div className="logo-container">
            <AppLogo className="w-16 h-16 logo" />
          </div>
          <h1>Join Our Community</h1>
          <p>Create an account to unlock exclusive features and content.</p>
        </div>

        <div className="right-panel">
          <h2>Create an account</h2>
          <p className="subtitle">Start your journey with us today</p>

          {(error || reduxError) && <div className="error-message">{error || reduxError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input
                type="text"
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <small className="password-hint">At least 8 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                placeholder="••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || isLoading}>
              {loading || isLoading ? 'Creating account...' : 'Create account'}
            </button>

            <div className="login-link">
              Already have an account?<Link href="/login">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
