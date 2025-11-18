'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '@/lib/slices/authSlice'
import { AppDispatch, RootState } from '@/lib/store'
import Link from 'next/link'

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
        :root {
          --background: oklch(0.98 0 0);
          --foreground: oklch(0.2 0 0);
          --card: oklch(1 0 0);
          --card-foreground: oklch(0.2 0 0);
          --popover: oklch(1 0 0);
          --popover-foreground: oklch(0.2 0 0);
          --primary: oklch(0.45 0.18 280);
          --primary-foreground: oklch(0.98 0 0);
          --secondary: oklch(0.96 0 0);
          --secondary-foreground: oklch(0.3 0 0);
          --muted: oklch(0.96 0 0);
          --muted-foreground: oklch(0.53 0 0);
          --accent: oklch(0.96 0 0);
          --accent-foreground: oklch(0.3 0 0);
          --destructive: oklch(0.65 0.18 25);
          --destructive-foreground: oklch(0.98 0 0);
          --border: oklch(0.9 0 0);
          --input: oklch(0.9 0 0);
          --ring: oklch(0.45 0.18 280 / 0.3);

          --radius: 0.5rem;
          --radius-sm: calc(var(--radius) - 2px);
          --radius-md: var(--radius);
          --radius-lg: calc(var(--radius) + 2px);
          --radius-xl: calc(var(--radius) + 4px);

          --shadow-2xs: 0 1px 2px rgba(0, 0, 0, 0.05);
          --shadow-xs: 0 1px 3px rgba(0, 0, 0, 0.05);
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
          --shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 15px -5px rgba(0, 0, 0, 0.05);
          --shadow-md: 0 1px 3px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.05);
          --shadow-lg: 0 1px 3px rgba(0, 0, 0, 0.05), 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          --shadow-xl: 0 1px 3px rgba(0, 0, 0, 0.05), 0 32px 60px -12px rgba(0, 0, 0, 0.12);
          --shadow-2xl: 0 1px 3px rgba(0, 0, 0, 0.05), 0 40px 70px -12px rgba(0, 0, 0, 0.15);
        }

        html,
        body {
          height: 100%;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        }

        body {
          background-color: var(--background);
          color: var(--foreground);
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-direction: column;
        }

        body::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 20% 30%, rgba(69, 46, 128, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(69, 46, 128, 0.05) 0%, transparent 40%);
          z-index: -1;
          pointer-events: none;
        }

        .main-container {
          width: calc(100% - 4rem);
          max-width: 1200px;
          min-height: 600px;
          display: flex;
          background-color: var(--card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          animation: formEntry 600ms ease-out;
          margin: 0 auto;
        }

        .left-panel {
          flex: 1;
          padding: 4rem;
          background-color: var(--muted);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
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
          font-weight: 700;
          color: var(--foreground);
          letter-spacing: -0.025em;
          margin-bottom: 1rem;
          text-align: center;
        }

        .left-panel p {
          font-size: 1.1rem;
          color: var(--muted-foreground);
          max-width: 350px;
          text-align: center;
          margin: 0 auto;
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
          font-weight: 700;
          text-align: center;
          margin-bottom: 0.75rem;
          color: var(--foreground);
          letter-spacing: -0.025em;
        }

        .subtitle {
          font-size: 1.05rem;
          text-align: center;
          color: var(--muted-foreground);
          margin-bottom: 3rem;
        }

        .form-group {
          margin-bottom: 1.75rem;
          position: relative;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.625rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--foreground);
        }

        .form-group input {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background-color: var(--card);
          color: var(--foreground);
          font-size: 1rem;
          transition: all 0.2s ease-out;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--ring);
        }

        .form-group input::placeholder {
          color: var(--muted-foreground);
        }

        .forgot-password {
          display: block;
          text-align: right;
          font-size: 0.9rem;
          color: var(--primary);
          margin-top: 0.75rem;
          text-decoration: none;
          transition: all 0.15s ease;
          font-weight: 500;
        }

        .forgot-password:hover {
          text-decoration: underline;
          color: oklch(0.4 0.18 280);
        }

        .btn {
          display: block;
          width: 100%;
          padding: 1rem 1.25rem;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: var(--primary) !important;
          color: var(--primary-foreground) !important;
          margin-top: 2.5rem !important;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.01em;
          border: none !important;
          border-style: solid !important;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px -5px var(--ring) !important;
          background-color: oklch(0.5 0.18 280) !important;
          color: var(--primary-foreground) !important;
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
          color: var(--primary-foreground) !important;
        }

        .login-link {
          margin-top: 2.5rem;
          text-align: center;
          font-size: 1rem;
          color: var(--muted-foreground);
        }

        .login-link a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
          transition: all 0.15s ease;
          margin-left: 0.25rem;
        }

        .login-link a:hover {
          text-decoration: underline;
        }

        .error-message {
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          background-color: var(--destructive);
          color: var(--destructive-foreground);
          border-radius: var(--radius-lg);
          font-size: 0.95rem;
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
            <svg className="logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1>Welcome back</h1>
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
