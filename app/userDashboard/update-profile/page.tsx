"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { authState } from "@/lib/auth-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string | null
  date_of_birth: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  employment_status: string | null
  monthly_income: number | null
  credit_score: number | null
}

export default function UpdateProfilePage() {
  const router = useRouter()
  const user = authState.getUser()
  const [isLoading, setIsLoading] = React.useState(false)
  const [profile, setProfile] = React.useState<UserProfile>({
    id: "",
    email: "",
    full_name: "",
    phone: null,
    date_of_birth: null,
    address: null,
    city: null,
    state: null,
    postal_code: null,
    country: null,
    employment_status: null,
    monthly_income: null,
    credit_score: null,
  })

  React.useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("users_account")
          .select("*")
          .eq("id", user.id)
          .single()

        if (error) throw error

        if (data) {
          setProfile(data)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Failed to load profile data")
      }
    }

    fetchProfile()
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("users_account")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          date_of_birth: profile.date_of_birth,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          postal_code: profile.postal_code,
          country: profile.country,
          employment_status: profile.employment_status,
          monthly_income: profile.monthly_income,
          credit_score: profile.credit_score,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      toast.success("Profile updated successfully")
      router.push("/userDashboard")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Update Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name || ""}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profile.phone || ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={profile.date_of_birth || ""}
              onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={profile.address || ""}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={profile.city || ""}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={profile.state || ""}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              value={profile.postal_code || ""}
              onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={profile.country || ""}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employment_status">Employment Status</Label>
            <Input
              id="employment_status"
              value={profile.employment_status || ""}
              onChange={(e) => setProfile({ ...profile, employment_status: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_income">Monthly Income</Label>
            <Input
              id="monthly_income"
              type="number"
              value={profile.monthly_income || ""}
              onChange={(e) => setProfile({ ...profile, monthly_income: e.target.value ? Number(e.target.value) : null })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credit_score">Credit Score</Label>
            <Input
              id="credit_score"
              type="number"
              value={profile.credit_score || ""}
              onChange={(e) => setProfile({ ...profile, credit_score: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/userDashboard")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </form>
    </div>
  )
} 