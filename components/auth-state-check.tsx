'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authState } from '@/lib/auth-state'

export function AuthStateCheck() {
  const router = useRouter()

  useEffect(() => {
    const checkAuthState = () => {
      // Check if user is authenticated in our custom auth state
      const isAuthenticated = authState.isUserAuthenticated()
      
      if (!isAuthenticated) {
        // If not authenticated, redirect to home
        router.push('/')
      }
    }

    // Check auth state on mount
    checkAuthState()

    // Listen for auth state changes
    const handleAuthStateChange = (event: CustomEvent) => {
      if (!event.detail.isAuthenticated) {
        router.push('/')
      }
    }

    // Listen for storage events from other tabs
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'userData' && !event.newValue) {
        router.push('/')
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('authStateChange', handleAuthStateChange as EventListener)
      window.addEventListener('storage', handleStorageEvent)
      
      return () => {
        window.removeEventListener('authStateChange', handleAuthStateChange as EventListener)
        window.removeEventListener('storage', handleStorageEvent)
      }
    }
  }, [router])

  // No need to render anything since we're just handling auth state
  return null
} 