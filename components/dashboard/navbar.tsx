"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, LogOut, User, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { authState } from "@/lib/auth-state"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function DashboardNavbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const router = useRouter()
  const user = authState.getUser()

  const handleSignOut = () => {
    authState.logout()
    router.push("/")
  }

  const handleUpdateProfile = () => {
    router.push("/userDashboard/update-profile")
    setIsMenuOpen(false)
  }

  const handleChangePassword = () => {
    router.push("/userDashboard/change-password")
  }

  const Logo = (
    <div className="flex items-center space-x-1.5">
      <div className="relative w-7 h-7">
        <Image src="/images/logo.png" alt="Green Fina Logo" width={28} height={28} className="object-contain" />
      </div>
      <div className="flex items-center">
        <span className="text-lg font-bold text-green-400 mr-0.5 futuristic-text">Green</span>
        <span className="text-lg font-bold text-green-400 futuristic-text">Fina</span>
      </div>
    </div>
  )

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <div className="fixed z-50 top-5 left-0 right-0 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-3 bg-sky-500/10 backdrop-blur-md py-1 px-3 md:px-4 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/10">
            <Link href="/userDashboard" className="flex-shrink-0">
              {Logo}
            </Link>
              
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white md:hidden h-7 w-7"
            >
              <span className="sr-only">Toggle menu</span>
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-sky-500/10 backdrop-blur-md pt-16 md:hidden">
          <div className="container mx-auto px-4 py-3 space-y-4">
            {user && (
              <div className="flex items-center gap-2 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-green-500 text-white">
                    {getInitials(user?.full_name || "User")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}
            <div className="h-px bg-white/10 my-3" />
            <Button
              variant="ghost"
              className="w-full flex items-center justify-start gap-2 text-base font-medium text-white/70 hover:text-green-400 transition-colors py-1.5"
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