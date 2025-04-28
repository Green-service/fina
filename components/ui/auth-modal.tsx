"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, User, Phone, CheckCircle, Clock } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { VerificationCodeInput } from "@/components/ui/verification-code-input"
import { authState } from "@/lib/auth-state"

const signInSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
})

const signUpSchema = z
  .object({
    fullName: z.string().min(2, {
      message: "Full name must be at least 2 characters.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    phone: z.string().min(10, {
      message: "Please enter a valid phone number.",
    }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialView?: "signIn" | "signUp"
}

type AuthView = "signIn" | "signUp" | "verification" | "success"

export function AuthModal({ isOpen, onClose, initialView = "signIn" }: AuthModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [view, setView] = useState<AuthView>(initialView)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [pendingEmail, setPendingEmail] = useState("")
  const [pendingUserData, setPendingUserData] = useState<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // Update view when initialView prop changes
  useEffect(() => {
    if (initialView === "signIn" || initialView === "signUp") {
      setView(initialView)
    }
  }, [initialView])

  // Timer for verification code
  useEffect(() => {
    if (view === "verification" && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      // Time expired
      toast({
        title: "Verification time expired",
        description: "Please request a new verification code",
        variant: "destructive",
      })
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [view, timeLeft, toast])

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSignIn(values: z.infer<typeof signInSchema>) {
    setIsLoading(true)
    try {
      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (authError) {
        console.error('Auth error:', authError)
        throw new Error(authError.message || "Invalid email or password")
      }

      if (!authData.user) {
        throw new Error("Invalid email or password")
      }

      // Get user role from users_account table
      const { data: userData, error: userError } = await supabase
        .from('users_account')
        .select('user_role')
        .eq('auth_id', authData.user.id)
        .single()

      if (userError) {
        console.error('User data error:', userError)
        // Even if we can't get the role, we'll still let them sign in
        console.log('Continuing with default user role')
      }

      // Create a user object with the auth data
      const user = {
        id: authData.user.id,
        email: authData.user.email,
        user_metadata: authData.user.user_metadata
      }

      // Set user in our custom auth state manager
      authState.setUser(user)
      authState.setUserRole(userData?.user_role || 'user')

      // Show success toast
      toast({
        title: "Success!",
        description: "You have successfully signed in, Welcome to Green Fina",
      })

      // Close the modal
      onClose()

      // Redirect based on user role
      const redirectPath = userData?.user_role === "2" ? '/adminDashboard' : '/userDashboard'
      window.location.href = redirectPath
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to sign in. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onSignUp(values: z.infer<typeof signUpSchema>) {
    setIsLoading(true)
    try {
      // First create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            phone: values.phone
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) {
        console.error('Auth signup error:', authError)
        throw new Error(authError.message || "Failed to create account")
      }

      if (!authData.user) {
        throw new Error("Failed to create account")
      }

      // Store pending user data for later use
      setPendingUserData({
        email: values.email,
        full_name: values.fullName,
        phone: values.phone,
        password: values.password
      })
      setPendingEmail(values.email)

      // Show verification view immediately
      setView("verification")

      // Start the resend timer
      setTimeLeft(300) // 5 minutes
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        setTimeLeft(0)
      }, 300000) // 5 minutes in milliseconds

    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function verifyCode(code: string) {
    setIsVerifying(true)
    try {
      // Verify the OTP code with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: code,
        type: "signup",
      })

      if (error) throw error

      // Get the user ID from the authenticated user
      const { data: userData } = await supabase.auth.getUser()
      const authId = userData.user?.id

      if (!authId) {
        throw new Error("No user ID found after verification")
      }

      // Insert user data into users_account table
      if (pendingUserData) {
        const { error: insertError } = await supabase.from("users_account").insert([
          {
            auth_id: authId,
            email: pendingUserData.email,
            full_name: pendingUserData.full_name,
            phone: pendingUserData.phone,
            password_hash: "**********", // For reference only, actual auth is handled by Supabase
            user_role: "1", // Set role to "1" instead of "user"
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
        ])

        if (insertError) {
          console.error("Error inserting user data:", insertError)
          throw insertError
        }

        // Set user in our custom auth state manager
        if (userData.user) {
          authState.setUser(userData.user)
          authState.setUserRole("1")
        }
      }

      // Show success view
      setView("success")

      // Clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      toast({
        title: "Verification successful",
        description: "Your account has been verified successfully",
      })

    } catch (error: any) {
      console.error("Verification error:", error)
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired verification code",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  async function resendVerificationCode() {
    if (!pendingEmail || !pendingUserData) return

    setIsLoading(true)
    try {
      // Sign up again to resend the verification email
      const { error } = await supabase.auth.signUp({
        email: pendingEmail,
        password: pendingUserData.password,
        options: {
          data: {
            full_name: pendingUserData.full_name,
            phone: pendingUserData.phone
          }
        }
      })

      if (error) throw error

      // Reset timer
      setTimeLeft(300) // 5 minutes
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        setTimeLeft(0)
      }, 300000) // 5 minutes in milliseconds

      toast({
        title: "Verification code resent",
        description: "Please check your email for the new 6-digit verification code",
      })

    } catch (error: any) {
      toast({
        title: "Failed to resend code",
        description: error.message || "Failed to resend verification code",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    try {
      // For Google sign-in, we'll just create a temporary user
      // In a real app, you'd want to verify the Google token
      const tempUser = {
        id: 'google-' + Date.now(),
        email: 'google-user@example.com',
        user_metadata: {
          full_name: 'Google User',
          phone: ''
        }
      }

      // Set user in our custom auth state manager
      authState.setUser(tempUser)
      authState.setUserRole('user')
      
      // Show success toast
      toast({
        title: "Success!",
        description: "You have successfully signed in with Google",
      })

      // Close the modal
      onClose()

      // Redirect to user dashboard
      window.location.replace('/userDashboard')
      
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      })
      setIsGoogleLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  const handleSuccessContinue = () => {
    // Reset forms
    signInForm.reset()
    signUpForm.reset()

    // Switch to sign in view
    setView("signIn")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[380px] border-none bg-black/80 backdrop-blur-xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">
          {view === "signIn" ? "Sign In" : view === "signUp" ? "Sign Up" : view === "verification" ? "Verify Email" : "Success"}
        </DialogTitle>
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-sky-500/5 to-purple-500/10 z-0" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-sky-400 to-green-400 z-10" />

        <div className="relative z-10 p-4">
          <div className="absolute top-2 right-2">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:text-white">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Logo at the top of the modal */}
          <div className="flex justify-center mb-2">
            <motion.div
              animate={{
                opacity: [0.7, 1, 0.7],
                scale: [0.98, 1, 0.98],
                filter: [
                  "drop-shadow(0 0 5px rgba(74, 222, 128, 0.5))",
                  "drop-shadow(0 0 10px rgba(74, 222, 128, 0.8))",
                  "drop-shadow(0 0 5px rgba(74, 222, 128, 0.5))",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "mirror",
              }}
              className="relative w-12 h-12 mb-1"
            >
              <Image src="/images/logo.png" alt="Green Fina Logo" width={48} height={48} className="object-contain" />
            </motion.div>
          </div>

          {/* Toggle buttons - only show for sign in/sign up */}
          {(view === "signIn" || view === "signUp") && (
            <div className="flex p-1 mb-4 bg-black/30 rounded-full border border-white/10">
              <Button
                variant="ghost"
                className={`flex-1 rounded-full text-xs h-8 ${
                  view === "signIn" ? "bg-gradient-to-r from-green-500 to-sky-500 text-white" : "text-white/60"
                }`}
                onClick={() => setView("signIn")}
              >
                Sign In
              </Button>
              <Button
                variant="ghost"
                className={`flex-1 rounded-full text-xs h-8 ${
                  view === "signUp" ? "bg-gradient-to-r from-green-500 to-sky-500 text-white" : "text-white/60"
                }`}
                onClick={() => setView("signUp")}
              >
                Sign Up
              </Button>
            </div>
          )}

          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              {view === "signIn" && (
                <motion.div
                  key="signIn"
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-center text-white">Welcome Back</h2>

                  <Button
                    variant="outline"
                    className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-2 h-10"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        <span>Sign in with Google</span>
                      </>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-black px-2 text-white/50">or continue with</span>
                    </div>
                  </div>

                  <Form {...signInForm}>
                    <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-3">
                      <FormField
                        control={signInForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  placeholder="Email"
                                  {...field}
                                  className="bg-white/5 border-white/10 focus:border-green-400/50 text-white h-9 pl-10"
                                />
                              </FormControl>
                              <Mail className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                            </div>
                            <FormMessage className="text-red-400 text-xs mt-1">
                              {signInForm.formState.errors.email?.message}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signInForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Password"
                                  {...field}
                                  className="bg-white/5 border-white/10 focus:border-green-400/50 text-white h-9 pl-10 pr-10"
                                />
                              </FormControl>
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-9 w-9 p-0 text-white/40 hover:text-white/70"
                                onClick={togglePasswordVisibility}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                              </Button>
                            </div>
                            <FormMessage className="text-red-400 text-xs mt-1">
                              {signInForm.formState.errors.password?.message}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-400 to-sky-400 hover:from-green-500 hover:to-sky-500 text-white h-9"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            Sign in
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}

              {view === "signUp" && (
                <motion.div
                  key="signUp"
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-center text-white">Create Your Account</h2>

                  <Button
                    variant="outline"
                    className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-2 h-10"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        <span>Sign up with Google</span>
                      </>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-black px-2 text-white/50">or continue with</span>
                    </div>
                  </div>

                  <Form {...signUpForm}>
                    <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-3">
                      <FormField
                        control={signUpForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  placeholder="Full Name"
                                  {...field}
                                  className="bg-white/5 border-white/10 focus:border-green-400/50 text-white h-9 pl-10"
                                />
                              </FormControl>
                              <User className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                            </div>
                            <FormMessage className="text-red-400 text-xs mt-1">
                              {signUpForm.formState.errors.fullName?.message}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signUpForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  placeholder="Email"
                                  {...field}
                                  className="bg-white/5 border-white/10 focus:border-green-400/50 text-white h-9 pl-10"
                                />
                              </FormControl>
                              <Mail className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                            </div>
                            <FormMessage className="text-red-400 text-xs mt-1">
                              {signUpForm.formState.errors.email?.message}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signUpForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  placeholder="Phone Number"
                                  {...field}
                                  className="bg-white/5 border-white/10 focus:border-green-400/50 text-white h-9 pl-10"
                                />
                              </FormControl>
                              <Phone className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                            </div>
                            <FormMessage className="text-red-400 text-xs mt-1">
                              {signUpForm.formState.errors.phone?.message}
                            </FormMessage>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signUpForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Password"
                                  {...field}
                                  className="bg-white/5 border-white/10 focus:border-green-400/50 text-white h-9 pl-10 pr-10"
                                />
                              </FormControl>
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-9 w-9 p-0 text-white/40 hover:text-white/70"
                                onClick={togglePasswordVisibility}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                              </Button>
                            </div>
                            <FormMessage className="text-red-400 text-xs mt-1">
                              {signUpForm.formState.errors.password?.message}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signUpForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm Password"
                                  {...field}
                                  className="bg-white/5 border-white/10 focus:border-green-400/50 text-white h-9 pl-10 pr-10"
                                />
                              </FormControl>
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-9 w-9 p-0 text-white/40 hover:text-white/70"
                                onClick={toggleConfirmPasswordVisibility}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">
                                  {showConfirmPassword ? "Hide password" : "Show password"}
                                </span>
                              </Button>
                            </div>
                            <FormMessage className="text-red-400 text-xs mt-1">
                              {signUpForm.formState.errors.confirmPassword?.message}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-400 to-sky-400 hover:from-green-500 hover:to-sky-500 text-white h-9"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            Create Account
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}

              {view === "verification" && (
                <motion.div
                  key="verification"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-center text-white">Verify Your Email</h2>
                  <p className="text-center text-white/70 text-sm">
                    We've sent a 6-digit verification code to <span className="text-green-400">{pendingEmail}</span>
                  </p>

                  <div className="space-y-4">
                    <VerificationCodeInput length={6} onComplete={verifyCode} disabled={isVerifying || timeLeft <= 0} />

                    <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(timeLeft)}</span>
                    </div>

                    {timeLeft <= 0 && (
                      <div className="text-center">
                        <p className="text-red-400 text-sm mb-2">Verification code expired</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resendVerificationCode}
                          disabled={isLoading}
                          className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend Code"}
                        </Button>
                      </div>
                    )}

                    <div className="text-center text-sm text-white/60 pt-2">
                      <p>Didn't receive the code?</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={resendVerificationCode}
                        disabled={isLoading || timeLeft > 240} // Allow resend after 1 minute
                        className="text-green-400 hover:text-green-300 p-0 h-auto"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend Code"}
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView("signUp")}
                    className="w-full text-white/60 hover:text-white"
                  >
                    Back to Sign Up
                  </Button>
                </motion.div>
              )}

              {view === "success" && (
                <motion.div
                  key="success"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 py-4"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold text-center text-white">Account Verified!</h2>
                    <p className="text-center text-white/70 text-sm mt-2">
                      Your account has been successfully created and verified.
                    </p>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-green-400 to-sky-400 hover:from-green-500 hover:to-sky-500 text-white"
                    onClick={handleSuccessContinue}
                  >
                    Continue to Sign In
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          className="absolute -bottom-10 -right-10 w-40 h-40 bg-green-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
          }}
        />
        <motion.div
          className="absolute -top-10 -left-10 w-40 h-40 bg-sky-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            delay: 1,
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
