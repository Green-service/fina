import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Check your .env file or environment configuration.")
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: "supabase.auth.token",
  },
})

// Debug function to check if Supabase is configured correctly
export const checkSupabaseConfig = () => {
  console.log("Supabase URL:", supabaseUrl ? "Set" : "Missing")
  console.log("Supabase Anon Key:", supabaseAnonKey ? "Set" : "Missing")
  return {
    isConfigured: !!supabaseUrl && !!supabaseAnonKey,
    url: supabaseUrl,
  }
}

// Helper function to check if a user is authenticated
export const isAuthenticated = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error("Auth check error:", error)
      return false
    }
    return !!data.session
  } catch (error) {
    console.error("Unexpected error during auth check:", error)
    return true
  }
}
