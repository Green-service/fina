"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
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

interface DashboardStats {
  totalLoans: number
  approvedLoans: number
  rejectedLoans: number
  pendingLoans: number
  totalBorrowed: number
  totalWithInterest: number
  companyNetWorth: number
}

interface LoanApplication {
  id: string
  user: {
    name: string
    email: string
    avatar?: string
  }
  amount: number
  purpose: string
  status: 'pending' | 'approved' | 'rejected'
  riskLevel: 'low' | 'medium' | 'high'
  date: string
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

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalLoans: 0,
    approvedLoans: 0,
    rejectedLoans: 0,
    pendingLoans: 0,
    totalBorrowed: 0,
    totalWithInterest: 0,
    companyNetWorth: 0
  })
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const router = useRouter()

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
        await fetchDashboardData()
        setLoading(false)
      } catch (error) {
        console.error("Error checking admin status:", error)
        router.push("/login")
      }
    }

    checkAdminAccess()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      // Fetch all required data from Supabase
      // This is where you'll implement the actual data fetching
      // For now using mock data
      setStats({
        totalLoans: 150,
        approvedLoans: 100,
        rejectedLoans: 20,
        pendingLoans: 30,
        totalBorrowed: 500000,
        totalWithInterest: 575000,
        companyNetWorth: 1000000
      })

      // Mock loan applications
      setLoanApplications([
        {
          id: '1',
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            avatar: '/avatars/john.jpg'
          },
          amount: 5000,
          purpose: 'Business Expansion',
          status: 'pending',
          riskLevel: 'low',
          date: '2024-03-10'
        },
        // Add more mock data as needed
      ])

      // Mock top clients
      setTopClients([
        {
          id: '1',
          name: 'Alice Johnson',
          totalPaidLoans: 5,
          totalAmount: 25000,
          reliability: 98,
          avatar: '/avatars/alice.jpg'
        },
        // Add more mock data as needed
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const handleLoanAction = async (loanId: string, action: 'approve' | 'reject') => {
    try {
      // Implement loan approval/rejection logic
      const { error } = await supabase
        .from('loans')
        .update({ status: action })
        .eq('id', loanId)

      if (error) throw error

      // Refresh dashboard data
      await fetchDashboardData()

      // Show success message
      toast({
        title: `Loan ${action}ed successfully`,
        description: `The loan has been ${action}ed.`,
      })
    } catch (error) {
      console.error(`Error ${action}ing loan:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} loan. Please try again.`,
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    try {
      authState.logout()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B1B2C]/95 to-[#1B1B2C]/90 backdrop-blur-xl">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar onSignOut={handleSignOut} />
        <div className="flex-1 ml-[4rem] lg:ml-[16.5rem] transition-all duration-300">
          <main className="p-4 pt-24 max-w-[calc(100vw-4.5rem)] lg:max-w-[calc(100vw-17rem)]">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-[#1B1B2C]/40 backdrop-blur-xl border-[0.5px] border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
                <CardHeader className="pb-2 space-y-0 relative">
                  <CardTitle className="text-sm font-medium text-white/70">Total Loans</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">{stats.totalLoans}</div>
                  <div className="flex items-center mt-1">
                    <Badge className="bg-green-500/20 text-green-400 text-sm border border-green-500/20">+11.01%</Badge>
                    <span className="text-xs text-white/50 ml-2">vs last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1B1B2C]/40 backdrop-blur-xl border-[0.5px] border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
                <CardHeader className="pb-2 space-y-0 relative">
                  <CardTitle className="text-sm font-medium text-white/70">Money Borrowed</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">R{stats.totalBorrowed.toLocaleString()}</div>
                  <div className="flex items-center mt-1">
                    <Badge className="bg-green-500/20 text-green-400 text-sm border border-green-500/20">+15.2%</Badge>
                    <span className="text-xs text-white/50 ml-2">vs last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1B1B2C]/40 backdrop-blur-xl border-[0.5px] border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
                <CardHeader className="pb-2 space-y-0 relative">
                  <CardTitle className="text-sm font-medium text-white/70">With Interest</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">R{stats.totalWithInterest.toLocaleString()}</div>
                  <div className="flex items-center mt-1">
                    <Badge className="bg-green-500/20 text-green-400 text-sm border border-green-500/20">+8.4%</Badge>
                    <span className="text-xs text-white/50 ml-2">vs last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1B1B2C]/40 backdrop-blur-xl border-[0.5px] border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
                <CardHeader className="pb-2 space-y-0 relative">
                  <CardTitle className="text-sm font-medium text-white/70">Company Net Worth</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">R{stats.companyNetWorth.toLocaleString()}</div>
                  <div className="flex items-center mt-1">
                    <Badge className="bg-green-500/20 text-green-400 text-sm border border-green-500/20">+12.5%</Badge>
                    <span className="text-xs text-white/50 ml-2">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Performance Chart */}
            <Card className="bg-[#1B1B2C]/40 backdrop-blur-xl border-[0.5px] border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
              <CardHeader className="relative">
                <CardTitle className="text-white/90">Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { month: 'Jan', value: 100 },
                      { month: 'Feb', value: 200 },
                      { month: 'Mar', value: 150 },
                      { month: 'Apr', value: 180 },
                      { month: 'May', value: 220 },
                      { month: 'Jun', value: 250 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="month" stroke="#ffffff50" />
                      <YAxis stroke="#ffffff50" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1B1B2C', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Loan Applications */}
            <Card className="bg-[#1B1B2C]/40 backdrop-blur-xl border-[0.5px] border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
              <CardHeader className="relative">
                <CardTitle className="text-white/90">Loan Applications</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-white/5">
                      <TableHead className="text-white/70">Applicant</TableHead>
                      <TableHead className="text-white/70">Amount</TableHead>
                      <TableHead className="text-white/70">Purpose</TableHead>
                      <TableHead className="text-white/70">Risk Level</TableHead>
                      <TableHead className="text-white/70">Status</TableHead>
                      <TableHead className="text-white/70">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loanApplications.map((loan) => (
                      <TableRow key={loan.id} className="hover:bg-white/5">
                        <TableCell className="flex items-center gap-2">
                          <Avatar className="border border-white/10">
                            <AvatarImage src={loan.user.avatar} />
                            <AvatarFallback className="bg-green-500/20 text-green-400 border border-green-500/20">{loan.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-white">{loan.user.name}</div>
                            <div className="text-sm text-white/50">{loan.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">R{loan.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-white">{loan.purpose}</TableCell>
                        <TableCell>
                          <Badge className={
                            loan.riskLevel === 'low' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                            loan.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                            'bg-red-500/20 text-red-400 border border-red-500/20'
                          }>
                            {loan.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            loan.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                            loan.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                          }>
                            {loan.status}
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
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-white hover:bg-white/10" onClick={() => handleLoanAction(loan.id, 'reject')}>
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-white hover:bg-white/10">View Details</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Top Clients */}
            <Card className="bg-[#1B1B2C]/40 backdrop-blur-xl border-[0.5px] border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5"></div>
              <CardHeader className="relative">
                <CardTitle className="text-white/90">Top 10 Clients</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-white/5">
                      <TableHead className="text-white/70">Client</TableHead>
                      <TableHead className="text-white/70">Paid Loans</TableHead>
                      <TableHead className="text-white/70">Total Amount</TableHead>
                      <TableHead className="text-white/70">Reliability</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-white/5">
                        <TableCell className="flex items-center gap-2">
                          <Avatar className="border border-white/10">
                            <AvatarImage src={client.avatar} />
                            <AvatarFallback className="bg-green-500/20 text-green-400 border border-green-500/20">{client.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium text-white">{client.name}</div>
                        </TableCell>
                        <TableCell className="text-white">{client.totalPaidLoans}</TableCell>
                        <TableCell className="text-white">R{client.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={
                            client.reliability >= 90 ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                            client.reliability >= 70 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                            'bg-red-500/20 text-red-400 border border-red-500/20'
                          }>
                            {client.reliability}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                    <p className="text-white/70">Based on current growth rate and market trends:</p>
                    <ul className="mt-2 space-y-2">
                      <li className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-400 border border-green-500/20">+25%</Badge>
                        <span className="text-white">Expected revenue: R75,000</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/20">+15%</Badge>
                        <span className="text-white">New clients: 45</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/20">+20%</Badge>
                        <span className="text-white">Loan volume: R250,000</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}
