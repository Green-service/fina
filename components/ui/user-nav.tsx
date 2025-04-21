"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { authState } from "@/lib/auth-state"
import { LogOut } from "lucide-react"

export function UserNav() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function getUserData() {
      // Get user data from our auth state manager
      const authUser = authState.getUser()
      if (authUser) {
        // Get user data from users_account table
        const { data } = await supabase
          .from("users_account")
          .select("full_name, email")
          .eq("id", authUser.id)
          .single()

        if (data) {
          setUser(data)
        } else {
          // Fallback to auth data
          setUser({
            full_name: authUser.user_metadata?.full_name || "User",
            email: authUser.email,
          })
        }
      }
    }

    getUserData()
  }, [supabase])

  const handleSignOut = () => {
    // Use our custom auth state manager to sign out
    authState.logout()
    router.push("/")
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative text-sm">
          Sign out
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem onClick={handleSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
