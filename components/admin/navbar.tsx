"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X, LogOut } from "lucide-react"
import { authState } from '@/lib/auth-state'
import { supabase } from "@/lib/supabase"
import Image from "next/image"

export function AdminNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const currentUser = authState.getUser()

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const Logo = (
    <div className="flex items-center space-x-1.5">
      <div className="relative w-7 h-7">
        <Image src="/images/logo.png" alt="Green Fina Logo" width={28} height={28} className="object-contain" />
      </div>
      <div className="flex items-center">
        <span className="text-lg font-bold text-white mr-0.5 futuristic-text hidden sm:inline">Green</span>
        <span className="text-lg font-bold text-white futuristic-text hidden sm:inline">Fina</span>
      </div>
    </div>
  )

  const getInitials = (name: string) => {
    if (!name) return "A"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <div className="fixed z-50 top-5 left-0 right-0 flex justify-center pointer-events-none pl-[4.5rem] lg:pl-[17rem] pr-4">
        <div className="pointer-events-auto w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-green-500 to-green-600 py-1 px-2 rounded-full shadow-[0_8px_32px_0_rgba(34,197,94,0.3)] border border-green-400/20 backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            <Link href="/adminDashboard" className="flex-shrink-0 relative">
              {Logo}
            </Link>
              
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white md:hidden h-6 w-6 relative hover:bg-white/10"
            >
              <span className="sr-only">Toggle menu</span>
              {isMenuOpen ? <X className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-gradient-to-b from-green-500/90 to-green-600/90 backdrop-blur-md pt-16 md:hidden">
          <div className="container mx-auto px-4 py-3 space-y-4">
            {currentUser && (
              <div className="flex items-center gap-2 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-green-700 text-white">
                    {getInitials(currentUser?.full_name || "Admin")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-white">{currentUser.full_name}</p>
                  <p className="text-xs text-white/70">{currentUser.email}</p>
                </div>
              </div>
            )}
            <div className="h-px bg-white/10 my-3" />
            <Button
              variant="ghost"
              className="w-full flex items-center justify-start gap-2 text-base font-medium text-white hover:bg-white/10 transition-colors py-1.5"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      )}
    </>
  )
} 