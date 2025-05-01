"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar-fixed"
import { AdminNavbar } from "@/components/admin/navbar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { authState } from '@/lib/auth-state'
import { format, differenceInDays, isToday, subDays, isSameMonth, parseISO, formatDistanceToNow, isAfter } from 'date-fns'
import { UserIcon } from '@heroicons/react/24/solid'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { BellIcon } from '@heroicons/react/24/outline'
import UserManagementModal from '@/components/admin/UserManagementModal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { sendEmail } from '../services/emailService'
import emailjs from '@emailjs/browser'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StokvelaGroupsModal } from "@/components/admin/StokvelaGroupsModal"
import { InvestmentsModal } from "@/components/admin/InvestmentsModal"

interface DashboardStats {
  totalLoans: number
  approvedLoans: number
  rejectedLoans: number
  pendingLoans: number
  paidLoans: number
  totalBorrowed: number
  totalWithInterest: number
  moneyOut: number
  expectedProfit: number
  monthlyProfit: number
  annualProfit: number
  totalAmountAvailable: number
  totalAmount: number
  totalPaidAmount: number
}

interface StokvelaGroup {
  id: string
  name: string
  description: string
  target_amount: number
  contribution_amount: number
  frequency: string
  created_by: string
  created_at: string
  updated_at: string
}

interface LoanApplication {
  id: string
  user_id: string
  loan_type_id: string | null
  amount: string
  term: string
  purpose: string
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'ignored'
  bank_statement_url: string | null
  id_document_url: string | null
  contract_url: string | null
  additional_documents: any | null
  ai_recommendation: string | null
  ai_risk_score: number | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  returning_amount: string
  full_names: string | null
  employment_status: string
  monthly_income: string
  returning_date: string | null
  account_number: string | null
  account_name: string | null
  bank_name: string | null
  doubled_interests?: boolean
  email?: string
  cellphone_number?: string
  paid_loans_count?: number
}

interface User {
  id: string
  name: string
  email: string
  status: 'active' | 'disabled'
  role: string
  joinDate: string
  avatar?: string
}

interface TopClient {
  id: string
  name: string
  totalPaidLoans: number
  totalAmount: number
  reliability: number
  avatar?: string
}

interface MonthlyData {
  month: string;
  approved: number;
  paid: number;
  rejected: number;
  profit: number;
  total: number;
  isPrediction?: boolean;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [stats, setStats] = useState<DashboardStats>({
    totalLoans: 0,
    approvedLoans: 0,
    rejectedLoans: 0,
    pendingLoans: 0,
    paidLoans: 0,
    totalBorrowed: 0,
    totalWithInterest: 0,
    moneyOut: 0,
    expectedProfit: 0,
    monthlyProfit: 0,
    annualProfit: 0,
    totalAmountAvailable: 0,
    totalAmount: 0,
    totalPaidAmount: 0
  })
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [stokvelaGroups, setStokvelaGroups] = useState<StokvelaGroup[]>([])
  const [stokvelaMembers, setStokvelaMembers] = useState<any[]>([])
  const [showStokvelaModal, setShowStokvelaModal] = useState(false)
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedDocument, setSelectedDocument] = useState<{url: string, type: string} | null>(null)
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null)
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [monthOptions, setMonthOptions] = useState<string[]>([])
  const [chartType, setChartType] = useState<'bar' | 'line' | 'prediction'>('bar')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [showRecentLoans, setShowRecentLoans] = useState(false)
  const [recentLoans, setRecentLoans] = useState<LoanApplication[]>([])
  const [showInterestConfirmation, setShowInterestConfirmation] = useState(false)
  const [selectedLoanForInterest, setSelectedLoanForInterest] = useState<LoanApplication | null>(null)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [userAccounts, setUserAccounts] = useState<any[]>([])
  const [userFilter, setUserFilter] = useState('all')
  const [searchUser, setSearchUser] = useState('')
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    loanId: string;
    action: 'approve' | 'reject' | 'paid' | 'ignored' | 'pending';
  } | null>(null)
  const [isStokvelaGroupsOpen, setIsStokvelaGroupsOpen] = useState(false)
  const [isInvestmentsOpen, setIsInvestmentsOpen] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const { data: loanApplications, error } = await supabase
        .from('loan_applications')
        .select('*')

      if (error) {
        console.error('Error fetching loan applications:', error)
        return
      }

      if (!loanApplications) {
        console.error('No loan applications found')
        return
      }

      // Calculate stats from loan applications
      const approvedLoans = loanApplications.filter(loan => loan.status === 'approved')
      const pendingLoans = loanApplications.filter(loan => loan.status === 'pending')
      const rejectedLoans = loanApplications.filter(loan => loan.status === 'rejected')
      const paidLoans = loanApplications.filter(loan => loan.status === 'paid')
      const totalLoans = loanApplications.length

      // Calculate total paid amount
      const totalPaidAmount = paidLoans.reduce((sum, loan) => sum + parseFloat(loan.returning_amount), 0)

      // Calculate total borrowed amount (sum of approved loans)
      const totalBorrowed = approvedLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0)

      // Calculate total with interest based on loan amount
      const totalWithInterest = approvedLoans.reduce((sum, loan) => {
        const amount = parseFloat(loan.amount)
        const interest = amount <= 1000 ? 0.5 : 0.4 // 50% for <=1000, 40% for >1000
        return sum + (amount * (1 + interest))
      }, 0)

      // Calculate money out (sum of approved loans)
      const moneyOut = totalBorrowed

      // Calculate expected profit from approved loans
      const expectedProfit = totalWithInterest - moneyOut

      // Calculate profits from paid loans
      const paidLoansWithInterest = paidLoans.reduce((sum, loan) => {
        const amount = parseFloat(loan.amount)
        const interest = amount <= 1000 ? 0.5 : 0.4
        return sum + (amount * (1 + interest))
      }, 0)

      // Calculate monthly profit (assuming this is the current month's data)
      const monthlyProfit = paidLoansWithInterest - moneyOut

      // Calculate annual profit (assuming this is yearly data)
      const annualProfit = monthlyProfit * 12

      // Calculate total amount available (paid loans with interest minus money out)
      const totalAmountAvailable = paidLoansWithInterest - moneyOut

      // Calculate total amount (sum of approved and paid loans with interest)
      const totalAmount = [...approvedLoans, ...paidLoans].reduce((sum, loan) => {
        const amount = parseFloat(loan.amount)
        const interest = amount <= 1000 ? 0.5 : 0.4 // 50% for <=1000, 40% for >1000
        return sum + (amount * (1 + interest))
      }, 0)

      setStats({
        totalLoans,
        approvedLoans: approvedLoans.length,
        rejectedLoans: rejectedLoans.length,
        pendingLoans: pendingLoans.length,
        paidLoans: paidLoans.length,
        totalBorrowed,
        totalWithInterest,
        moneyOut,
        expectedProfit,
        monthlyProfit,
        annualProfit,
        totalAmountAvailable,
        totalAmount,
        totalPaidAmount
      })

      setLoanApplications(loanApplications)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  const fetchStokvelaGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('stokvela_groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStokvelaGroups(data || [])

      // Fetch all stokvela members
      const { data: members, error: membersError } = await supabase
        .from('stokvela_members')
        .select('*')
        .order('position', { ascending: true })

      if (membersError) throw membersError
      setStokvelaMembers(members || [])
    } catch (error) {
      console.error('Error fetching stokvela data:', error)
    }
  }

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const currentUser = authState.getUser()
        const userRole = authState.getUserRole()

        if (!currentUser) {
          router.push("/login")
          return
        }

        if (userRole !== "2") {
        router.push("/userDashboard")
        return
      }

        setUser(currentUser)
        await Promise.all([
          fetchDashboardData(),
          fetchStokvelaGroups()
        ])
      } catch (error) {
        console.error("Error checking admin status:", error)
        router.push("/login")
      }
    }

    checkAdminAccess()
  }, [router])

  // Sort loanApplications by created_at descending (most recent first)
  useEffect(() => {
    setLoanApplications(prev => [...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
  }, [loanApplications.length])

  useEffect(() => {
    const months = Array.from(new Set(
      loanApplications.map(loan => {
        const date = new Date(loan.created_at);
        return format(date, 'MMMM yyyy');
      })
    ));
    setMonthOptions(months);
  }, [loanApplications]);

  // Add effect to update recent loans
  useEffect(() => {
    const today = new Date()
    const recent = loanApplications.filter(loan => {
      const loanDate = new Date(loan.created_at)
      // Compare the dates without time
      return loanDate.toDateString() === today.toDateString()
    })
    
    setRecentLoans(recent)
  }, [loanApplications])

  const calculateRiskLevel = (loan: LoanApplication) => {
    const monthlyIncome = parseFloat(loan.monthly_income) || 0;
    const loanAmount = parseFloat(loan.amount) || 0;
    
    // Calculate total active loans for this user including current application
    const existingLoansAmount = loanApplications
      .filter(existingLoan => 
        existingLoan.user_id === loan.user_id && 
        (existingLoan.status === 'approved' || existingLoan.status === 'pending') &&
        !existingLoan.returning_date && // If there's no returning date, loan is still active
        existingLoan.id !== loan.id // Don't count the current loan
      )
      .reduce((total, existingLoan) => total + parseFloat(existingLoan.amount), 0);
    
    const totalLoanAmount = existingLoansAmount + loanAmount;
    
    // Calculate what percentage of monthly income the total loans represent
    const incomePercentage = (totalLoanAmount / monthlyIncome) * 100;
    
    // Risk assessment based on percentage of monthly income
    if (incomePercentage > 50) {
      return 'high';
    } else if (incomePercentage > 30) {
      return 'intermediate';
    }
    return 'low';
  }

  const sendStatusEmail = async (loan: LoanApplication, status: string) => {
    if (!loan.email) {
      console.warn('No email address found for loan application');
      return;
    }

    try {
      let emailSubject = 'Loan Application Status Update - Green Fina';
      let emailMessage = `Your loan application status has been updated to ${status}.`;

      if (status === 'paid') {
        emailSubject = 'Payment Confirmed - Green Fina';
        emailMessage = `Your loan payment of R${parseFloat(loan.amount).toLocaleString()} has been confirmed. Thank you for your payment.`;
      } else if (status === 'approved') {
        emailSubject = 'Loan Approved - Green Fina';
        emailMessage = 'Congratulations! Your loan has been approved.';
      } else if (status === 'rejected') {
        emailSubject = 'Loan Rejected - Green Fina';
        emailMessage = 'We are sorry to inform you that your loan has been rejected.';
      } else if (status === 'interests_updated') {
        emailSubject = 'Loan Interest Update - Green Fina';
        emailMessage = `The interest on your loan of R${parseFloat(loan.amount).toLocaleString()} has been updated. Your new returning amount is R${parseFloat(loan.returning_amount).toLocaleString()}.`;
      }

      const templateParams = {
        to_name: loan.full_names || 'Customer',
        to_email: loan.email,
        subject: emailSubject,
        message: emailMessage,
        loan_amount: parseFloat(loan.amount).toLocaleString(),
        total_amount: parseFloat(loan.returning_amount).toLocaleString(),
        due_date: loan.returning_date ? new Date(loan.returning_date).toLocaleDateString() : 'Not set',
        interests: ((parseFloat(loan.returning_amount) - parseFloat(loan.amount)) / parseFloat(loan.amount) * 100).toFixed(2),
        from_name: 'Green Fina Admin',
        from_email: 'admin@greenfina.com',
        reply_to: 'admin@greenfina.com'
      };

      console.log('Sending email with params:', templateParams);
      await sendEmail(templateParams);
      console.log('Email sent successfully');
      toast({
        title: "Email Sent",
        description: "Status update email has been sent to the applicant.",
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Error",
        description: "Status was updated but email notification failed.",
        variant: "destructive",
      });
    }
  };

  const handleLoanAction = async (loanId: string, action: 'approve' | 'reject' | 'paid' | 'ignored' | 'pending') => {
    setPendingAction({ loanId, action })
    setShowConfirmationDialog(true)
  }

  const confirmLoanAction = async () => {
    if (!pendingAction) return;

    const { loanId, action } = pendingAction;
    try {
      // Get the loan application
      const loanToUpdate = loanApplications.find(loan => loan.id === loanId);
      if (!loanToUpdate) {
        toast({
          title: "Error",
          description: "Loan application not found.",
          variant: "destructive",
        });
        return;
      }

      // Update the loan status
      const { error } = await supabase
        .from('loan_applications')
        .update({ status: action })
        .eq('id', loanId);

      if (error) throw error;

      // Send email notification for all status changes
      console.log('Sending email for status change:', action);
      await sendStatusEmail(loanToUpdate, action);

      // Show success toast with specific message based on action
      toast({
        title: "Success",
        description: `Loan has been ${action === 'paid' ? 'marked as paid' : action + 'd'} successfully.`,
        variant: "default",
      });

      // Refresh the data
      fetchDashboardData();
    } catch (error) {
      console.error(`Error ${action}ing loan:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} loan. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setShowConfirmationDialog(false);
      setPendingAction(null);
    }
  };

  const handleSignOut = async () => {
    try {
      authState.logout()
    router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/20'
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/20'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20'
    }
  }

  const handleViewDocument = (url: string | null, type: string, loan?: any) => {
    if (!url || !loan) return;

    try {
      // Extract the document name from the URL
      const pathParts = url.split('/');
      const documentName = pathParts[pathParts.length - 1];
      const userId = loan.user_id;

      // Construct the public Supabase URL
      const publicUrl = `https://xcdoyxwulynxrnvwdtxz.supabase.co/storage/v1/object/public/documents/${userId}/${documentName}`;
      window.open(publicUrl, '_blank');
    } catch (error) {
      console.error('Error handling document:', error);
      toast({
        title: "Error",
        description: "Failed to process document. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleDeleteDocument = async (url: string) => {
    try {
      const { error } = await supabase
        .storage
        .from('documents')
        .remove([url])

      if (error) {
        console.error('Error deleting document:', error)
        return
      }

      // Refresh the data after deletion
      fetchDashboardData()
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const filteredLoans = loanApplications.filter(loan => {
    const matchesSearch = loan.full_names?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter
    let matchesDate = true
    const createdAt = new Date(loan.created_at)
    if (dateFilter === 'today') {
      matchesDate = isToday(createdAt)
    } else if (dateFilter === '3days') {
      matchesDate = createdAt >= subDays(new Date(), 3)
    } else if (dateFilter.startsWith('month:')) {
      const monthYear = dateFilter.replace('month:', '')
      matchesDate = format(createdAt, 'MMMM yyyy') === monthYear
    }
    return matchesSearch && matchesStatus && matchesDate
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage)
  const paginatedLoans = filteredLoans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, dateFilter])

  const isRecentApplication = (date: string) => {
    const applicationDate = new Date(date);
    const now = new Date();
    const differenceInHours = (now.getTime() - applicationDate.getTime()) / (1000 * 60 * 60);
    return differenceInHours <= 24; // Consider applications within last 24 hours as recent
  }

  // Prepare monthly data
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const monthlyData = months.map((month, idx) => {
    const monthLoans = loanApplications.filter(loan => {
      const date = new Date(loan.created_at);
      return date.getFullYear() === currentYear && date.getMonth() === idx;
    });
    const approved = monthLoans.filter(l => l.status === 'approved').reduce((sum, l) => sum + parseFloat(l.amount), 0);
    const paid = monthLoans.filter(l => l.status === 'paid').reduce((sum, l) => sum + parseFloat(l.amount), 0);
    const rejected = monthLoans.filter(l => l.status === 'rejected').reduce((sum, l) => sum + parseFloat(l.amount), 0);
    const profit = monthLoans
      .filter(l => l.status === 'paid')
      .reduce((sum, l) => sum + (parseFloat(l.returning_amount) - parseFloat(l.amount)), 0);
    return {
      month,
      approved,
      paid,
      rejected,
      profit,
      total: approved + paid + rejected,
    };
  });

  // Generate prediction data for the next 2 years
  const generatePredictionData = () => {
    const predictionData: MonthlyData[] = [...monthlyData];
    const lastMonth = monthlyData[monthlyData.length - 1];
    
    // Calculate growth rates based on historical data
    const profitGrowthRate = monthlyData.reduce((sum, data, idx) => {
      if (idx === 0) return sum;
      const prevProfit = monthlyData[idx - 1].profit;
      return sum + (data.profit - prevProfit) / (prevProfit || 1);
    }, 0) / (monthlyData.length - 1);

    const approvedGrowthRate = monthlyData.reduce((sum, data, idx) => {
      if (idx === 0) return sum;
      const prevApproved = monthlyData[idx - 1].approved;
      return sum + (data.approved - prevApproved) / (prevApproved || 1);
    }, 0) / (monthlyData.length - 1);

    // Generate predictions for next 24 months
    for (let i = 1; i <= 24; i++) {
      const monthIndex = (lastMonth.month === 'December' ? 0 : months.indexOf(lastMonth.month) + 1) % 12;
      const year = currentYear + Math.floor((monthIndex + i) / 12);
      const month = months[(monthIndex + i) % 12];
      
      const predictedProfit = lastMonth.profit * Math.pow(1 + profitGrowthRate, i);
      const predictedApproved = lastMonth.approved * Math.pow(1 + approvedGrowthRate, i);
      const predictedPaid = predictedApproved * 0.8; // Assuming 80% of approved loans get paid
      const predictedRejected = predictedApproved * 0.2; // Assuming 20% rejection rate

      predictionData.push({
        month: `${month} ${year}`,
        approved: predictedApproved,
        paid: predictedPaid,
        rejected: predictedRejected,
        profit: predictedProfit,
        total: predictedApproved + predictedPaid + predictedRejected,
        isPrediction: true
      });
    }

    return predictionData;
  };

  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={48}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="month" stroke="#ffffff50" />
          <YAxis stroke="#ffffff50" tickFormatter={v => `R${v.toLocaleString()}`} />
          <Tooltip formatter={v => `R${v.toLocaleString()}`} contentStyle={{ backgroundColor: '#1B1B2C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#fff' }} />
          <Legend />
          <Bar dataKey="approved" fill="#22c55e" name="Approved" />
          <Bar dataKey="paid" fill="#0ea5e9" name="Paid" />
          <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
          <Bar dataKey="profit" fill="#facc15" name="Profit" />
        </BarChart>
      );
    } else if (chartType === 'line') {
      return (
        <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="month" stroke="#ffffff50" />
          <YAxis stroke="#ffffff50" tickFormatter={v => `R${v.toLocaleString()}`} />
          <Tooltip formatter={v => `R${v.toLocaleString()}`} contentStyle={{ backgroundColor: '#1B1B2C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#fff' }} />
          <Legend />
          <Line type="monotone" dataKey="approved" stroke="#22c55e" strokeWidth={2} name="Approved" strokeDasharray="0" />
          <Line type="monotone" dataKey="paid" stroke="#0ea5e9" strokeWidth={2} name="Paid" strokeDasharray="0" />
          <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" strokeDasharray="0" />
          <Line type="monotone" dataKey="profit" stroke="#facc15" strokeWidth={2} name="Profit" strokeDasharray="0" />
        </LineChart>
      );
    } else if (chartType === 'prediction') {
      const predictionData = generatePredictionData();
      return (
        <LineChart data={predictionData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="month" stroke="#ffffff50" />
          <YAxis stroke="#ffffff50" tickFormatter={v => `R${v.toLocaleString()}`} />
          <Tooltip 
            formatter={(v, name, props) => {
              const value = typeof v === 'number' ? v : 0;
              const isPrediction = props.payload.isPrediction;
              return [`R${value.toLocaleString()}${isPrediction ? ' (Predicted)' : ''}`, name];
            }} 
            contentStyle={{ backgroundColor: '#1B1B2C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
            itemStyle={{ color: '#fff' }} 
            labelStyle={{ color: '#fff' }} 
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="approved" 
            stroke="#22c55e" 
            strokeWidth={2} 
            name="Approved" 
            strokeDasharray="0" 
          />
          <Line 
            type="monotone" 
            dataKey="paid" 
            stroke="#0ea5e9" 
            strokeWidth={2} 
            name="Paid" 
            strokeDasharray="0" 
          />
          <Line 
            type="monotone" 
            dataKey="rejected" 
            stroke="#ef4444" 
            strokeWidth={2} 
            name="Rejected" 
            strokeDasharray="0" 
          />
          <Line 
            type="monotone" 
            dataKey="profit" 
            stroke="#facc15" 
            strokeWidth={2} 
            name="Profit" 
            strokeDasharray="0" 
          />
        </LineChart>
      );
    }
    return <div />;
  };

  const handleAddInterests = async (loan: LoanApplication) => {
    try {
      const amount = parseFloat(loan.amount);
      const returningAmount = parseFloat(loan.returning_amount);
      
      // Calculate the initial interest rate that was applied
      const initialInterestRate = (returningAmount - amount) / amount;
      
      // Calculate new returning amount with the same interest rate applied again
      const newReturningAmount = returningAmount * (1 + initialInterestRate);
      
      const { error } = await supabase
        .from('loan_applications')
        .update({ 
          returning_amount: newReturningAmount.toString(),
          doubled_interests: true
        })
        .eq('id', loan.id);

      if (error) throw error;

      // Send email notification for interest change
      await sendStatusEmail(loan, 'interests_updated');

      // Show success toast
      toast({
        title: "Interests Added",
        description: `New returning amount: R${newReturningAmount.toLocaleString()}`,
        variant: "default",
      });

      // Refresh the data
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding interests:', error);
      toast({
        title: "Error",
        description: "Failed to add interests. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch users_account for user management
  const fetchUserAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('users_account')
        .select('id, auth_id, full_name, email, user_role, created_at, updated_at, seen')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserAccounts(data || [])
    } catch (error) {
      console.error('Error fetching user accounts:', error)
    }
  }

  // Add to useEffect to fetch on open
  useEffect(() => {
    if (showUserManagement || showStokvelaModal) fetchUserAccounts()
  }, [showUserManagement, showStokvelaModal])

  // Helper for last sign in
  const isRecentSignIn = (lastSignIn: string) => {
    if (!lastSignIn) return false
    return isAfter(new Date(lastSignIn), subDays(new Date(), 3))
  }

  // Helper for role label
  const getRoleLabel = (role: string) => {
    if (role === '2') return 'Admin'
    if (role === '1') return 'Customer'
    if (role === '0') return 'Disabled'
    return 'Unknown'
  }

  // Disable user
  const handleDisableUser = async (id: string) => {
    await supabase.from('users_account').update({ user_role: '0' }).eq('id', id)
    fetchUserAccounts()
  }

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#1B1B2C]/95 to-[#1B1B2C]/90 backdrop-blur-xl flex flex-col overflow-hidden">
        <AdminNavbar />
        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar onSignOut={handleSignOut} />
          <div className="flex-1 ml-[4rem] lg:ml-[16.5rem] transition-all duration-300 overflow-y-auto">
            <main className="p-4 pt-24 max-w-[calc(100vw-4.5rem)] lg:max-w-[calc(100vw-17rem)]">
              {/* Loading Overlay */}
              <div className="fixed inset-0 bg-[#1B1B2C]/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-transparent to-orange-500/20 blur-xl animate-pulse"></div>
                    <div className="relative bg-[#1B1B2C] p-6 rounded-2xl border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)]">
                      <div className="w-16 h-16 relative">
                        <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-white/70 text-sm font-medium">Loading Dashboard Data...</div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <AdminSidebar 
        onSignOut={handleSignOut} 
        onUserManagementClick={() => setIsUserManagementOpen(true)}
        onStokvelaGroupsClick={() => setIsStokvelaGroupsOpen(true)}
        onInvestmentsClick={() => setIsInvestmentsOpen(true)}
      />
      <AdminNavbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 ml-[4rem] lg:ml-[16.5rem] transition-all duration-300 overflow-y-auto">
          <main className="p-4 pt-24 max-w-[calc(100vw-4.5rem)] lg:max-w-[calc(100vw-17rem)]">
            {/* Notification Icon */}
            <div className="fixed top-4 right-24 z-[100]">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-transparent"
                  onClick={() => setShowRecentLoans(!showRecentLoans)}
                >
                  <BellIcon className="h-8 w-8 text-gray-800" />
                  {recentLoans.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full" />
                  )}
                </Button>
                
                {/* Recent Loans Dropdown */}
                {showRecentLoans && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#1B1B2C] border border-white/10 rounded-lg shadow-lg overflow-hidden z-[101]">
                    <div className="p-3 border-b border-white/10">
                      <h3 className="text-white font-medium text-sm">Today's Loan Applications</h3>
                      {recentLoans.length === 0 && (
                        <p className="text-white/50 text-xs mt-1">No new loan applications today</p>
                      )}
                    </div>
                    {recentLoans.length > 0 && (
                      <div className="max-h-80 overflow-y-auto">
                        {recentLoans.map((loan) => (
                          <div
                            key={loan.id}
                            className="p-3 border-b border-white/10 hover:bg-white/5"
                          >
                            <div className="flex items-center justify-between mb-2">
            <div>
                                <p className="text-white font-medium text-sm">{loan.full_names || 'Unknown User'}</p>
                                <p className="text-white/70 text-xs">R{parseFloat(loan.amount).toLocaleString()}</p>
                              </div>
                              <Badge className={
                                loan.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                                loan.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                                loan.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                                loan.status === 'ignored' ? 'bg-gray-500/20 text-gray-400 border-gray-500/20' :
                                'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                              }>
                                {loan.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-white/50 text-xs">
                                {new Date(loan.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                onClick={() => {
                                  setSelectedLoan(loan)
                                  setShowRecentLoans(false)
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    </div>
              )}
            </div>
            </div>
            {/* Stats Cards */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-4 min-w-max">
                <Card className="bg-blue-500/10 backdrop-blur-xl border-[0.5px] border-blue-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 w-[300px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
                  <CardHeader className="pb-2 space-y-0 relative">
                    <CardTitle className="text-sm font-medium text-white/70">Total Approved Loans</CardTitle>
                </CardHeader>
                  <CardContent className="relative">
                    <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{stats.approvedLoans}</div>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-blue-500/20 text-blue-400 text-sm border border-blue-500/20">+11.01%</Badge>
                      <span className="text-xs text-white/50 ml-2">vs last month</span>
                    </div>
                </CardContent>
              </Card>

                <Card className="bg-emerald-500/10 backdrop-blur-xl border-[0.5px] border-emerald-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 w-[300px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
                  <CardHeader className="pb-2 space-y-0 relative">
                    <CardTitle className="text-sm font-medium text-white/70">Total Paid Loans</CardTitle>
                </CardHeader>
                  <CardContent className="relative">
                    <div className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">{stats.paidLoans}</div>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-sm border border-emerald-500/20">+15.2%</Badge>
                      <span className="text-xs text-white/50 ml-2">vs last month</span>
                    </div>
                </CardContent>
              </Card>

                <Card className="bg-yellow-500/10 backdrop-blur-xl border-[0.5px] border-yellow-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 w-[300px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
                  <CardHeader className="pb-2 space-y-0 relative">
                    <CardTitle className="text-sm font-medium text-white/70">Pending Loans</CardTitle>
                </CardHeader>
                  <CardContent className="relative">
                    <div className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">{stats.pendingLoans}</div>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-sm border border-yellow-500/20">+15.2%</Badge>
                      <span className="text-xs text-white/50 ml-2">vs last month</span>
                    </div>
                </CardContent>
              </Card>

                <Card className="bg-red-500/10 backdrop-blur-xl border-[0.5px] border-red-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 w-[300px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
                  <CardHeader className="pb-2 space-y-0 relative">
                    <CardTitle className="text-sm font-medium text-white/70">Rejected Loans</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors">{stats.rejectedLoans}</div>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-red-500/20 text-red-400 text-sm border border-red-500/20">+8.4%</Badge>
                      <span className="text-xs text-white/50 ml-2">vs last month</span>
            </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1B1B2C]/40 backdrop-blur-xl border-[0.5px] border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 w-[300px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
                  <CardHeader className="pb-2 space-y-0 relative">
                    <CardTitle className="text-sm font-medium text-white/70">Total Amount Available</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">R{stats.totalAmountAvailable.toLocaleString()}</div>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-green-500/20 text-green-400 text-sm border border-green-500/20">In Bank</Badge>
                      <span className="text-xs text-white/50 ml-2">Available for Loans</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-500/10 backdrop-blur-xl border-[0.5px] border-red-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 w-[300px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
                  <CardHeader className="pb-2 space-y-0 relative">
                    <CardTitle className="text-sm font-medium text-white/70">Money Out</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors">R{stats.moneyOut.toLocaleString()}</div>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-red-500/20 text-red-400 text-sm border border-red-500/20">Active Loans</Badge>
                      <span className="text-xs text-white/50 ml-2">Total Disbursed</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-500/10 backdrop-blur-xl border-[0.5px] border-purple-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 w-[300px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
                  <CardHeader className="pb-2 space-y-0 relative">
                    <CardTitle className="text-sm font-medium text-white/70">Expected Profit</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">R{stats.expectedProfit.toLocaleString()}</div>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-purple-500/20 text-purple-400 text-sm border border-purple-500/20">From Active Loans</Badge>
                      <span className="text-xs text-white/50 ml-2">When Paid</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-indigo-500/10 backdrop-blur-xl border-[0.5px] border-indigo-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 w-[300px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
                  <CardHeader className="pb-2 space-y-0 relative">
                    <CardTitle className="text-sm font-medium text-white/70">Total Amount</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">R{stats.totalAmount.toLocaleString()}</div>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-indigo-500/20 text-indigo-400 text-sm border border-indigo-500/20">All Loans</Badge>
                      <span className="text-xs text-white/50 ml-2">Including Interest</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Monthly Performance Chart */}
            <Card className="bg-[#1B1B2C]/40 backdrop-blur-xl border-[0.5px] border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
              <CardHeader className="relative">
                <CardTitle className="text-white/90 flex items-center justify-between">
                  Monthly Performance
                  <div className="flex flex-col gap-2 ml-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant={chartType === 'bar' ? 'default' : 'ghost'} onClick={() => setChartType('bar')}>Bar</Button>
                      <Button size="sm" variant={chartType === 'line' ? 'default' : 'ghost'} onClick={() => setChartType('line')}>Line</Button>
                    </div>
                    <Button size="sm" variant={chartType === 'prediction' ? 'default' : 'ghost'} onClick={() => setChartType('prediction')}>2-Year Prediction</Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                  </ResponsiveContainer>
                </div>
                {chartType === 'prediction' && (
                  <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-lg font-medium text-white mb-2">Business Growth Predictions</h3>
                    <p className="text-white/70 text-sm mb-4">Based on current growth rates and market trends:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Expected Annual Growth</span>
                          <Badge className="bg-green-500/20 text-green-400 border border-green-500/20">
                            +{Math.round(monthlyData.reduce((sum, data, idx) => {
                              if (idx === 0) return sum;
                              const prevProfit = monthlyData[idx - 1].profit;
                              return sum + (data.profit - prevProfit) / (prevProfit || 1);
                            }, 0) / (monthlyData.length - 1) * 12 * 100)}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Projected Annual Profit</span>
                          <span className="text-white">R{Math.round(monthlyData[monthlyData.length - 1].profit * 12 * (1 + monthlyData.reduce((sum, data, idx) => {
                            if (idx === 0) return sum;
                            const prevProfit = monthlyData[idx - 1].profit;
                            return sum + (data.profit - prevProfit) / (prevProfit || 1);
                          }, 0) / (monthlyData.length - 1))).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Loan Approval Rate</span>
                          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/20">
                            {Math.round(monthlyData.reduce((sum, data) => sum + data.approved, 0) / 
                              monthlyData.reduce((sum, data) => sum + data.approved + data.rejected, 0) * 100)}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Projected Annual Loans</span>
                          <span className="text-white">R{Math.round(monthlyData[monthlyData.length - 1].approved * 12 * (1 + monthlyData.reduce((sum, data, idx) => {
                            if (idx === 0) return sum;
                            const prevApproved = monthlyData[idx - 1].approved;
                            return sum + (data.approved - prevApproved) / (prevApproved || 1);
                          }, 0) / (monthlyData.length - 1))).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loan Applications */}
            <Card className="bg-[#1B1B2C]/40 backdrop-blur-xl border-[0.5px] border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
              <CardHeader className="relative">
                <CardTitle className="text-white/90">Loan Applications</CardTitle>
                <div className="flex flex-col gap-4 mt-4">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all" className="bg-[#1B1B2C] text-white">All Status</option>
                    <option value="pending" className="bg-[#1B1B2C] text-white">Pending</option>
                    <option value="approved" className="bg-[#1B1B2C] text-white">Approved</option>
                    <option value="rejected" className="bg-[#1B1B2C] text-white">Rejected</option>
                    <option value="paid" className="bg-[#1B1B2C] text-white">Paid</option>
                    <option value="ignored" className="bg-[#1B1B2C] text-white">Ignored</option>
                  </select>
                  <select
                    className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all" className="bg-[#1B1B2C] text-white">All Dates</option>
                    <option value="today" className="bg-[#1B1B2C] text-white">Today</option>
                    <option value="3days" className="bg-[#1B1B2C] text-white">Last 3 Days</option>
                    {monthOptions.map(month => (
                      <option key={month} value={`month:${month}`} className="bg-[#1B1B2C] text-white">{month}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <Table className="rounded-xl overflow-hidden shadow-xl bg-white/5 backdrop-blur-md border border-white/10">
                  <TableHeader className="bg-gradient-to-r from-orange-500/10 via-transparent to-white/5">
                    <TableRow className="hover:bg-white/5">
                      <TableHead className="text-white/70">Applicant</TableHead>
                      <TableHead className="text-white/70">Amount</TableHead>
                      <TableHead className="text-white/70">Returning Amount</TableHead>
                      <TableHead className="text-white/70">Monthly Income</TableHead>
                      <TableHead className="text-white/70">Returning Date</TableHead>
                      <TableHead className="text-white/70">Purpose</TableHead>
                      <TableHead className="text-white/70">Documents</TableHead>
                      <TableHead className="text-white/70">Status</TableHead>
                      <TableHead className="text-white/70">Risk Level</TableHead>
                      <TableHead className="text-white/70">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLoans.map((loan) => {
                      const isRecent = new Date(loan.created_at).toDateString() === new Date().toDateString();
                      return (
                        <TableRow 
                          key={loan.id} 
                          className={`hover:bg-orange-500/10 transition-all duration-200 ${isRecent ? 'bg-orange-500/10 border-l-4 border-l-orange-500' : ''}`}
                        >
                          <TableCell className="flex items-center gap-2">
                            <button
                              type="button"
                              className="focus:outline-none"
                              onClick={() => setSelectedLoan(loan)}
                              title="View loan details"
                            >
                              <Avatar className="border border-orange-400/40 bg-orange-500/30">
                                <AvatarFallback className="flex items-center justify-center w-full h-full bg-orange-500/80 text-orange-100">
                                  <span className="text-xl">👤</span>
                                </AvatarFallback>
                              </Avatar>
                            </button>
                            <div>
                              <div className="font-medium text-white flex items-center gap-2">
                                {loan.full_names || 'Unknown User'}
                                {loan.paid_loans_count && loan.paid_loans_count > 5 && (
                                  <span title="Top Client" className="text-yellow-400">👑</span>
                                )}
                                {isRecent && (
                                  <Badge className="ml-2 bg-orange-500/20 text-orange-400 border border-orange-500/20">
                                    Recent
                                  </Badge>
                                )}
                                {loan.doubled_interests && (
                                  <Badge className="ml-2 bg-red-500/20 text-red-400 border border-red-500/20">
                                    Doubled Interests
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">R{parseFloat(loan.amount).toLocaleString()}</TableCell>
                          <TableCell className="text-white">R{parseFloat(loan.returning_amount).toLocaleString()}</TableCell>
                          <TableCell className="text-white">R{parseFloat(loan.monthly_income).toLocaleString()}</TableCell>
                          <TableCell className="text-white">{loan.returning_date ? new Date(loan.returning_date).toLocaleDateString() : 'Not set'}</TableCell>
                          <TableCell className="text-white">{loan.purpose || 'Not specified'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {loan.bank_statement_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-400 hover:text-blue-300"
                                  onClick={() => handleViewDocument(loan.bank_statement_url, 'Bank Statement', loan)}
                                >
                                  Bank Statement
            </Button>
                              )}
                              {loan.id_document_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-400 hover:text-blue-300"
                                  onClick={() => handleViewDocument(loan.id_document_url, 'ID Document', loan)}
                                >
                                  ID Document
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              loan.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                              loan.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                              loan.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                              loan.status === 'ignored' ? 'bg-gray-500/20 text-gray-400 border-gray-500/20' :
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                            }>
                              {loan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRiskColor(calculateRiskLevel(loan))}>
                              {calculateRiskLevel(loan)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/10">
                                  <DotsHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#1B1B2C]/95 backdrop-blur-xl border-white/10">
                                <DropdownMenuItem className="text-white hover:bg-white/10" onClick={() => handleLoanAction(loan.id, 'approve')}>
                                  <Badge className="mr-2 bg-green-500/20 text-green-400 border border-green-500/20">Approved</Badge>
                                  Approve Loan
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-white hover:bg-white/10" onClick={() => handleLoanAction(loan.id, 'reject')}>
                                  <Badge className="mr-2 bg-red-500/20 text-red-400 border border-red-500/20">Rejected</Badge>
                                  Reject Loan
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-white hover:bg-white/10" onClick={() => handleLoanAction(loan.id, 'paid')}>
                                  <Badge className="mr-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Paid</Badge>
                                  Mark as Paid
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-white hover:bg-white/10" onClick={() => handleLoanAction(loan.id, 'ignored')}>
                                  <Badge className="mr-2 bg-gray-500/20 text-gray-400 border border-gray-500/20">Ignored</Badge>
                                  Ignore Loan
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-white hover:bg-white/10" 
                                  onClick={() => handleLoanAction(loan.id, 'pending')}
                                >
                                  <Badge className="mr-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Pending</Badge>
                                  Mark as Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-white hover:bg-white/10" 
                                  onClick={() => {
                                    setSelectedLoanForInterest(loan)
                                    setShowInterestConfirmation(true)
                                  }}
                                >
                                  <Badge className="mr-2 bg-orange-500/20 text-orange-400 border border-orange-500/20">Add Interests</Badge>
                                  Add Default Interests
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-white/50">
                    Showing {filteredLoans.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLoans.length)} of {filteredLoans.length} entries
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="text-white hover:bg-white/10"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="text-white hover:bg-white/10"
                    >
                      Next
                    </Button>
                  </div>
          </div>
        </CardContent>
      </Card>

            {/* Business Predictions */}
            <Card className="bg-[#1B1B2C]/40 backdrop-blur-xl border-[0.5px] border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
              <CardHeader className="relative">
                <CardTitle className="text-white/90">Business Predictions</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                    <h3 className="text-lg font-medium mb-2 text-white">June 2024 Projection</h3>
                    <p className="text-white/70 text-sm mb-4">Based on current growth rate and market trends:</p>
                    <ul className="mt-2 space-y-2">
                      <li className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-400 border border-green-500/20">
                          +{Math.round(monthlyData.reduce((sum, data, idx) => {
                            if (idx === 0) return sum;
                            const prevProfit = monthlyData[idx - 1].profit;
                            return sum + (data.profit - prevProfit) / (prevProfit || 1);
                          }, 0) / (monthlyData.length - 1) * 100)}%
                        </Badge>
                        <span className="text-white">Expected revenue: R{Math.round(monthlyData[monthlyData.length - 1].profit * (1 + monthlyData.reduce((sum, data, idx) => {
                          if (idx === 0) return sum;
                          const prevProfit = monthlyData[idx - 1].profit;
                          return sum + (data.profit - prevProfit) / (prevProfit || 1);
                        }, 0) / (monthlyData.length - 1))).toLocaleString()}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/20">
                          +{Math.round(monthlyData.reduce((sum, data, idx) => {
                            if (idx === 0) return sum;
                            const prevApproved = monthlyData[idx - 1].approved;
                            return sum + (data.approved - prevApproved) / (prevApproved || 1);
                          }, 0) / (monthlyData.length - 1) * 100)}%
                        </Badge>
                        <span className="text-white">New clients: {Math.round(loanApplications.filter(loan => loan.status === 'approved').length * (1 + monthlyData.reduce((sum, data, idx) => {
                          if (idx === 0) return sum;
                          const prevApproved = monthlyData[idx - 1].approved;
                          return sum + (data.approved - prevApproved) / (prevApproved || 1);
                        }, 0) / (monthlyData.length - 1)))}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/20">
                          +{Math.round(monthlyData.reduce((sum, data, idx) => {
                            if (idx === 0) return sum;
                            const prevApproved = monthlyData[idx - 1].approved;
                            return sum + (data.approved - prevApproved) / (prevApproved || 1);
                          }, 0) / (monthlyData.length - 1) * 100)}%
                        </Badge>
                        <span className="text-white">Loan volume: R{Math.round(monthlyData[monthlyData.length - 1].approved * (1 + monthlyData.reduce((sum, data, idx) => {
                          if (idx === 0) return sum;
                          const prevApproved = monthlyData[idx - 1].approved;
                          return sum + (data.approved - prevApproved) / (prevApproved || 1);
                        }, 0) / (monthlyData.length - 1))).toLocaleString()}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loan Details Modal */}
            {selectedLoan && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 pt-20">
                <div className="bg-[#1B1B2C] p-6 rounded-lg w-[350px] max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  <div className="flex justify-between items-start mb-6 sticky top-0 bg-[#1B1B2C] pb-4 z-10">
                    <div className="space-y-1">
                      <h3 className="text-white text-xl font-semibold">Loan Details</h3>
                      <p className="text-white/50 text-sm">Application #{selectedLoan.id.slice(0, 8)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-white/10 h-8 w-8 p-0"
                      onClick={() => setSelectedLoan(null)}
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-3">
                      <h4 className="text-white/70 text-sm font-medium uppercase tracking-wider border-b border-white/10 pb-2">Personal Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Applicant Name</span>
                          <span className="text-white">{selectedLoan.full_names || 'Unknown User'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Employment Status</span>
                          <span className="text-white">{selectedLoan.employment_status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Monthly Income</span>
                          <span className="text-white">R{parseFloat(selectedLoan.monthly_income).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-3">
                      <h4 className="text-white/70 text-sm font-medium uppercase tracking-wider border-b border-white/10 pb-2">Contact Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Email</span>
                          <span className="text-white">{selectedLoan.email || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Phone Number</span>
                          <span className="text-white">{selectedLoan.cellphone_number || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bank Information */}
                    <div className="space-y-3">
                      <h4 className="text-white/70 text-sm font-medium uppercase tracking-wider border-b border-white/10 pb-2">Bank Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Bank</span>
                          <span className="text-white">{selectedLoan.bank_name || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Account Number</span>
                          <span className="text-white">{selectedLoan.account_number || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Analysis */}
                    <div className="space-y-3">
                      <h4 className="text-white/70 text-sm font-medium uppercase tracking-wider border-b border-white/10 pb-2">AI Analysis</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between">
                              <span className="text-white/50 text-sm">AI Risk Score</span>
                              <Badge className={`${
                                (selectedLoan.ai_risk_score || 0) <= 30 ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                                (selectedLoan.ai_risk_score || 0) <= 70 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                                'bg-red-500/20 text-red-400 border-red-500/20'
                              }`}>
                                {selectedLoan.ai_risk_score || 'N/A'}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/50 text-sm">Risk Level</span>
                              <Badge className={getRiskColor(calculateRiskLevel(selectedLoan))}>
                                {calculateRiskLevel(selectedLoan)}
                              </Badge>
                            </div>
                            {selectedLoan.monthly_income && selectedLoan.amount && (
                              <div className="flex justify-between">
                                <span className="text-white/50 text-sm">Income Percentage</span>
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">
                                  {((parseFloat(selectedLoan.amount) / parseFloat(selectedLoan.monthly_income)) * 100).toFixed(1)}%
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="relative w-24 h-24">
                            <div className={`absolute inset-0 rounded-full ${
                              (selectedLoan.ai_risk_score || 0) <= 30 ? 'bg-green-500/10' :
                              (selectedLoan.ai_risk_score || 0) <= 70 ? 'bg-yellow-500/10' :
                              'bg-red-500/10'
                            }`}></div>
                            <div className={`absolute inset-2 rounded-full ${
                              (selectedLoan.ai_risk_score || 0) <= 30 ? 'bg-green-500/20' :
                              (selectedLoan.ai_risk_score || 0) <= 70 ? 'bg-yellow-500/20' :
                              'bg-red-500/20'
                            } backdrop-blur-sm flex items-center justify-center`}>
                              <div className="text-center">
                                <span className={`text-2xl font-bold ${
                                  (selectedLoan.ai_risk_score || 0) <= 30 ? 'text-green-400' :
                                  (selectedLoan.ai_risk_score || 0) <= 70 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>{selectedLoan.ai_risk_score || 0}%</span>
                                <span className="block text-xs text-white/50">Risk Score</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-white/50 text-sm">AI Recommendation</span>
                          <span className="text-white text-sm bg-white/5 p-3 rounded-md border border-white/10">
                            {selectedLoan.ai_recommendation || 'No recommendation available'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Loan Details */}
                    <div className="space-y-3">
                      <h4 className="text-white/70 text-sm font-medium uppercase tracking-wider border-b border-white/10 pb-2">Loan Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Loan Amount</span>
                          <span className="text-white">R{parseFloat(selectedLoan.amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Returning Amount</span>
                          <span className="text-white">R{parseFloat(selectedLoan.returning_amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Profit</span>
                          <span className="text-green-400">+R{(parseFloat(selectedLoan.returning_amount) - parseFloat(selectedLoan.amount)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Term</span>
                          <span className="text-white">{selectedLoan.term}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Purpose</span>
                          <span className="text-white">{selectedLoan.purpose || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Information */}
                    <div className="space-y-3">
                      <h4 className="text-white/70 text-sm font-medium uppercase tracking-wider border-b border-white/10 pb-2">Status Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Status</span>
                          <Badge className={
                            selectedLoan.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                            selectedLoan.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                            selectedLoan.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                            selectedLoan.status === 'ignored' ? 'bg-gray-500/20 text-gray-400 border-gray-500/20' :
                            'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                          }>
                            {selectedLoan.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Application Date</span>
                          <span className="text-white">{new Date(selectedLoan.created_at).toLocaleDateString('en-US', { 
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 text-sm">Returning Date</span>
                          <span className="text-white">{selectedLoan.returning_date ? 
                            new Date(selectedLoan.returning_date).toLocaleDateString('en-US', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            }) : 'Not set'}</span>
                        </div>
                        {selectedLoan.doubled_interests && (
                          <div className="flex justify-between">
                            <span className="text-white/50 text-sm">Interest Status</span>
                            <Badge className="bg-red-500/20 text-red-400 border border-red-500/20">
                              Interests Doubled
                            </Badge>
                          </div>
                        )}
                        {selectedLoan.returning_date && (
                          <div className="flex justify-between">
                            <span className="text-white/50 text-sm">Days Until Return</span>
                            <span className="text-white">
                              {(() => {
                                const days = differenceInDays(
                                  new Date(selectedLoan.returning_date),
                                  new Date(selectedLoan.created_at)
                                );
                                return days > 0 ? `The customer will return it in ${days} day${days !== 1 ? 's' : ''}` : 'Due today';
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-3">
                      <h4 className="text-white/70 text-sm font-medium uppercase tracking-wider border-b border-white/10 pb-2">Documents</h4>
                      <div className="flex gap-2">
                        {selectedLoan.bank_statement_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                            onClick={() => handleViewDocument(selectedLoan.bank_statement_url, 'Bank Statement', selectedLoan)}
                          >
                            Bank Statement
                          </Button>
                        )}
                        {selectedLoan.id_document_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                            onClick={() => handleViewDocument(selectedLoan.id_document_url, 'ID Document', selectedLoan)}
                          >
                            ID Document
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Loan Actions */}
                    <div className="space-y-3">
                      <h4 className="text-white/70 text-sm font-medium uppercase tracking-wider border-b border-white/10 pb-2">Loan Actions</h4>
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10">
                              Change Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1B1B2C]/95 backdrop-blur-xl border-white/10">
                            <DropdownMenuItem 
                              className="text-white hover:bg-white/10" 
                              onClick={() => handleLoanAction(selectedLoan.id, 'approve')}
                            >
                              <Badge className="mr-2 bg-green-500/20 text-green-400 border border-green-500/20">Approved</Badge>
                              Approve Loan
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-white hover:bg-white/10" 
                              onClick={() => handleLoanAction(selectedLoan.id, 'reject')}
                            >
                              <Badge className="mr-2 bg-red-500/20 text-red-400 border border-red-500/20">Rejected</Badge>
                              Reject Loan
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-white hover:bg-white/10" 
                              onClick={() => handleLoanAction(selectedLoan.id, 'paid')}
                            >
                              <Badge className="mr-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Paid</Badge>
                              Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-white hover:bg-white/10" 
                              onClick={() => handleLoanAction(selectedLoan.id, 'ignored')}
                            >
                              <Badge className="mr-2 bg-gray-500/20 text-gray-400 border border-gray-500/20">Ignored</Badge>
                              Ignore Loan
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-white hover:bg-white/10" 
                              onClick={() => handleLoanAction(selectedLoan.id, 'pending')}
                            >
                              <Badge className="mr-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Pending</Badge>
                              Mark as Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-white hover:bg-white/10" 
                              onClick={() => {
                                setSelectedLoanForInterest(selectedLoan)
                                setShowInterestConfirmation(true)
                              }}
                            >
                              <Badge className="mr-2 bg-orange-500/20 text-orange-400 border border-orange-500/20">Add Interests</Badge>
                              Add Default Interests
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interest Confirmation Dialog */}
            {showInterestConfirmation && selectedLoanForInterest && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#1B1B2C] p-6 rounded-lg w-[400px] max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-white text-xl font-semibold">Add Default Interests</h3>
                      <p className="text-white/50 text-sm">This will add the same interest rate again</p>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-white/10 h-8 w-8 p-0"
                      onClick={() => {
                        setShowInterestConfirmation(false)
                        setSelectedLoanForInterest(null)
                      }}
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/50">Current Amount:</span>
                          <span className="text-white">R{parseFloat(selectedLoanForInterest.amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Current Returning Amount:</span>
                          <span className="text-white">R{parseFloat(selectedLoanForInterest.returning_amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Initial Interest Rate:</span>
                          <span className="text-white">{(((parseFloat(selectedLoanForInterest.returning_amount) - parseFloat(selectedLoanForInterest.amount)) / parseFloat(selectedLoanForInterest.amount)) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-white/50">New Returning Amount:</span>
                          <span className="text-orange-400">R{(parseFloat(selectedLoanForInterest.returning_amount) * (1 + ((parseFloat(selectedLoanForInterest.returning_amount) - parseFloat(selectedLoanForInterest.amount)) / parseFloat(selectedLoanForInterest.amount)))).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        className="text-white hover:bg-white/10"
                        onClick={() => {
                          setShowInterestConfirmation(false)
                          setSelectedLoanForInterest(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => {
                          handleAddInterests(selectedLoanForInterest)
                          setShowInterestConfirmation(false)
                          setSelectedLoanForInterest(null)
                        }}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Management Modal */}
            {showUserManagement && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-[#1B1B2C] p-6 rounded-lg w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-white text-xl font-bold">User Management</h2>
                    <Button variant="ghost" className="text-white" onClick={() => setShowUserManagement(false)}>×</Button>
                  </div>
                  <div className="flex gap-4 mb-4">
                    <input type="text" placeholder="Search by name or email..." value={searchUser} onChange={e => setSearchUser(e.target.value)} className="px-3 py-2 rounded bg-white/10 text-white w-64" />
                    <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="px-3 py-2 rounded bg-white/10 text-white">
                      <option value="all">All Roles</option>
                      <option value="2">Admin</option>
                      <option value="1">Customer</option>
                      <option value="0">Disabled</option>
                    </select>
                  </div>
                  <table className="w-full text-white rounded overflow-hidden">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Sign Up Date</th>
                        <th className="p-2">Last Sign In</th>
                        <th className="p-2">Interaction Time</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userAccounts
                        .filter(u => (userFilter === 'all' || u.user_role === userFilter) && (u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase())))
                        .map(u => (
                          <tr key={u.id} className="border-b border-white/10">
                            <td className="p-2">{u.full_name}</td>
                            <td className="p-2">{u.email}</td>
                            <td className="p-2">{getRoleLabel(u.user_role)}</td>
                            <td className="p-2">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                            <td className="p-2">
                              {u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '-'}
                              {isRecentSignIn(u.updated_at) && <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Recent</span>}
                            </td>
                            <td className="p-2">{u.seen ? `${u.seen} min` : '-'}</td>
                            <td className="p-2">
                              {u.user_role !== '0' && <Button size="sm" className="bg-red-500/80" onClick={() => handleDisableUser(u.id)}>Disable</Button>}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        users={userAccounts}
        onUserFilterChange={setUserFilter}
        onSearchChange={setSearchUser}
        onDisableUser={handleDisableUser}
      />
      <StokvelaGroupsModal
        isOpen={isStokvelaGroupsOpen}
        onClose={() => setIsStokvelaGroupsOpen(false)}
        groups={stokvelaGroups}
        users={userAccounts}
        members={stokvelaMembers}
      />
      <InvestmentsModal
        isOpen={isInvestmentsOpen}
        onClose={() => setIsInvestmentsOpen(false)}
      />

      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent className="bg-[#1B1B2C] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {pendingAction?.action === 'approve' ? 'Approve Loan' :
               pendingAction?.action === 'reject' ? 'Reject Loan' :
               pendingAction?.action === 'paid' ? 'Mark as Paid' :
               'Change Loan Status'}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {pendingAction?.action === 'approve' ? 'Are you sure you want to approve this loan application?' :
               pendingAction?.action === 'reject' ? 'Are you sure you want to reject this loan application?' :
               pendingAction?.action === 'paid' ? 'Are you sure you want to mark this loan as paid?' :
               'Are you sure you want to change the status of this loan?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmationDialog(false)
                setPendingAction(null)
              }}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmLoanAction}
              className={
                pendingAction?.action === 'approve' ? 'bg-green-500 hover:bg-green-600' :
                pendingAction?.action === 'reject' ? 'bg-red-500 hover:bg-red-600' :
                pendingAction?.action === 'paid' ? 'bg-emerald-500 hover:bg-emerald-600' :
                'bg-blue-500 hover:bg-blue-600'
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
