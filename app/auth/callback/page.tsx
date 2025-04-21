'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // For PKCE flow, we need to use getSession() which will automatically handle the code verifier
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          toast.error('Failed to create session. Please try again.')
          router.push('/')
          return
        }

        if (!session?.user) {
          console.error('No user in session')
          toast.error('Authentication failed. Please try again.')
          router.push('/')
          return
        }

        console.log('User authenticated successfully:', session.user.id)

        // Get the user's role
        const { data: userData, error: userError } = await supabase
          .from('users_account')
          .select('user_role')
          .eq('id', session.user.id)
          .single()

        // If user doesn't exist in users_account table, create them
        if (userError) {
          console.log('User not found in users_account table, creating new user record')
          
          // Create new user record with default role
          const { error: insertError } = await supabase
            .from('users_account')
            .insert([
              { 
                id: session.user.id,
                user_role: '1', // Default to user role
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || '',
                created_at: new Date().toISOString()
              }
            ])

          if (insertError) {
            console.error('Error creating user account:', insertError)
            toast.error('Failed to create user account. Please try again.')
            router.push('/')
            return
          }

          console.log('New user account created successfully')
          
          // Redirect to user dashboard for new users
          router.push('/userDashboard')
          return
        }

        console.log('User role fetched successfully:', userData.user_role)

        // Redirect based on user role
        if (userData.user_role === '2') {
          router.push('/adminDashboard')
        } else {
          router.push('/userDashboard')
        }

      } catch (error) {
        console.error('Callback error:', error)
        toast.error('An unexpected error occurred. Please try again.')
        router.push('/')
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Completing authentication...</h2>
        <p className="text-green-200">Please wait while we set up your account.</p>
      </div>
    </div>
  )
} 