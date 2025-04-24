"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestConnection() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from('profiles').select('count').single()
        
        if (error) throw error
        
        setStatus('success')
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      {status === 'loading' && <p>Testing connection...</p>}
      {status === 'success' && <p className="text-green-500">Connection successful!</p>}
      {status === 'error' && (
        <div className="text-red-500">
          <p>Connection failed:</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
} 