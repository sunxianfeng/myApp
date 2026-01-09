'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/lib/store'
import { initializeAuth } from '@/lib/slices/authSlice'

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, token, isLoading } = useSelector((state: RootState) => state.auth)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Monitor storage changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        console.log('🔔 localStorage "token" changed:', {
          oldValue: e.oldValue ? e.oldValue.substring(0, 20) + '...' : 'null',
          newValue: e.newValue ? e.newValue.substring(0, 20) + '...' : 'null'
        })
      }
    }

    // Also monitor direct localStorage changes (storage event only fires for other tabs)
    const originalSetItem = localStorage.setItem
    const originalRemoveItem = localStorage.removeItem
    
    localStorage.setItem = function(key: string, value: string) {
      if (key === 'token') {
        console.log('💾 localStorage.setItem("token"):', value.substring(0, 20) + '...')
        console.trace('Call stack:')
      }
      return originalSetItem.apply(this, arguments as any)
    }
    
    localStorage.removeItem = function(key: string) {
      if (key === 'token') {
        console.log('🗑️ localStorage.removeItem("token")')
        console.trace('Call stack:')
      }
      return originalRemoveItem.apply(this, arguments as any)
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      localStorage.setItem = originalSetItem
      localStorage.removeItem = originalRemoveItem
    }
  }, [])

  useEffect(() => {
    // Only run on client side and only once
    if (typeof window === 'undefined' || hasInitialized) {
      return
    }

    const localToken = localStorage.getItem('token')
    console.log('=== 🔐 AuthInitializer: Checking auth state ===')
    console.log('hasReduxToken:', !!token)
    console.log('hasLocalToken:', !!localToken)
    console.log('localToken value:', localToken ? localToken.substring(0, 20) + '...' : 'NULL')
    console.log('isAuthenticated:', isAuthenticated)
    console.log('isLoading:', isLoading)
    console.log('===============================================')

    // If we have a token in localStorage but not in Redux, initialize
    if (localToken && !token && !isLoading) {
      console.log('🔄 AuthInitializer: Initializing auth from localStorage')
      dispatch(initializeAuth())
    } else if (!localToken && !isAuthenticated) {
      console.log('⚠️ No token found in localStorage and not authenticated')
    } else if (isAuthenticated && token) {
      console.log('✅ Already authenticated with Redux token')
    }
    
    setHasInitialized(true)
  }, [dispatch, hasInitialized, token, isAuthenticated, isLoading])

  return <>{children}</>
}
