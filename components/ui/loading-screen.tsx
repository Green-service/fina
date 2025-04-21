"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function LoadingScreen() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted || !isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative h-24 w-24 animate-pulse">
          <Image
            src="/logo.png"
            alt="Green Fina Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="flex gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.3s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.15s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-sky-500" />
        </div>
        <p className="text-lg font-medium text-sky-500">Loading Green Fina...</p>
      </div>
    </div>
  )
} 