"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, BarChart2, TrendingUp, Plus, FileText, Clock, ArrowRight, Bell, UserCircle, Settings, LogOut, User, Upload, Building2, CreditCard, Calendar, Phone, Mail, Home, X, Eye, Maximize2, CheckCircle, Key } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import styles from './styles.module.css'
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { authState } from '@/lib/auth-state'
import emailjs from '@emailjs/browser'
import LoanHistoryLimits from '@/components/LoanHistoryLimits'

interface UserProfile {
  id: string
  auth_id: string | null
  email: string
  full_name: string
  phone: string | null
  profile_picture_url: string | null
  user_role: string
  date_of_birth: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  employment_status: string | null
  monthly_income: number | null
  credit_score: number | null
  is_verified: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

interface FormData {
  fullName: string
  email: string
  phone: string
  address: string
  employmentStatus: string
  monthlyIncome: string
  loanAmount: string
  loanPurpose: string
  returnDate: string
  bankName: string
  accountNumber: string
  accountType: string
  employmentContract: File | null
  investmentType: string
  investmentAmount: string
  investmentTerm: string
  paypalEmail: string
}

interface InvestmentFormData {
  fullName: string;
  email: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  investmentType: string;
  investmentAmount: string;
  investmentTerm: string;
  paymentProof: File | null;
}

interface UserInvestment {
  id: string;
  userId: string;
  amount: number;
  term: number;
  paymentProofUrl: string;
  status: string;
  createdAt: string;
  investment_type: string;
}

// Add this interface near the top with other interfaces
interface Activity {
  id: string;
  type: 'loan' | 'investment' | 'stokvela';
  title: string;
  status: string;
  amount: number;
  timestamp: string;
  description: string;
}

interface StokvelaJoinForm {
  names: string;
  email: string;
  cellphone_number: string;
  account_number: string;
  account_name: string;
  account_type: string;
}

export default function UserDashboard() {
  const { user, userRole, isLoading: authLoading} = useAuth()
  const router = useRouter()
  const supabaseRef = useRef<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [userLoans, setUserLoans] = useState<any[]>([])
  const [userInvestments, setUserInvestments] = useState<any[]>([])
  const [isLoadingLoans, setIsLoadingLoans] = useState(false)
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(false)
  const [showAllLoans, setShowAllLoans] = useState(false)
  const [showAllInvestments, setShowAllInvestments] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<any>(null)
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null)
  const [isLoanDetailsOpen, setIsLoanDetailsOpen] = useState(false)
  const [isInvestmentDetailsOpen, setIsInvestmentDetailsOpen] = useState(false)
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false)
  const [investmentCurrentStep, setInvestmentCurrentStep] = useState(1)
  const [isInvestmentSubmitting, setIsInvestmentSubmitting] = useState(false)
  const [userStokvelas, setUserStokvelas] = useState<any[]>([])
  const [isLoadingStokvelas, setIsLoadingStokvelas] = useState(false)
  const [showAllStokvelas, setShowAllStokvelas] = useState(false)
  const [selectedStokvela, setSelectedStokvela] = useState<any>(null)
  const [isStokvelaDetailsOpen, setIsStokvelaDetailsOpen] = useState(false)
  const [stokvelaMembers, setStokvelaMembers] = useState<any[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('all')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [isMemberDetailsOpen, setIsMemberDetailsOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    employmentStatus: '',
    monthlyIncome: '',
    loanAmount: '',
    loanPurpose: '',
    returnDate: '',
    bankName: '',
    accountNumber: '',
    accountType: '',
    employmentContract: null,
    investmentType: '',
    investmentAmount: '',
    investmentTerm: '',
    paypalEmail: ''
  })

  const [investmentFormData, setInvestmentFormData] = useState<InvestmentFormData>({
    fullName: "",
    email: "",
    phone: "",
    bankName: "",
    accountNumber: "",
    accountType: "",
    investmentType: "j", // Default to 'j' as per your schema
    investmentAmount: "",
    investmentTerm: "12", // Default to 12 months
    paymentProof: null
  });

  const [isMaximized, setIsMaximized] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentSignature, setPaymentSignature] = useState("")
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [paymentStep, setPaymentStep] = useState(1)
  const [accountHolderName, setAccountHolderName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")
  const [uploadProgress, setUploadProgress] = useState(0)
  // Add this state near other state declarations
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  // Add state for join form
  const [joinFormData, setJoinFormData] = useState<StokvelaJoinForm>({
    names: '',
    email: '',
    cellphone_number: '',
    account_number: '',
    account_name: '',
    account_type: ''
  });

  const [isJoinFormOpen, setIsJoinFormOpen] = useState(false);
  const [selectedStokvelaForJoin, setSelectedStokvelaForJoin] = useState<any>(null);

  // Initialize Supabase client
  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
  }, [])

  // Ensure supabaseRef is available before using it
  const getSupabaseClient = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }

  // Add the getInitials function near the top of the component
  const getUserInitial = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  // Define handleViewStokvelaDetails at the top of the component
  const handleViewStokvelaDetails = async (stokvela: any) => {
    try {
      setIsLoadingMembers(true);
      const { data: { session } } = await supabaseRef.current.auth.getSession();
      if (!session?.user) return;

      // Get all members of this stokvela group
      const { data: members, error } = await supabaseRef.current
        .from('stokvela_members')
        .select('*')
        .eq('group_id', stokvela.id)
        .order('position', { ascending: true });

      if (error) throw error;
      
      setSelectedStokvela(stokvela);
      setStokvelaMembers(members || []);
      setIsStokvelaDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching stokvela members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stokvela members. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const authUser = authState.getUser()
        if (!authUser?.email) {
          console.error('No user email found')
        return
      }

        const { data, error } = await supabaseRef.current
          .from('users_account')
        .select('*')
          .eq('email', authUser.email)
        .single()

        if (error) {
          console.error('Error fetching user profile:', error)
        return
      }

        if (data) {
          setUserProfile({
            id: data.id,
            email: data.email,
            full_name: data.full_name || '',
            phone: data.phone || '',
            address: data.address || '',
            employment_status: data.employment_status || '',
            monthly_income: data.monthly_income || 0,
            user_role: data.user_role || 'user'
          })
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error)
      }
    }

    fetchUserProfile()
  }, [])

  useEffect(() => {
    const fetchUserLoans = async () => {
      if (activeTab === 'loans') {
        setIsLoadingLoans(true)
        try {
          const userId = authState.getUserId()
          if (!userId) return

          const { data: loans, error } = await supabaseRef.current
            .from('loan_applications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (error) throw error
          setUserLoans(loans || [])
        } catch (error) {
          console.error('Error fetching loans:', error)
          toast({
            title: "Error",
            description: "Failed to fetch loan applications",
            variant: "destructive",
          })
        } finally {
          setIsLoadingLoans(false)
        }
      }
    }

    fetchUserLoans()
  }, [activeTab])

  const fetchUserInvestments = async () => {
    try {
      const userId = authState.getUserId()
      if (!userId) return

      const { data, error } = await supabaseRef.current
        .from('investments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserInvestments(data || [])
    } catch (error) {
      console.error('Error fetching investments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch investments",
        variant: "destructive",
      })
    } finally {
      setIsLoadingInvestments(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'investments') {
      setIsLoadingInvestments(true)
      fetchUserInvestments()
    }
  }, [activeTab])

  useEffect(() => {
    const fetchStokvelas = async () => {
      if (activeTab === 'stokvela') {
        setIsLoadingStokvelas(true)
        try {
          const userId = authState.getUserId();
          if (!userId) return;

          const { data: stokvelas, error } = await supabaseRef.current
            .from('stokvela_groups')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) throw error
          
          // Fetch member count and check user membership for each stokvela
          const stokvelasWithDetails = await Promise.all(
            (stokvelas || []).map(async (stokvela) => {
              // Get member count
              const { count, error: countError } = await supabaseRef.current
                .from('stokvela_members')
                .select('*', { count: 'exact', head: true })
                .eq('group_id', stokvela.id)
              
              if (countError) {
                console.error('Error fetching member count:', countError)
                return { ...stokvela, member_count: 0, is_member: false }
              }

              // Check if user is a member
              const { data: membership, error: membershipError } = await supabaseRef.current
                .from('stokvela_members')
                .select('*')
                .eq('group_id', stokvela.id)
                .eq('user_id', userId)
                .single()

              if (membershipError && membershipError.code !== 'PGRST116') {
                console.error('Error checking membership:', membershipError)
              }
              
              return { 
                ...stokvela, 
                member_count: count || 0,
                is_member: !!membership
              }
            })
          )
          
          setUserStokvelas(stokvelasWithDetails || [])
        } catch (error) {
          console.error('Error fetching stokvelas:', error)
          toast({
            title: "Error",
            description: "Failed to fetch stokvela groups",
            variant: "destructive",
          })
        } finally {
          setIsLoadingStokvelas(false)
        }
      }
    }

    fetchStokvelas()
  }, [activeTab])

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const userId = authState.getUserId();
        if (!userId) return;

        // Fetch recent loans
        const { data: loans } = await supabaseRef.current
          .from('loan_applications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch recent investments
        const { data: investments } = await supabaseRef.current
          .from('investments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch recent stokvela memberships
        const { data: stokvelas } = await supabaseRef.current
          .from('stokvela_members')
          .select('*, stokvelas(name)')
          .eq('user_id', userId)
          .order('joined_at', { ascending: false })
          .limit(5);

        // Combine and format activities
        const activities: Activity[] = [
          ...(loans || []).map(loan => ({
            id: loan.id,
            type: 'loan',
            title: loan.loan_purpose || 'Loan Application',
            status: loan.status,
            amount: parseFloat(loan.amount),
            timestamp: loan.created_at,
            description: `Loan for ${loan.loan_purpose}`
          })),
          ...(investments || []).map(inv => ({
            id: inv.id,
            type: 'investment',
            title: inv.investment_type === 'j' ? 'Joint Investment' : 'Individual Investment',
            status: inv.status,
            amount: inv.amount,
            timestamp: inv.created_at,
            description: `${inv.investment_type === 'j' ? 'Joint' : 'Individual'} investment`
          })),
          ...(stokvelas || []).map(stok => ({
            id: stok.id,
            type: 'stokvela',
            title: stok.stokvels?.name || 'Stokvela Group',
            status: stok.verified === 1 ? 'verified' : 'pending',
            amount: stok.amount_contibuted || 0,
            timestamp: stok.joined_at,
            description: `Joined ${stok.stokvels?.name || 'a stokvela group'}`
          }))
        ];

        // Sort by timestamp and take the 5 most recent
        const sortedActivities = activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5);

        setRecentActivities(sortedActivities);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      }
    };

    fetchRecentActivities();
  }, [user?.id]);

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.fullName) {
          toast({
            title: "Missing Information",
            description: "Please enter your full name",
            variant: "destructive",
          })
          return false
        }
        if (!formData.loanAmount) {
          toast({
            title: "Missing Information",
            description: "Please enter the loan amount",
            variant: "destructive",
          })
          return false
        }
        if (!formData.returnDate) {
          toast({
            title: "Missing Information",
            description: "Please select a return date",
            variant: "destructive",
          })
          return false
        }
        if (!formData.monthlyIncome) {
          toast({
            title: "Missing Information",
            description: "Please enter your monthly income",
            variant: "destructive",
          })
          return false
        }
        if (!formData.loanPurpose) {
          toast({
            title: "Missing Information",
            description: "Please describe the purpose of your loan",
            variant: "destructive",
          })
          return false
        }
        return true
      case 2:
        if (!formData.bankName) {
          toast({
            title: "Missing Information",
            description: "Please select your bank",
            variant: "destructive",
          })
          return false
        }
        if (!formData.accountNumber) {
          toast({
            title: "Missing Information",
            description: "Please enter your account number",
            variant: "destructive",
          })
          return false
        }
        if (!formData.accountType) {
          toast({
            title: "Missing Information",
            description: "Please select your account type",
            variant: "destructive",
          })
          return false
        }
        return true
      case 3:
        if (!formData.bankStatement) {
          toast({
            title: "Missing Information",
            description: "Please upload your bank statements",
            variant: "destructive",
          })
          return false
        }
        if (!formData.proofOfId) {
          toast({
            title: "Missing Information",
            description: "Please upload your proof of ID",
            variant: "destructive",
          })
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Helper function to upload file
  const uploadFile = async (file: File, folder: string, userId: string) => {
    try {
      const timestamp = Date.now()
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${userId}/${folder}/${timestamp}-${cleanFileName}`
      
      // Upload file to existing bucket with better error handling
      const { error: uploadError, data } = await supabaseRef.current.storage
        .from('ducuments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        })

      if (uploadError) {
        console.error(`Upload error details:`, uploadError)
        
        // Handle specific error cases
        if (uploadError.message.includes('Permission denied') || uploadError.message.includes('not authorized')) {
          throw new Error('Permission denied. Please check if you are properly signed in.')
        } else if (uploadError.message.includes('Invalid') || uploadError.message.includes('Bad Request')) {
          throw new Error('Invalid file or upload request. Please try again.')
        } else {
          throw new Error(`Failed to upload ${folder}: ${uploadError.message}`)
        }
      }

      // Get the public URL for the file
      const { data: { publicUrl } } = supabaseRef.current
        .storage
        .from('ducuments')
        .getPublicUrl(filePath)

      return filePath
    } catch (error) {
      console.error(`Error in uploadFile:`, error)
      throw error
    }
  }

  const handleSubmitLoan = async () => {
    try {
      setIsSubmitting(true)
      
      // Validate final step
      if (!validateStep(4)) {
        setIsSubmitting(false)
        return
      }

      const { data: { session } } = await supabaseRef.current.auth.getSession()
      if (!session?.user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a loan application",
          variant: "destructive",
        })
        return
      }

      const userId = session.user.id
      const documentUrls: { [key: string]: string } = {}

      // Upload bank statement
      if (formData.bankStatement) {
        try {
          const path = await uploadFile(formData.bankStatement, 'bank-statements', userId)
          documentUrls.bank_statement_url = path
        } catch (error) {
          console.error('Error uploading bank statement:', error)
          toast({
            title: "Error",
            description: "Failed to upload bank statement. Please try again.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Upload ID document
      if (formData.proofOfId) {
        try {
          const path = await uploadFile(formData.proofOfId, 'id-documents', userId)
          documentUrls.id_document_url = path
        } catch (error) {
          console.error('Error uploading ID document:', error)
          toast({
            title: "Error",
            description: "Failed to upload ID document. Please try again.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Create loan application
      try {
      // Calculate returning amount (40% interest)
      const returningAmount = parseFloat(formData.loanAmount) * 1.4

        // Calculate term in months (assuming returnDate is in format YYYY-MM-DD)
        const returnDate = new Date(formData.returnDate)
        const today = new Date()
        const monthsDiff = (returnDate.getFullYear() - today.getFullYear()) * 12 + 
                          (returnDate.getMonth() - today.getMonth())
        const termInMonths = Math.max(1, monthsDiff) // Ensure at least 1 month

        const { error } = await supabaseRef.current
        .from('loan_applications')
        .insert({
            user_id: userId,
          amount: parseFloat(formData.loanAmount),
          purpose: formData.loanPurpose,
            term: termInMonths, // Use calculated months instead of date string
            returning_date: formData.returnDate,
            bank_statement_url: documentUrls.bank_statement_url,
            id_document_url: documentUrls.id_document_url,
          status: 'pending',
          employment_status: formData.employmentStatus,
          monthly_income: parseFloat(formData.monthlyIncome),
            returning_amount: returningAmount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        // Send confirmation email using EmailJS
        try {
          // Initialize EmailJS with your public key
          emailjs.init("xC1QMlEUFiMQaCmHA")
          
          // Format the return date for display
          const formattedReturnDate = new Date(formData.returnDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          
          // Get the user's email directly from the session
          const { data: { session } } = await supabaseRef.current.auth.getSession()
          if (!session?.user) {
            throw new Error("User session not found")
          }
          
          const userEmail = session.user.email
          const userName = session.user.user_metadata?.full_name || "Valued Customer"
          
          // Send the email
          await emailjs.send(
            "service_auuykij", // Service ID
            "template_3ns00mj", // Template ID
            {
              to_name: userName,
              to_email: userEmail,
              message: `Thank you for applying for a loan with GreenFina. Your application has been received and is currently under review. We will notify you once a decision has been made.`,
              loan_amount: parseFloat(formData.loanAmount).toLocaleString(),
              total_amount: returningAmount.toLocaleString(),
              due_date: formattedReturnDate,
            },
            "xC1QMlEUFiMQaCmHA" // Public Key
          )
          
          console.log("Confirmation email sent successfully to:", userEmail)
          
          // Show success dialog
          setUserEmail(userEmail)
          setShowSuccessDialog(true)
          
          // Wait for 3 seconds before closing the modal and resetting the form
          setTimeout(() => {
            setFormData({
              fullName: '',
              email: '',
              phone: '',
              address: '',
              employmentStatus: '',
              monthlyIncome: '',
              loanAmount: '',
              loanPurpose: '',
              returnDate: '',
              bankName: '',
              accountNumber: '',
              accountType: '',
              employmentContract: null,
              investmentType: '',
              investmentAmount: '',
              investmentTerm: '',
              paypalEmail: ''
            })
            setIsLoanModalOpen(false);
            setCurrentStep(1);
          }, 3000);

        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Show error message but still close the form
      toast({
            title: "Error",
            description: "There was an error sending the confirmation email, but your loan application was submitted successfully.",
        duration: 5000,
            className: "bg-yellow-500 text-white",
          });

          // Wait for 3 seconds before closing the modal and resetting the form
      setTimeout(() => {
        setFormData({
              fullName: '',
              email: '',
              phone: '',
              address: '',
              employmentStatus: '',
              monthlyIncome: '',
              loanAmount: '',
              loanPurpose: '',
              returnDate: '',
              bankName: '',
              accountNumber: '',
              accountType: '',
          employmentContract: null,
              investmentType: '',
              investmentAmount: '',
              investmentTerm: '',
              paypalEmail: ''
            })
            setIsLoanModalOpen(false);
            setCurrentStep(1);
          }, 3000);
        }

      } catch (dbError) {
        console.error('Error creating loan record:', dbError)
        toast({
          title: "Error",
          description: "Failed to create loan record. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error submitting loan:', error)
      toast({
        title: "Error",
        description: "Failed to submit loan application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!userProfile?.id) return

    const { error } = await supabaseRef.current
      .from('profiles')
      .update(updatedData)
      .eq('id', userProfile.id)

    if (error) {
      console.error('Error updating profile:', error)
      return
    }

    // Refresh profile data
    const { data: profileData } = await supabaseRef.current
      .from('profiles')
      .select('*')
      .eq('id', userProfile.id)
      .single()

    if (profileData) {
      setUserProfile(profileData)
    }
  }

  const handleChangePassword = async () => {
    try {
      const { error } = await supabaseRef.current.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setIsPasswordModalOpen(false)
      toast({
        title: "Success",
        description: "Your password has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in to submit an application")
        return
      }

      // Upload documents if they exist
      const documentUrls: { [key: string]: string } = {}
      if (formData.bankStatement) {
        const { data: bankData, error: bankError } = await supabase.storage
          .from("documents")
          .upload(`${user.id}/bank_statement_${Date.now()}`, formData.bankStatement)
        if (bankError) throw bankError
        documentUrls.bankStatement = bankData.path
      }

      if (formData.proofOfId) {
        const { data: idData, error: idError } = await supabase.storage
          .from("documents")
          .upload(`${user.id}/proof_of_id_${Date.now()}`, formData.proofOfId)
        if (idError) throw idError
        documentUrls.proofOfId = idData.path
      }

      if (formData.employmentContract) {
        const { data: contractData, error: contractError } = await supabase.storage
          .from("documents")
          .upload(`${user.id}/employment_contract_${Date.now()}`, formData.employmentContract)
        if (contractError) throw contractError
        documentUrls.employmentContract = contractData.path
      }

      // Submit application data
      const { error: submitError } = await supabase
        .from("applications")
        .insert([
          {
            user_id: user.id,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            employment_status: formData.employmentStatus,
            monthly_income: formData.monthlyIncome,
            loan_amount: formData.loanAmount,
            loan_purpose: formData.loanPurpose,
            bank_statement_url: documentUrls.bankStatement,
            proof_of_id_url: documentUrls.proofOfId,
            employment_contract_url: documentUrls.employmentContract,
            status: "pending"
          }
        ])

      if (submitError) throw submitError

      // Show success message
      toast({
        title: "Application Submitted Successfully!",
        description: "Your loan application has been received. Please wait within 24 hours for approval. We will contact you shortly.",
        variant: "default",
      })

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        employmentStatus: "",
        monthlyIncome: "",
        loanAmount: "",
        loanPurpose: "",
        returnDate: "",
        bankName: "",
        accountNumber: "",
        accountType: "",
        bankStatement: null,
        proofOfId: null,
        employmentContract: null,
      })

    } catch (err) {
      console.error("Error submitting application:", err)
      setError(err instanceof Error ? err.message : "An error occurred while submitting your application")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate return amount with 40% interest
  const calculateReturnAmount = (amount: string) => {
    if (!amount) return "0"
    const loanAmount = parseFloat(amount)
    const interest = loanAmount * 0.4
    return (loanAmount + interest).toFixed(2)
  }

  // Check if loan amount exceeds 40% of monthly income
  const checkLoanEligibility = (loanAmount: string, monthlyIncome: string) => {
    if (!loanAmount || !monthlyIncome) return true
    const loan = parseFloat(loanAmount)
    const income = parseFloat(monthlyIncome)
    const maxLoan = income * 0.4
    return loan <= maxLoan
  }

  const handleViewLoanDetails = (loan: any) => {
    setSelectedLoan(loan)
    setIsLoanDetailsOpen(true)
  }

  const handleWithdrawLoan = async (loanId: string) => {
    try {
      const { error } = await supabaseRef.current
        .from('loan_applications')
        .delete()
        .eq('id', loanId)

      if (error) throw error

      setUserLoans(prev => prev.filter(loan => loan.id !== loanId))
      setIsWithdrawConfirmOpen(false)
      setIsLoanDetailsOpen(false)
      toast({
        title: "Success",
        description: "Loan application withdrawn successfully",
        variant: "default",
        duration: 5000,
      })
    } catch (error) {
      console.error('Error withdrawing loan:', error)
      toast({
        title: "Error",
        description: "Failed to withdraw loan application",
        variant: "destructive",
      })
    }
  }

  const getLoanStats = () => {
    const totalLoans = userLoans.length
    const pendingLoans = userLoans.filter(loan => loan.status === 'pending').length
    const rejectedLoans = userLoans.filter(loan => loan.status === 'rejected').length
    const approvedLoans = userLoans.filter(loan => loan.status === 'approved').length

    return {
      total: totalLoans,
      pending: pendingLoans,
      rejected: rejectedLoans,
      approved: approvedLoans
    }
  }

  const loanStats = getLoanStats()

  // Calculate loan qualification metrics
  const calculateLoanMetrics = () => {
    const paidBackLoans = userLoans.filter(loan => loan.status === 'paid_back').length
    const totalLoans = userLoans.length
    const paidBackRate = totalLoans > 0 ? (paidBackLoans / totalLoans) * 100 : 0
    
    // Calculate max loan amount based on monthly income
    const monthlyIncome = userProfile?.monthly_income || 0
    const maxLoanAmount = monthlyIncome * 0.4 // 40% of monthly income
    
    // Calculate approval probability based on paid back rate and income
    const baseApprovalProbability = 70 // Base probability
    const paidBackBonus = paidBackRate * 0.3 // Up to 30% bonus for good repayment history
    const incomeBonus = (monthlyIncome / 10000) * 5 // Up to 5% bonus for higher income
    const approvalProbability = Math.min(baseApprovalProbability + paidBackBonus + incomeBonus, 95)
    
    return {
      paidBackRate,
      maxLoanAmount,
      approvalProbability,
      monthlyIncome
    }
  }

  const loanMetrics = calculateLoanMetrics()

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
    return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Full Name</Label>
              <Input
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Loan Amount</Label>
              <Input
                type="number"
                placeholder="Enter loan amount"
                value={formData.loanAmount}
                onChange={(e) => {
                  const amount = e.target.value
                  setFormData({ ...formData, loanAmount: amount })
                  // Check loan eligibility
                  if (!checkLoanEligibility(amount, formData.monthlyIncome)) {
                    toast({
                      title: "Loan Amount Too High",
                      description: "Your loan amount exceeds 40% of your monthly income. Please enter a lower amount.",
                      variant: "destructive",
                    })
                  }
                }}
                className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Return Amount (including 40% interest)</Label>
              <Input
                type="text"
                value={calculateReturnAmount(formData.loanAmount)}
                readOnly
                className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Return Date</Label>
              <Input
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Monthly Income</Label>
              <Input
                type="number"
                placeholder="Enter your monthly income"
                value={formData.monthlyIncome}
                onChange={(e) => {
                  const income = e.target.value
                  setFormData({ ...formData, monthlyIncome: income })
                  // Check loan eligibility
                  if (!checkLoanEligibility(formData.loanAmount, income)) {
                    toast({
                      title: "Loan Amount Too High",
                      description: "Your loan amount exceeds 40% of your monthly income. Please enter a lower amount.",
                      variant: "destructive",
                    })
                  }
                }}
                className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Loan Purpose</Label>
              <Input
                placeholder="Describe the purpose of your loan"
                value={formData.loanPurpose}
                onChange={(e) => setFormData({ ...formData, loanPurpose: e.target.value })}
                className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
              />
            </div>
      </div>
    )
      case 2:
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Bank Name</Label>
              <Select
                value={formData.bankName}
                onValueChange={(value) => setFormData({ ...formData, bankName: value })}
              >
                <SelectTrigger className="bg-white/5 border-0 text-sm h-9">
                  <SelectValue placeholder="Select Bank" />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-white/10">
                  <SelectItem value="fnb">FNB</SelectItem>
                  <SelectItem value="standard">Standard Bank</SelectItem>
                  <SelectItem value="absa">ABSA</SelectItem>
                  <SelectItem value="nedbank">Nedbank</SelectItem>
                  <SelectItem value="capitec">Capitec</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Account Number</Label>
              <Input
                placeholder="Enter your account number"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) => setFormData({ ...formData, accountType: value })}
              >
                <SelectTrigger className="bg-white/5 border-0 text-sm h-9">
                  <SelectValue placeholder="Select Account Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-white/10">
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      case 3:
    return (
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer group">
              <input
                type="file"
                id="bankStatement"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setFormData({ ...formData, bankStatement: file })
                  }
                }}
              />
              <label htmlFor="bankStatement" className="cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Bank Statements</p>
                    <p className="text-xs text-white/40">
                      {formData.bankStatement ? formData.bankStatement.name : 'Last 3 months required'}
                    </p>
                  </div>
                </div>
              </label>
            </div>

            <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer group">
              <input
                type="file"
                id="idDocument"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setFormData({ ...formData, proofOfId: file })
                  }
                }}
              />
              <label htmlFor="idDocument" className="cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="h-4 w-4 text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Proof of ID</p>
                    <p className="text-xs text-white/40">
                      {formData.proofOfId ? formData.proofOfId.name : 'Valid government ID required'}
                    </p>
                  </div>
                </div>
              </label>
            </div>

            <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer group">
              <input
                type="file"
                id="contract"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setFormData({ ...formData, employmentContract: file })
                  }
                }}
              />
              <label htmlFor="contract" className="cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Employment Contract</p>
                    <p className="text-xs text-white/40">
                      {formData.employmentContract ? formData.employmentContract.name : 'Optional document'}
                    </p>
                  </div>
                </div>
              </label>
            </div>
      </div>
    )
      default:
        return null
    }
  }

  const handleSignOut = () => {
    try {
      // Clear auth state
      authState.logout()
      
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userData')
      }
      
      // Redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Error during sign out:', error)
      // Still try to redirect even if there's an error
      window.location.href = '/'
    }
  }

  const validateInvestmentForm = () => {
    if (!investmentFormData) {
      toast({
        title: "Error",
        description: "Form data is not initialized",
        variant: "destructive",
      });
      return false;
    }

    if (!investmentFormData.fullName) {
      toast({
        title: "Missing Information",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return false;
    }

    if (!investmentFormData.investmentAmount) {
      toast({
        title: "Missing Information",
        description: "Please enter investment amount",
        variant: "destructive",
      });
      return false;
    }

    // Validate minimum investment amount
    const minInvestmentAmount = 1000;
    if (parseFloat(investmentFormData.investmentAmount) < minInvestmentAmount) {
      toast({
        title: "Invalid Amount",
        description: `Minimum investment amount is R${minInvestmentAmount}`,
        variant: "destructive",
      });
      return false;
    }

    if (!investmentFormData.investmentTerm) {
      toast({
        title: "Missing Information",
        description: "Please select investment term",
        variant: "destructive",
      });
      return false;
    }

    // Validate investment term
    const term = parseInt(investmentFormData.investmentTerm);
    if (term < 3 || term > 60) {
      toast({
        title: "Invalid Term",
        description: "Investment term must be between 3 and 60 months",
        variant: "destructive",
      });
      return false;
    }

    if (!investmentFormData.paymentProof) {
      toast({
        title: "Missing Information",
        description: "Please upload proof of payment",
        variant: "destructive",
      });
      return false;
    }

    // Validate file type and size
    const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (!allowedFileTypes.includes(investmentFormData.paymentProof.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG or PDF file",
        variant: "destructive",
      });
      return false;
    }

    if (investmentFormData.paymentProof.size > maxFileSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmitInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInvestmentForm()) {
      return;
    }

    setIsInvestmentSubmitting(true);
    setUploadProgress(0);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // First upload the payment proof
      const formData = new FormData();
      formData.append('file', investmentFormData.paymentProof!);
      formData.append('upload_preset', 'green_fina_uploads');

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload payment proof');
      }

      const uploadData = await uploadResponse.json();
      setUploadProgress(100);

      // Calculate expected return (simple calculation - can be adjusted based on your business logic)
      const amount = parseFloat(investmentFormData.investmentAmount);
      const term = parseInt(investmentFormData.investmentTerm);
      const annualReturn = amount * 0.15; // 15% annual return
      const monthlyReturn = annualReturn / 12;
      const totalExpectedReturn = amount + (annualReturn * (term / 12));

      // Create the investment
      const { data, error } = await supabaseRef.current
        .from('investments')
        .insert({
          user_id: user.id,
          amount: amount,
          investment_type: investmentFormData.investmentType,
          term: term,
          expected_return: totalExpectedReturn,
          payment_method: 'c', // Default to 'c' as per your schema
          full_name: investmentFormData.fullName,
          email: investmentFormData.email,
          phone: investmentFormData.phone,
          bank_name: investmentFormData.bankName,
          account_number: investmentFormData.accountNumber,
          account_type: investmentFormData.accountType,
          amount_return_annual: annualReturn,
          amount_return_monthly: monthlyReturn,
          payment_proof_url: uploadData.secure_url,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setUserInvestments(prev => [...prev, data]);
      
      // Reset form
      setInvestmentFormData({
        fullName: "",
        email: "",
        phone: "",
        bankName: "",
        accountNumber: "",
        accountType: "",
        investmentType: "j",
        investmentAmount: "",
        investmentTerm: "12",
        paymentProof: null
      });
      
      // Close the modal
      setIsInvestmentModalOpen(false);
      
      toast({
        title: "Success",
        description: "Investment submitted successfully!",
        variant: "default",
      });

      // Refresh investments list
      fetchUserInvestments();
    } catch (error) {
      console.error('Error submitting investment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to submit investment. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsInvestmentSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleWithdrawInvestment = async (investmentId: string) => {
    try {
      const { error } = await supabaseRef.current
        .from('investments')
        .update({ 
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString()
        })
        .eq('id', investmentId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Investment withdrawn successfully",
      })

      setIsWithdrawConfirmOpen(false)
      fetchUserInvestments()
    } catch (error) {
      console.error('Error withdrawing investment:', error)
      toast({
        title: "Error",
        description: "Failed to withdraw investment",
        variant: "destructive",
      })
    }
  }

  const handleCancelInvestment = async (investmentId: string) => {
    try {
      const { error } = await supabaseRef.current
        .from('investments')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', investmentId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Investment cancelled successfully",
      })

      setIsCancelConfirmOpen(false)
      fetchUserInvestments()
    } catch (error) {
      console.error('Error cancelling investment:', error)
      toast({
        title: "Error",
        description: "Failed to cancel investment",
        variant: "destructive",
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDateInWords = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    
    // Add ordinal suffix to day
    const ordinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${day}${ordinalSuffix(day)} of ${month} ${year}`;
  };

  const handleViewMemberDetails = (member: any) => {
    console.log('Viewing member details:', member);
    setSelectedMember(member);
    setIsMemberDetailsOpen(true);
    console.log('Dialog state:', { isMemberDetailsOpen: true, selectedMember: member });
  };

  const handlePayNow = (member: any) => {
    try {
      // First set the member
      setSelectedMemberForPayment(member);
      
      // Then reset the form
      setPaymentStep(1);
      setPaymentAmount("");
      setPaymentSignature("");
      setPaymentProof(null);
      
      // Finally open the dialog
      setIsPaymentDialogOpen(true);
      
      console.log('Payment dialog opened for member:', member);
    } catch (error) {
      console.error('Error opening payment dialog:', error);
      toast({
        title: "Error",
        description: "Failed to open payment dialog. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0])
    }
  }

  const handleSubmitPayment = async () => {
    if (!selectedMemberForPayment || !paymentAmount || !paymentSignature || !paymentProof) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingPayment(true)
    try {
      const { data: { session } } = await supabaseRef.current.auth.getSession()
      if (!session?.user) {
        toast({
          title: "Error",
          description: "You must be logged in to make a payment",
          variant: "destructive",
        })
        return
      }

      // Upload proof of payment to storage
      const fileExt = paymentProof.name.split('.').pop()
      const fileName = `${session.user.id}_${selectedMemberForPayment.id}_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabaseRef.current.storage
        .from('ducuments')  // This is the old bucket name
        .upload(`payment_proofs/${fileName}`, paymentProof)

      if (uploadError) {
        console.error('Error uploading payment proof:', uploadError)
        throw new Error('Failed to upload payment proof')
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabaseRef.current.storage
        .from('ducuments')  // This is the old bucket name
        .getPublicUrl(`payment_proofs/${fileName}`)

      // Get the position 1 member of the stokvela group
      const { data: positionOneMember, error: memberError } = await supabaseRef.current
        .from('stokvela_members')
        .select('*')
        .eq('group_id', selectedMemberForPayment.group_id)
        .eq('position', 1)
        .single()

      if (memberError) {
        console.error('Error fetching position 1 member:', memberError)
        throw new Error('Failed to fetch position 1 member')
      }

      // Get current amounts
      const { data: currentPayer, error: payerError } = await supabaseRef.current
        .from('stokvela_members')
        .select('amount_contibuted')
        .eq('user_id', session.user.id)
        .eq('group_id', selectedMemberForPayment.group_id)
        .single()

      if (payerError) {
        console.error('Error fetching current payer:', payerError)
        throw new Error('Failed to fetch current payer details')
      }

      const { data: currentReceiver, error: receiverError } = await supabaseRef.current
        .from('stokvela_members')
        .select('amount_received')
        .eq('id', positionOneMember.id)
        .single()

      if (receiverError) {
        console.error('Error fetching current receiver:', receiverError)
        throw new Error('Failed to fetch current receiver details')
      }

      // Update the payer's amount contributed (add to existing amount)
      const { error: updatePayerError } = await supabaseRef.current
        .from('stokvela_members')
        .update({ 
          amount_contibuted: (currentPayer.amount_contibuted || 0) + parseFloat(paymentAmount)
        })
        .eq('user_id', session.user.id)
        .eq('group_id', selectedMemberForPayment.group_id)

      if (updatePayerError) {
        console.error('Error updating payer amount:', updatePayerError)
        throw new Error('Failed to update payer amount')
      }

      // Update the position 1 member's amount received
      const { error: updateReceiverError } = await supabaseRef.current
        .from('stokvela_members')
        .update({ 
          amount_received: (currentReceiver.amount_received || 0) + parseFloat(paymentAmount)
        })
        .eq('id', positionOneMember.id)

      if (updateReceiverError) {
        console.error('Error updating receiver amount:', updateReceiverError)
        throw new Error('Failed to update receiver amount')
      }

      toast({
        title: "Success",
        description: "Payment submitted successfully",
      })

      // Reset form and close dialog
      setPaymentAmount('')
      setPaymentSignature('')
      setPaymentProof(null)
      setIsPaymentDialogOpen(false)
      setSelectedMemberForPayment(null)

      // Refresh the stokvela details
      if (selectedStokvela) {
        handleViewStokvelaDetails(selectedStokvela)
      }
    } catch (error) {
      console.error('Error submitting payment:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const handleNextPaymentStep = () => {
    if (paymentStep < 3) {
      setPaymentStep(paymentStep + 1)
    }
  }

  const handlePreviousPaymentStep = () => {
    if (paymentStep > 1) {
      setPaymentStep(paymentStep - 1)
    }
  }

  // Add new function to handle joining stokvela
  const handleJoinStokvela = (stokvela: any) => {
    setSelectedStokvelaForJoin(stokvela);
    setIsJoinFormOpen(true);
  };

  // Add new function to handle form submission
  const handleSubmitJoinForm = async () => {
    try {
      const userId = authState.getUserId();
      if (!userId || !selectedStokvelaForJoin) {
        toast({
          title: "Error",
          description: "Missing required information",
          variant: "destructive",
        });
        return;
      }

      // Validate form data
      if (!joinFormData.names || !joinFormData.email || !joinFormData.cellphone_number || 
          !joinFormData.account_number || !joinFormData.account_name || !joinFormData.account_type) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Get the next available position
      const { data: members } = await supabaseRef.current
        .from('stokvela_members')
        .select('position')
        .eq('group_id', selectedStokvelaForJoin.id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = members && members.length > 0 ? members[0].position + 1 : 1;

      // Add user as a member
      const { error } = await supabaseRef.current
        .from('stokvela_members')
        .insert({
          user_id: userId,
          group_id: selectedStokvelaForJoin.id,
          role: 'user',
          joined_at: new Date().toISOString(),
          amount_contibuted: 0,
          amount_received: 0,
          names: joinFormData.names,
          position: nextPosition,
          account_number: joinFormData.account_number,
          account_name: joinFormData.account_name,
          account_type: joinFormData.account_type,
          verified: 0,
          cellphone_number: joinFormData.cellphone_number,
          email: joinFormData.email
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "You have successfully joined the stokvela group",
      });

      // Reset form and close dialog
      setJoinFormData({
        names: '',
        email: '',
        cellphone_number: '',
        account_number: '',
        account_name: '',
        account_type: ''
      });
      setIsJoinFormOpen(false);
      setSelectedStokvelaForJoin(null);

      // Refresh the stokvelas list by calling the function from the parent scope
      const { data: updatedStokvelas } = await supabaseRef.current
        .from('stokvela_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (updatedStokvelas) {
        setUserStokvelas(updatedStokvelas);
      }
    } catch (error) {
      console.error('Error joining stokvela:', error);
      toast({
        title: "Error",
        description: "Failed to join stokvela group. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className="p-4 border-b border-white/10 mt-16">
        <div className="flex justify-between items-center">
            <div>
            <h1 className="text-xl font-semibold text-sky-400">Welcome back, {userProfile?.full_name || 'User'}!</h1>
            <p className="text-sm text-sky-400/80">Here's an overview of your loan spaces.</p>
          </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-green-500 text-white">
                    {getUserInitial(userProfile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userProfile?.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Update Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsPasswordModalOpen(true)}>
                <Key className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      <div className="flex justify-center items-center space-x-4 mb-8">
          <button 
            onClick={() => setIsLoanModalOpen(true)}
          className="w-40 px-4 py-2 bg-gradient-to-r from-green-500 via-green-400 to-green-600 text-white rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 group relative overflow-hidden"
          >
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-transparent animate-pulse"></div>
          <svg className="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold relative z-10">Apply Loan</span>
          </button>
          <button 
            onClick={() => setIsInvestmentModalOpen(true)}
          className="w-40 px-4 py-2 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 text-white rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 group relative overflow-hidden"
          >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-transparent animate-pulse"></div>
          <svg className="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-sm font-semibold relative z-10">Invest</span>
          </button>
        </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Loan Overview</h2>
          </div>
          <p className="text-xs text-white/60">month to view details</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('stokvela')}
            className={`px-3 py-1.5 text-xs text-white rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'stokvela' ? 'bg-orange-500' : 'bg-[#1A1A1A]'
            }`}
          >
            Stokvela Groups
          </button>
          <button 
            onClick={() => setActiveTab('investments')}
            className={`px-3 py-1.5 text-xs text-white rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'investments' ? 'bg-orange-500' : 'bg-[#1A1A1A]'
            }`}
          >
            Investments
          </button>
          <button 
            onClick={() => setActiveTab('loans')}
            className={`px-3 py-1.5 text-xs text-white rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'loans' ? 'bg-orange-500' : 'bg-[#1A1A1A]'
            }`}
          >
            Loans
          </button>
        </div>

        {/* Loan Overview Section */}
        {activeTab === 'loans' && (
          <div className="space-y-4">
            {/* Futuristic Circle Display */}
            <div className="relative w-64 h-64 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-pulse"></div>
              <div className="absolute inset-4 rounded-full border-4 border-orange-500/40 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="absolute inset-8 rounded-full border-4 border-orange-500/60 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-orange-500">{loanStats.total}</span>
                <span className="text-sm text-white/60">Total Loans</span>
              </div>
            </div>

            {/* Loan Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-[#1A1A1A] p-3 rounded-lg">
                <div className="text-orange-500 font-medium">{loanStats.pending}</div>
                <div className="text-xs text-white/60">Pending</div>
              </div>
              <div className="bg-[#1A1A1A] p-3 rounded-lg">
                <div className="text-green-500 font-medium">{loanStats.approved}</div>
                <div className="text-xs text-white/60">Approved</div>
              </div>
              <div className="bg-[#1A1A1A] p-3 rounded-lg">
                <div className="text-red-500 font-medium">{loanStats.rejected}</div>
                <div className="text-xs text-white/60">Rejected</div>
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <Button 
                onClick={() => setShowAllLoans(!showAllLoans)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {showAllLoans ? 'Hide Loans' : 'View All Loans'}
              </Button>
            </div>

            {/* Loans List */}
            {showAllLoans && (
              <div className="space-y-3">
                {/* Filter Controls */}
                <div className="flex justify-center gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px] bg-[#1A1A1A] border-white/10">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="paid_back">Paid Back</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDate} onValueChange={setFilterDate}>
                    <SelectTrigger className="w-[140px] bg-[#1A1A1A] border-white/10">
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10">
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoadingLoans ? (
                  <div className="flex justify-center">
                    <div className="h-8 w-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                  </div>
                ) : userLoans.length === 0 ? (
                  <div className="text-center text-white/60">No loan applications found</div>
                ) : (
                  userLoans
                    .filter(loan => {
                      if (filterStatus !== 'all' && loan.status !== filterStatus) return false
                      if (filterDate === 'all') return true
                      
                      const loanDate = new Date(loan.created_at)
                      const now = new Date()
                      
                      switch (filterDate) {
                        case 'today':
                          return loanDate.toDateString() === now.toDateString()
                        case 'week':
                          const weekAgo = new Date(now.setDate(now.getDate() - 7))
                          return loanDate >= weekAgo
                        case 'month':
                          const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
                          return loanDate >= monthAgo
                        default:
                          return true
                      }
                    })
                    .map((loan) => (
                      <div key={loan.id} className="bg-[#1A1A1A] p-3 rounded-lg">
                        <div className="flex items-center justify-between">
            <div>
                            <p className="text-sm font-medium">R {loan.amount}</p>
                            <p className="text-xs text-white/60">{loan.purpose}</p>
                            <p className="text-xs text-white/60">
                              Status: <span className={`${loan.status === 'pending' ? 'text-orange-500' : loan.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                                {loan.status}
                              </span>
                            </p>
                            <p className="text-xs text-white/40">
                              Applied: {new Date(loan.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewLoanDetails(loan)}
                              className="bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 hover:text-sky-400 border-sky-500/20"
                            >
                              View Details
                            </Button>
                            {loan.status === 'pending' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedLoan(loan)
                                  setIsWithdrawConfirmOpen(true)
                                }}
                              >
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Investment Overview Section */}
        {activeTab === 'investments' && (
          <div className="space-y-4">
            {/* Futuristic Circle Display */}
            <div className="relative w-64 h-64 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 animate-pulse"></div>
              <div className="absolute inset-4 rounded-full border-4 border-sky-500/40 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="absolute inset-8 rounded-full border-4 border-sky-500/60 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-sky-500">{userInvestments.length}</span>
                <span className="text-sm text-white/60">Total Investments</span>
              </div>
            </div>

            {/* Investment Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-[#1A1A1A] p-3 rounded-lg">
                <div className="text-sky-500 font-medium">
                  {userInvestments.filter(inv => inv.status === 'active').length}
                </div>
                <div className="text-xs text-white/60">Active</div>
              </div>
              <div className="bg-[#1A1A1A] p-3 rounded-lg">
                <div className="text-green-500 font-medium">
                  {userInvestments.filter(inv => inv.status === 'completed').length}
                </div>
                <div className="text-xs text-white/60">Completed</div>
              </div>
              <div className="bg-[#1A1A1A] p-3 rounded-lg">
                <div className="text-orange-500 font-medium">
                  {userInvestments.filter(inv => inv.status === 'pending').length}
                </div>
                <div className="text-xs text-white/60">Pending</div>
              </div>
            </div>

            {/* View All Button */}
            <div className="flex justify-center">
              <Button
                onClick={() => setShowAllInvestments(!showAllInvestments)}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                {showAllInvestments ? 'Hide Investments' : 'View All Investments'}
              </Button>
            </div>

            {/* Investments List */}
            {showAllInvestments && (
              <div className="space-y-3">
                {/* Filter Controls */}
                <div className="flex justify-center gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px] bg-[#1A1A1A] border-white/10">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDate} onValueChange={setFilterDate}>
                    <SelectTrigger className="w-[140px] bg-[#1A1A1A] border-white/10">
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10">
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoadingInvestments ? (
                  <div className="flex justify-center">
                    <div className="h-8 w-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                  </div>
                ) : userInvestments.length === 0 ? (
                  <div className="text-center text-white/60">No investments found</div>
                ) : (
                  userInvestments
                    .filter(investment => {
                      if (filterStatus !== 'all' && investment.status !== filterStatus) return false
                      if (filterDate === 'all') return true
                      
                      const investmentDate = new Date(investment.createdAt)
                      const now = new Date()
                      
                      switch (filterDate) {
                        case 'today':
                          return investmentDate.toDateString() === now.toDateString()
                        case 'week':
                          const weekAgo = new Date(now.setDate(now.getDate() - 7))
                          return investmentDate >= weekAgo
                        case 'month':
                          const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
                          return investmentDate >= monthAgo
                        default:
                          return true
                      }
                    })
                    .map((investment) => (
                      <div key={investment.id} className="bg-[#1A1A1A] p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">R {investment.amount.toLocaleString()}</p>
                            <p className="text-xs text-white/60">
                              {investment.investment_type === 'j' ? 'Joint Investment' : 
                               investment.investment_type === 'i' ? 'Individual Investment' : 
                               investment.investment_type === 'fixed' ? 'Fixed Term' : 
                               investment.investment_type === 'flexible' ? 'Flexible' : 
                               investment.investment_type}
                            </p>
                            <p className="text-xs text-white/60">
                              Status: <span className={`${
                                investment.status === 'pending' ? 'text-orange-500' : 
                                investment.status === 'active' ? 'text-sky-500' : 
                                investment.status === 'completed' ? 'text-green-500' : 
                                'text-red-500'
                              }`}>
                                {investment.status}
                              </span>
                            </p>
                            <p className="text-xs text-white/40">
                              Invested: {investment.createdAt ? new Date(investment.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedInvestment(investment)
                                setIsInvestmentDetailsOpen(true)
                              }}
                              className="text-white/60 hover:text-white"
                            >
                              View Details
                            </Button>
                            {investment.status === 'active' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedInvestment(investment)
                                  setIsWithdrawConfirmOpen(true)
                                }}
                              >
                                Withdraw
                              </Button>
                            )}
                            {investment.status === 'pending' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedInvestment(investment)
                                  setIsCancelConfirmOpen(true)
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Chart Area */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 mb-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Loan History & Limits</h3>
            
            {/* Loan Limit Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Monthly Loan Limit (30% of income)</span>
                <span>R {userProfile?.monthly_income ? (userProfile.monthly_income * 0.3).toFixed(2) : '0.00'}</span>
              </div>
              <div className="h-2 bg-[#111111] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-sky-400 rounded-full transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Monthly Loan History */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Monthly Loan Applications</span>
                <span>{userLoans.length} total</span>
              </div>
              <div className="h-32 flex items-end gap-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthLoans = userLoans.filter(loan => {
                    const loanDate = new Date(loan.created_at)
                    return loanDate.getMonth() === i
                  })
                  const approvedLoans = monthLoans.filter(loan => loan.status === 'approved')
                  const rejectedLoans = monthLoans.filter(loan => loan.status === 'rejected')
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="flex-1 w-full flex items-end gap-0.5">
                        <div 
                          className="w-full bg-green-500/50 rounded-t-sm transition-all duration-500"
                          style={{ height: `${(approvedLoans.length / Math.max(1, userLoans.length)) * 100}%` }}
                        />
                        <div 
                          className="w-full bg-red-500/50 rounded-t-sm transition-all duration-500"
                          style={{ height: `${(rejectedLoans.length / Math.max(1, userLoans.length)) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40 mt-1">
                        {new Date(2000, i).toLocaleString('default', { month: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500/50 rounded-sm" />
                  <span className="text-[10px] text-white/60">Approved</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-red-500/50 rounded-sm" />
                  <span className="text-[10px] text-white/60">Rejected</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-white mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {recentActivities.length === 0 ? (
              <div className="text-center text-white/60 py-4">No recent activities</div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="bg-[#1A1A1A] p-3 rounded-lg">
              <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.type === 'loan' ? 'bg-green-500/10' :
                      activity.type === 'investment' ? 'bg-sky-500/10' :
                      'bg-orange-500/10'
                    }`}>
                      {activity.type === 'loan' ? (
                        <FileText className={`h-4 w-4 ${
                          activity.status === 'approved' ? 'text-green-400' :
                          activity.status === 'pending' ? 'text-yellow-400' :
                          'text-red-400'
                        }`} />
                      ) : activity.type === 'investment' ? (
                        <TrendingUp className={`h-4 w-4 ${
                          activity.status === 'active' ? 'text-sky-400' :
                          activity.status === 'pending' ? 'text-yellow-400' :
                          'text-red-400'
                        }`} />
                      ) : (
                        <Users className={`h-4 w-4 ${
                          activity.status === 'verified' ? 'text-orange-400' :
                          'text-yellow-400'
                        }`} />
                      )}
                </div>
                <div className="flex-1">
                      <p className="text-xs font-medium text-white">{activity.title}</p>
                      <p className="text-[10px] text-white/60">
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)} • {
                          new Date(activity.timestamp).toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true
                          })
                        }
                      </p>
                </div>
                    <p className={`text-xs font-medium ${
                      activity.type === 'loan' ? 'text-green-400' :
                      activity.type === 'investment' ? 'text-sky-400' :
                      'text-orange-400'
                    }`}>
                      R{activity.amount.toLocaleString()}
                    </p>
              </div>
            </div>
              ))
            )}
                </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="bg-[#111111] text-white border-white/10 max-w-sm">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-medium flex items-center gap-2">
              <div className="h-4 w-1 bg-gradient-to-b from-green-400 to-sky-400"></div>
              Edit Profile
            </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsProfileModalOpen(false)}
                className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-white/60 text-xs">
              Update your personal information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input
                defaultValue={userProfile?.full_name || ''}
                className="bg-white/5 border-0 text-sm h-8"
                onChange={(e) => handleUpdateProfile({ full_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone Number</Label>
              <Input
                defaultValue={userProfile?.phone || ''}
                className="bg-white/5 border-0 text-sm h-8"
                onChange={(e) => handleUpdateProfile({ phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Address</Label>
              <Input
                defaultValue={userProfile?.address || ''}
                className="bg-white/5 border-0 text-sm h-8"
                onChange={(e) => handleUpdateProfile({ address: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <Button
              onClick={() => setIsProfileModalOpen(false)}
              className="bg-gradient-to-r from-green-400 to-sky-400 hover:from-green-500 hover:to-sky-500 h-8 text-xs"
            >
              Save Changes
                  </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="bg-[#111111] text-white border-white/10 max-w-sm">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-medium flex items-center gap-2">
              <div className="h-4 w-1 bg-gradient-to-b from-green-400 to-sky-400"></div>
              Change Password
            </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPasswordModalOpen(false)}
                className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-white/60 text-xs">
              Enter your current and new password
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Current Password</Label>
              <Input
                type="password"
                className="bg-white/5 border-0 text-sm h-8"
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">New Password</Label>
              <Input
                type="password"
                className="bg-white/5 border-0 text-sm h-8"
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Confirm New Password</Label>
              <Input
                type="password"
                className="bg-white/5 border-0 text-sm h-8"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <Button
              onClick={handleChangePassword}
              className="bg-gradient-to-r from-green-400 to-sky-400 hover:from-green-500 hover:to-sky-500 h-8 text-xs"
            >
              Update Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loan Application Modal */}
      <Dialog open={isLoanModalOpen} onOpenChange={setIsLoanModalOpen}>
        <DialogContent className="bg-[#111111] text-white border-white/10 max-w-md">
          <div className="absolute right-4 top-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsLoanModalOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
              <div className="h-6 w-1 bg-gradient-to-b from-green-400 to-sky-400"></div>
              Step {currentStep}/3
            </DialogTitle>
            <DialogDescription className="text-white/60 text-sm">
              {currentStep === 1 && "Quick Personal Details"}
              {currentStep === 2 && "Banking Information"}
              {currentStep === 3 && "Required Documents"}
            </DialogDescription>
          </DialogHeader>

          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-1">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step === currentStep
                      ? "bg-gradient-to-r from-green-400 to-sky-400 shadow-lg shadow-green-500/20"
                      : step < currentStep
                      ? "bg-green-500/20 text-green-400"
                      : "bg-white/5 text-white/40"
                  }`}
                >
                  {step === 1 && <User className="h-3 w-3" />}
                  {step === 2 && <Building2 className="h-3 w-3" />}
                  {step === 3 && <FileText className="h-3 w-3" />}
                </div>
                {step < 3 && (
                  <div className="w-8 h-0.5 bg-gradient-to-r from-green-400/20 to-sky-400/20"></div>
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="py-2">
            {currentStep === 1 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Full Name</Label>
                  <Input
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Loan Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter loan amount"
                    value={formData.loanAmount}
                    onChange={(e) => {
                      const amount = e.target.value
                      setFormData({ ...formData, loanAmount: amount })
                      // Check loan eligibility
                      if (!checkLoanEligibility(amount, formData.monthlyIncome)) {
                        toast({
                          title: "Loan Amount Too High",
                          description: "Your loan amount exceeds 40% of your monthly income. Please enter a lower amount.",
                          variant: "destructive",
                        })
                      }
                    }}
                    className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Return Amount (including 40% interest)</Label>
                  <Input
                    type="text"
                    value={calculateReturnAmount(formData.loanAmount)}
                    readOnly
                    className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Return Date</Label>
                  <Input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Monthly Income</Label>
                  <Input
                    type="number"
                    placeholder="Enter your monthly income"
                    value={formData.monthlyIncome}
                    onChange={(e) => {
                      const income = e.target.value
                      setFormData({ ...formData, monthlyIncome: income })
                      // Check loan eligibility
                      if (!checkLoanEligibility(formData.loanAmount, income)) {
                        toast({
                          title: "Loan Amount Too High",
                          description: "Your loan amount exceeds 40% of your monthly income. Please enter a lower amount.",
                          variant: "destructive",
                        })
                      }
                    }}
                    className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Loan Purpose</Label>
                  <Input
                    placeholder="Describe the purpose of your loan"
                    value={formData.loanPurpose}
                    onChange={(e) => setFormData({ ...formData, loanPurpose: e.target.value })}
                    className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Bank Name</Label>
                  <Select
                    value={formData.bankName}
                    onValueChange={(value) => setFormData({ ...formData, bankName: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-0 text-sm h-9">
                      <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10">
                      <SelectItem value="fnb">FNB</SelectItem>
                      <SelectItem value="standard">Standard Bank</SelectItem>
                      <SelectItem value="absa">ABSA</SelectItem>
                      <SelectItem value="nedbank">Nedbank</SelectItem>
                      <SelectItem value="capitec">Capitec</SelectItem>
                    </SelectContent>
                  </Select>
            </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Account Number</Label>
                  <Input
                    placeholder="Enter your account number"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="bg-white/5 border-0 text-sm h-9 placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Account Type</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-0 text-sm h-9">
                      <SelectValue placeholder="Select Account Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10">
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    id="bankStatement"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFormData({ ...formData, bankStatement: file })
                      }
                    }}
                  />
                  <label htmlFor="bankStatement" className="cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="h-4 w-4 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Bank Statements</p>
                        <p className="text-xs text-white/40">
                          {formData.bankStatement ? formData.bankStatement.name : 'Last 3 months required'}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    id="idDocument"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFormData({ ...formData, proofOfId: file })
                      }
                    }}
                  />
                  <label htmlFor="idDocument" className="cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="h-4 w-4 text-sky-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Proof of ID</p>
                        <p className="text-xs text-white/40">
                          {formData.proofOfId ? formData.proofOfId.name : 'Valid government ID required'}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    id="contract"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFormData({ ...formData, employmentContract: file })
                      }
                    }}
                  />
                  <label htmlFor="contract" className="cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Employment Contract</p>
                        <p className="text-xs text-white/40">
                          {formData.employmentContract ? formData.employmentContract.name : 'Optional document'}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 1}
              className="flex-1 border-0 bg-white/5 hover:bg-white/10 text-white text-sm h-9"
            >
              Back
                  </Button>
            <Button
              onClick={currentStep === 3 ? handleSubmitLoan : handleNextStep}
              className="flex-1 bg-gradient-to-r from-green-400 to-sky-400 hover:from-green-500 hover:to-sky-500 text-sm h-9"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : currentStep === 3 ? "Submit" : "Continue"}
                  </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Loan Details Dialog */}
      <Dialog open={isLoanDetailsOpen} onOpenChange={setIsLoanDetailsOpen}>
        <DialogContent className="bg-[#111111] text-white border-white/10 max-w-sm">
          <div className="absolute right-4 top-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsLoanDetailsOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Loan Details</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/60">Amount</p>
                  <p className="text-base font-medium">R {selectedLoan.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Return Amount</p>
                  <p className="text-base font-medium">R {selectedLoan.returning_amount}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Status</p>
                  <p className={`text-base font-medium ${
                    selectedLoan.status === 'pending' ? 'text-orange-500' : 
                    selectedLoan.status === 'approved' ? 'text-green-500' : 
                    'text-red-500'
                  }`}>
                    {selectedLoan.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Term</p>
                  <p className="text-base font-medium">{selectedLoan.term} days</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-white/60">Purpose</p>
                <p className="text-base font-medium">{selectedLoan.purpose}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Monthly Income</p>
                <p className="text-base font-medium">R {selectedLoan.monthly_income}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Employment Status</p>
                <p className="text-base font-medium">{selectedLoan.employment_status || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Application Date</p>
                <p className="text-base font-medium">
                  {new Date(selectedLoan.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdraw Confirmation Dialog */}
      <Dialog open={isWithdrawConfirmOpen} onOpenChange={setIsWithdrawConfirmOpen}>
        <DialogContent className="bg-[#111111] text-white border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Confirm Withdrawal</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to withdraw this loan?
            </DialogDescription>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="bg-[#1A1A1A] p-3 rounded-lg">
                <p className="text-sm font-medium">R {selectedLoan.amount}</p>
                <p className="text-xs text-white/60">{selectedLoan.purpose}</p>
                <p className="text-xs text-white/60">
                  Status: <span className="text-orange-500">{selectedLoan.status}</span>
                </p>
                <p className="text-xs text-white/40">
                  Applied: {new Date(selectedLoan.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsWithdrawConfirmOpen(false)}
                  className="border-white/10 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleWithdrawLoan(selectedLoan.id)}
                >
                  Confirm Withdrawal
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Investment Application Modal */}
      <Dialog open={isInvestmentModalOpen} onOpenChange={setIsInvestmentModalOpen}>
        <DialogContent className="sm:max-w-[350px] bg-[#111111] text-white border-white/10">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">New Investment</DialogTitle>
            <DialogDescription className="text-xs text-white/60">
              Fill in your investment details
            </DialogDescription>
          </DialogHeader>

          <div className="py-1 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Personal Details */}
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Full Name</Label>
                  <Input
                    placeholder="Enter your full name"
                    value={investmentFormData.fullName}
                    onChange={(e) => setInvestmentFormData({ ...investmentFormData, fullName: e.target.value })}
                  className="bg-white/5 border-0 text-xs h-7 placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Email</Label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={investmentFormData.email}
                    onChange={(e) => setInvestmentFormData({ ...investmentFormData, email: e.target.value })}
                  className="bg-white/5 border-0 text-xs h-7 placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                <Label className="text-xs text-white/60">Phone</Label>
                  <Input
                  placeholder="Enter your phone"
                  value={investmentFormData.phone}
                  onChange={(e) => setInvestmentFormData({ ...investmentFormData, phone: e.target.value })}
                  className="bg-white/5 border-0 text-xs h-7 placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                <Label className="text-xs text-white/60">Bank</Label>
                  <Select
                  value={investmentFormData.bankName}
                  onValueChange={(value) => setInvestmentFormData({ ...investmentFormData, bankName: value })}
                  >
                  <SelectTrigger className="bg-white/5 border-0 text-xs h-7">
                      <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10">
                      <SelectItem value="fnb">FNB</SelectItem>
                      <SelectItem value="standard">Standard Bank</SelectItem>
                      <SelectItem value="absa">ABSA</SelectItem>
                      <SelectItem value="nedbank">Nedbank</SelectItem>
                      <SelectItem value="capitec">Capitec</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Account Number</Label>
                  <Input
                  placeholder="Enter account number"
                  value={investmentFormData.accountNumber}
                  onChange={(e) => setInvestmentFormData({ ...investmentFormData, accountNumber: e.target.value })}
                  className="bg-white/5 border-0 text-xs h-7 placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Account Type</Label>
                  <Select
                  value={investmentFormData.accountType}
                  onValueChange={(value) => setInvestmentFormData({ ...investmentFormData, accountType: value })}
                  >
                  <SelectTrigger className="bg-white/5 border-0 text-xs h-7">
                    <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10">
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Investment Type</Label>
                  <Select
                  value={investmentFormData.investmentType}
                  onValueChange={(value) => setInvestmentFormData({ ...investmentFormData, investmentType: value })}
                  >
                  <SelectTrigger className="bg-white/5 border-0 text-xs h-7">
                    <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10">
                    <SelectItem value="fixed">Fixed Term</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                <Label className="text-xs text-white/60">Amount</Label>
                  <Input
                    type="number"
                  placeholder="Enter amount"
                  value={investmentFormData.investmentAmount}
                  onChange={(e) => setInvestmentFormData({ ...investmentFormData, investmentAmount: e.target.value })}
                  className="bg-white/5 border-0 text-xs h-7 placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                <Label className="text-xs text-white/60">Term</Label>
                  <Select
                  value={investmentFormData.investmentTerm}
                  onValueChange={(value) => setInvestmentFormData({ ...investmentFormData, investmentTerm: value })}
                  >
                  <SelectTrigger className="bg-white/5 border-0 text-xs h-7">
                      <SelectValue placeholder="Select Term" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10">
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-green-400 text-sm font-medium">R {investmentFormData.investmentAmount}</div>
                  <div className="text-xs text-white/60">Investment Amount</div>
                </div>

                <div className="space-y-1">
              <Label className="text-xs text-white/60">Proof of Payment</Label>
                  <Input
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setInvestmentFormData({ ...investmentFormData, paymentProof: e.target.files[0] })
                  }
                }}
                accept="image/*,.pdf"
                className="bg-white/5 border-0 text-xs h-7 placeholder:text-white/40"
              />
              <p className="text-xs text-white/40">
                Upload proof of your bank transfer
              </p>
                </div>

                <div className="text-xs text-white/60 text-center">
              Please make a direct bank transfer and upload the proof
                </div>
          </div>

          {/* Submit Button */}
          <div className="mt-2">
            <Button
              onClick={handleSubmitInvestment}
              className="w-full bg-gradient-to-r from-green-400 to-sky-400 hover:from-green-500 hover:to-sky-500 text-xs h-8"
              disabled={isInvestmentSubmitting}
            >
              {isInvestmentSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : "Submit Investment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Investment Details Dialog */}
      <Dialog open={isInvestmentDetailsOpen} onOpenChange={setIsInvestmentDetailsOpen}>
        <DialogContent className="bg-[#111111] text-white border-white/10 max-w-sm">
          <div className="absolute right-4 top-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsInvestmentDetailsOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Investment Details</DialogTitle>
          </DialogHeader>
          {selectedInvestment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/60">Amount</p>
                  <p className="text-base font-medium">R {selectedInvestment.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Expected Return</p>
                  <p className="text-base font-medium">R {selectedInvestment.expected_return}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Status</p>
                  <p className={`text-base font-medium ${
                    selectedInvestment.status === 'pending' ? 'text-orange-500' : 
                    selectedInvestment.status === 'active' ? 'text-sky-500' : 
                    selectedInvestment.status === 'completed' ? 'text-green-500' : 
                    'text-red-500'
                  }`}>
                    {selectedInvestment.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Term</p>
                  <p className="text-base font-medium">{selectedInvestment.term} months</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-white/60">Type</p>
                <p className="text-base font-medium">{selectedInvestment.investment_type}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Payment Method</p>
                <p className="text-base font-medium">{selectedInvestment.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Investment Date</p>
                <p className="text-base font-medium">
                  {new Date(selectedInvestment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdraw Confirmation Dialog */}
      <Dialog open={isWithdrawConfirmOpen} onOpenChange={setIsWithdrawConfirmOpen}>
        <DialogContent className="bg-[#111111] text-white border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Confirm Withdrawal</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to withdraw this investment?
            </DialogDescription>
          </DialogHeader>
          {selectedInvestment && (
            <div className="space-y-4">
              <div className="bg-[#1A1A1A] p-3 rounded-lg">
                <p className="text-sm font-medium">R {selectedInvestment.amount}</p>
                <p className="text-xs text-white/60">{selectedInvestment.investment_type}</p>
                <p className="text-xs text-white/60">
                  Status: <span className="text-sky-500">{selectedInvestment.status}</span>
                </p>
                <p className="text-xs text-white/40">
                  Invested: {new Date(selectedInvestment.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsWithdrawConfirmOpen(false)}
                  className="border-white/10 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleWithdrawInvestment(selectedInvestment.id)}
                >
                  Confirm Withdrawal
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <DialogContent className="bg-[#111111] text-white border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Confirm Cancellation</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to cancel this investment?
            </DialogDescription>
          </DialogHeader>
          {selectedInvestment && (
            <div className="space-y-4">
              <div className="bg-[#1A1A1A] p-3 rounded-lg">
                <p className="text-sm font-medium">R {selectedInvestment.amount}</p>
                <p className="text-xs text-white/60">{selectedInvestment.investment_type}</p>
                <p className="text-xs text-white/60">
                  Status: <span className="text-orange-500">{selectedInvestment.status}</span>
                </p>
                <p className="text-xs text-white/40">
                  Applied: {new Date(selectedInvestment.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCancelConfirmOpen(false)}
                  className="border-white/10 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleCancelInvestment(selectedInvestment.id)}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stokvela Overview Section */}
      {activeTab === 'stokvela' && (
        <div className="space-y-4">
          {/* Futuristic Circle Display */}
          <div className={`relative w-64 h-64 mx-auto stokvela-circle ${isMaximized ? 'maximized' : ''}`}>
            <div className="absolute inset-0 rounded-full border-4 border-green-500/20 animate-pulse"></div>
            <div className="absolute inset-4 rounded-full border-4 border-green-500/40 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute inset-8 rounded-full border-4 border-green-500/60 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-green-500">{userStokvelas.length}</span>
              <span className="text-sm text-white/60">Total Stokvelas</span>
            </div>
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab('loans')}
              className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
            {/* Maximize Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMaximized(!isMaximized)}
              className="absolute top-2 left-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* View All Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowAllStokvelas(!showAllStokvelas)}
              className="bg-green-500 hover:bg-green-600 text-white transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showAllStokvelas ? 'Hide Stokvelas' : 'View All Stokvelas'}
            </Button>
          </div>

          {/* Stokvelas List */}
          {showAllStokvelas && (
            <div className="space-y-3">
              {isLoadingStokvelas ? (
                <div className="flex justify-center">
                  <div className="h-8 w-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
                </div>
              ) : userStokvelas.length === 0 ? (
                <div className="text-center text-white/60">No stokvela groups found</div>
              ) : (
                userStokvelas.map((stokvela) => (
                  <div 
                    key={stokvela.id} 
                    className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700/30 p-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 dark:from-green-400/5 dark:to-emerald-400/5 group-hover:from-green-400/20 group-hover:to-emerald-400/20 transition-all duration-300"></div>
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-green-800 dark:text-green-300 tracking-wide">{stokvela.name}</h3>
                        <p className="text-sm text-green-700/80 dark:text-green-400/80">{stokvela.description}</p>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                            <span className="font-medium">Members:</span>
                            <span>{stokvela.member_count}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                            <span className="font-medium">Contribution:</span>
                            <span>R{stokvela.contribution_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                            <span className="font-medium">Target:</span>
                            <span>R{stokvela.target_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                            <span className="font-medium">Created:</span>
                            <span>{new Date(stokvela.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stokvela.is_member ? handleViewStokvelaDetails(stokvela) : handleJoinStokvela(stokvela)}
                        className={`${
                          stokvela.is_member 
                            ? "bg-white/50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-800/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50"
                            : "bg-green-500 hover:bg-green-600 text-white border-green-600"
                        } transition-all duration-300`}
                      >
                        {stokvela.is_member ? "View Members" : "Join Stokvela"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Stokvela Details Dialog */}
      <Dialog open={isStokvelaDetailsOpen} onOpenChange={setIsStokvelaDetailsOpen}>
        <DialogContent className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700/30 max-w-sm max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsStokvelaDetailsOpen(false)}
              className="absolute right-0 top-0 h-8 w-8 rounded-full hover:bg-white/30"
            >
              <X className="h-4 w-4 text-green-800 dark:text-green-300" />
            </Button>
            <DialogTitle className="text-lg font-medium text-green-800 dark:text-green-300 pr-8">Stokvela Members</DialogTitle>
            <DialogDescription className="text-green-700/80 dark:text-green-400/80">
              View all members of this stokvela group
            </DialogDescription>
          </DialogHeader>
          {selectedStokvela && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              <div className="bg-white/50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/30">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">Name</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{selectedStokvela.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">Target Amount</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">R {selectedStokvela.target_amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">Contribution</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">R {selectedStokvela.contribution_amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">Frequency</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{selectedStokvela.frequency}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-green-700/80 dark:text-green-400/80">Description</p>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 mt-1">{selectedStokvela.description}</p>
                </div>
              </div>

              {/* Members Section */}
              <div className="bg-white/50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/30">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Group Members</h3>
                {isLoadingMembers ? (
                  <div className="flex justify-center">
                    <div className="h-6 w-6 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
                  </div>
                ) : stokvelaMembers.length === 0 ? (
                  <p className="text-xs text-green-700/80 dark:text-green-400/80 text-center">No members found</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...stokvelaMembers]
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                      .map((member) => (
                        <div 
                          key={member.id} 
                          className={`relative flex flex-col p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02] aspect-square ${
                            member.position === 1 
                              ? 'bg-gradient-to-br from-green-500/40 to-green-600/40 border-green-400/60 shadow-lg shadow-green-500/30 backdrop-blur-sm' 
                              : member.position === 2
                              ? 'bg-gradient-to-br from-yellow-500/40 to-yellow-600/40 border-yellow-400/60 shadow-lg shadow-yellow-500/30 backdrop-blur-sm'
                              : member.position === 3
                              ? 'bg-gradient-to-br from-red-500/40 to-red-600/40 border-red-400/60 shadow-lg shadow-red-500/30 backdrop-blur-sm'
                              : 'bg-gradient-to-br from-blue-500/40 to-blue-600/40 border-blue-400/60 shadow-lg shadow-blue-500/30 backdrop-blur-sm'
                          }`}
                        >
                          {/* Position Badge */}
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md ${
                              member.position === 1 
                                ? 'bg-green-500/70 text-white' 
                                : member.position === 2
                                ? 'bg-yellow-500/70 text-white'
                                : member.position === 3
                                ? 'bg-red-500/70 text-white'
                                : 'bg-blue-500/70 text-white'
                            }`}>
                              Position {member.position || "N/A"}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              member.verified === 1 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                            }`}>
                              {member.verified === 1 ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Verified
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </span>
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedMember(member);
                                setIsMemberDetailsOpen(true);
                              }}
                              className="h-8 w-8 rounded-full hover:bg-white/30"
                            >
                              <Eye className="h-4 w-4 text-green-800 dark:text-green-300" />
                            </Button>
                          </div>

                          {/* Member Content */}
                          <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Avatar className="h-16 w-16 border-4 border-white/40 shadow-lg">
                              <AvatarFallback className={`text-lg ${
                                member.position === 1 
                                  ? 'bg-green-500/60 text-white' 
                                  : member.position === 2
                                  ? 'bg-yellow-500/60 text-white'
                                  : member.position === 3
                                  ? 'bg-red-500/60 text-white'
                                  : 'bg-blue-500/60 text-white'
                              }`}>
                                {getUserInitial(member.names || "Member")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                              <p className="text-base font-semibold text-black mb-1">
                                {member.names || "Anonymous Member"}
                                {member.email === userProfile?.email && (
                                  <span className="ml-2 text-xs text-orange-500 dark:text-orange-400">(This is you)</span>
                                )}
                              </p>
                              <p className="text-xs text-black/80">
                                {member.email}
                              </p>
                              <p className="text-xs text-black/60">
                                {member.cellphone_number}
                              </p>
                              <p className="text-xs text-black/80 mt-1">
                                <span className="font-medium">Pay Day:</span> {member.receiving_date ? formatDateInWords(member.receiving_date) : "Not set"}
                              </p>
                              {member.position === 1 ? (
                                <p className="text-xs text-black/80 mt-1">
                                  <span className="font-medium">Amount Received:</span> R {member.amount_received || 0}
                                </p>
                              ) : (
                                <p className="text-xs text-black/80 mt-1">
                                  <span className="font-medium">Amount Contributed:</span> R {member.amount_contibuted || 0}
                                </p>
                              )}
                            </div>
                              {member.position === 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePayNow(member)}
                                  className="bg-green-500 hover:bg-green-600 text-white border-green-600"
                                >
                                  Pay Now
                                </Button>
                              )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Member Details Dialog */}
      <Dialog open={isMemberDetailsOpen} onOpenChange={setIsMemberDetailsOpen}>
        <DialogContent className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700/30 max-w-sm max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMemberDetailsOpen(false)}
              className="absolute right-0 top-0 h-8 w-8 rounded-full hover:bg-white/30"
            >
              <X className="h-4 w-4 text-green-800 dark:text-green-300" />
            </Button>
            <DialogTitle className="text-lg font-medium text-green-800 dark:text-green-300 pr-8">Member Details</DialogTitle>
            <DialogDescription className="text-green-700/80 dark:text-green-400/80">
              View member information and verification status
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              <div className="bg-white/50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/30">
                <div className="flex items-center justify-center mb-4">
                  <Avatar className="h-20 w-20 border-4 border-white/40 shadow-lg">
                    <AvatarFallback className="text-2xl bg-green-500/60 text-white">
                      {getUserInitial(selectedMember.names || "Member")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                    {selectedMember.names || "Anonymous Member"}
                    {selectedMember.user_id === user?.id && (
                      <span className="ml-2 text-xs text-orange-500 dark:text-orange-400">(This is you)</span>
                    )}
                  </h3>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-2 ${
                        selectedMember.verified === 1 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      }`}>
                    {selectedMember.verified === 1 ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified Member
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending Verification
                      </span>
                    )}
                      </span>
                    </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">Position</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Position {selectedMember.position || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">Joined Date</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      {selectedMember.joined_at ? new Date(selectedMember.joined_at).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">Account Number</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{selectedMember.account_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">Account Name</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{selectedMember.account_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">Account Type</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{selectedMember.account_type || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">Receiving Date</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      {selectedMember.receiving_date ? formatDateInWords(selectedMember.receiving_date) : "Not set"}
                    </p>
                  </div>
                    <div>
                      <p className="text-xs text-green-700/80 dark:text-green-400/80">Amount Contributed</p>
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">R {selectedMember.amount_contibuted || 0}</p>
                    </div>
                    <div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">Phone Number</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{selectedMember.cellphone_number || "N/A"}</p>
                    </div>
                  <div>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80">Email Address</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{selectedMember.email || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              {paymentStep === 1 && "Enter payment details"}
              {paymentStep === 2 && "Upload proof of payment"}
              {paymentStep === 3 && "Review and confirm payment"}
            </DialogDescription>
          </DialogHeader>

          {paymentStep === 1 && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signature">Signature</Label>
                <Input
                  id="signature"
                  value={paymentSignature}
                  onChange={(e) => setPaymentSignature(e.target.value)}
                  placeholder="Enter your signature"
                />
              </div>
            </div>
          )}

          {paymentStep === 2 && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="proof">Proof of Payment</Label>
                <Input
                  id="proof"
                  type="file"
                  onChange={handlePaymentProofChange}
                  accept="image/*,.pdf"
                />
              </div>
            </div>
          )}

          {paymentStep === 3 && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Payment Summary</Label>
                <div className="rounded-lg border p-4">
                  <p><strong>Amount:</strong> R{paymentAmount}</p>
                  <p><strong>Signature:</strong> {paymentSignature}</p>
                  <p><strong>Proof:</strong> {paymentProof?.name || 'Not uploaded'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {paymentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePreviousPaymentStep}
                disabled={isSubmittingPayment}
              >
                Previous
              </Button>
            )}
            {paymentStep < 3 ? (
              <Button
                className="ml-auto"
                onClick={handleNextPaymentStep}
                disabled={
                  (paymentStep === 1 && (!paymentAmount || !paymentSignature)) ||
                  (paymentStep === 2 && !paymentProof) ||
                  isSubmittingPayment
                }
              >
                Next
              </Button>
            ) : (
              <Button
                className="ml-auto"
                onClick={handleSubmitPayment}
                disabled={isSubmittingPayment}
              >
                {isSubmittingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Payment'
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md bg-[#111111] text-white border-white/10">
          <DialogHeader>
            <DialogTitle className="text-green-500 text-xl">Loan Application Submitted!</DialogTitle>
            <DialogDescription className="text-white/70">
              Confirmation email sent successfully to: {userEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-white/60">Your loan application has been received and is currently under review. We will notify you once a decision has been made.</p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="bg-gradient-to-r from-green-400 to-sky-400 hover:from-green-500 hover:to-sky-500 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Join Form Dialog */}
      <Dialog open={isJoinFormOpen} onOpenChange={setIsJoinFormOpen}>
        <DialogContent className="bg-gradient-to-br from-green-900/90 to-green-800/90 backdrop-blur-sm text-green-100 border-green-500/20 max-w-sm p-6 rounded-xl shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Join Stokvela Group</DialogTitle>
            <DialogDescription className="text-green-300/80 text-sm">
              Complete your details to join
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="col-span-2">
              <Label htmlFor="names" className="text-xs font-medium text-green-300/90">Full Name</Label>
              <Input
                id="names"
                value={joinFormData.names}
                onChange={(e) => setJoinFormData({ ...joinFormData, names: e.target.value })}
                placeholder="Enter name"
                className="bg-green-900/30 border-green-500/20 text-green-100 placeholder:text-green-500/40 h-9 text-sm"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="email" className="text-xs font-medium text-green-300/90">Email</Label>
              <Input
                id="email"
                type="email"
                value={joinFormData.email}
                onChange={(e) => setJoinFormData({ ...joinFormData, email: e.target.value })}
                placeholder="Enter email"
                className="bg-green-900/30 border-green-500/20 text-green-100 placeholder:text-green-500/40 h-9 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="cellphone" className="text-xs font-medium text-green-300/90">Phone</Label>
              <Input
                id="cellphone"
                value={joinFormData.cellphone_number}
                onChange={(e) => setJoinFormData({ ...joinFormData, cellphone_number: e.target.value })}
                placeholder="Cell number"
                className="bg-green-900/30 border-green-500/20 text-green-100 placeholder:text-green-500/40 h-9 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="account_number" className="text-xs font-medium text-green-300/90">Account No.</Label>
              <Input
                id="account_number"
                value={joinFormData.account_number}
                onChange={(e) => setJoinFormData({ ...joinFormData, account_number: e.target.value })}
                placeholder="Acc number"
                className="bg-green-900/30 border-green-500/20 text-green-100 placeholder:text-green-500/40 h-9 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="account_name" className="text-xs font-medium text-green-300/90">Account Name</Label>
              <Input
                id="account_name"
                value={joinFormData.account_name}
                onChange={(e) => setJoinFormData({ ...joinFormData, account_name: e.target.value })}
                placeholder="Acc name"
                className="bg-green-900/30 border-green-500/20 text-green-100 placeholder:text-green-500/40 h-9 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="account_type" className="text-xs font-medium text-green-300/90">Account Type</Label>
              <Select
                value={joinFormData.account_type}
                onValueChange={(value) => setJoinFormData({ ...joinFormData, account_type: value })}
              >
                <SelectTrigger className="bg-green-900/30 border-green-500/20 text-green-100 h-9 text-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-green-900/95 border-green-500/20">
                  <SelectItem value="SAVINGS" className="text-green-100 hover:bg-green-800/50">Savings</SelectItem>
                  <SelectItem value="CHEQUE" className="text-green-100 hover:bg-green-800/50">Cheque</SelectItem>
                  <SelectItem value="CURRENT" className="text-green-100 hover:bg-green-800/50">Current</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsJoinFormOpen(false)}
              className="bg-green-900/30 hover:bg-green-800/50 text-green-100 border-green-500/20 h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitJoinForm}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white h-9 text-sm"
            >
              Join Stokvela
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


