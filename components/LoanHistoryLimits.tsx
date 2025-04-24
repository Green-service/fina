'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { authState } from '@/lib/auth-state'
import { formatCurrency } from '@/lib/utils'

interface MonthlyLoanData {
  month: string
  count: number
}

export default function LoanHistoryLimits() {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0)
  const [monthlyLoanLimit, setMonthlyLoanLimit] = useState<number>(0)
  const [totalApplications, setTotalApplications] = useState<number>(0)
  const [monthlyData, setMonthlyData] = useState<MonthlyLoanData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const userId = authState.getUserId()
      if (!userId) return

      // Fetch user profile to get monthly income
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('monthly_income')
        .eq('auth_id', userId)
        .single()

      if (profileError) throw profileError

      const income = profile?.monthly_income || 0
      setMonthlyIncome(income)
      setMonthlyLoanLimit(income * 0.3) // 30% of monthly income

      // Fetch loan applications
      const { data: loans, error: loansError } = await supabase
        .from('loan_applications')
        .select('created_at')
        .eq('user_id', userId)

      if (loansError) throw loansError

      setTotalApplications(loans?.length || 0)

      // Process monthly data
      const now = new Date()
      const monthlyLoanData: MonthlyLoanData[] = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(now.getFullYear(), i)
        const monthStr = month.toLocaleString('default', { month: 'short' })
        
        const monthLoans = loans?.filter(loan => {
          const loanDate = new Date(loan.created_at)
          return loanDate.getMonth() === i
        }).length || 0

        return {
          month: monthStr,
          count: monthLoans
        }
      })

      setMonthlyData(monthlyLoanData)
    } catch (error) {
      console.error('Error fetching loan history data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Loan History & Limits</CardTitle>
        <CardDescription>Track your loan applications and limits</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Monthly Loan Limit (30% of income)</p>
                <p className="text-2xl font-bold">{formatCurrency(monthlyLoanLimit)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Monthly Loan Applications</p>
                <p className="text-2xl font-bold">{totalApplications} total</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Applications by Month</p>
              <div className="grid grid-cols-6 gap-2">
                {monthlyData.map((data) => (
                  <div key={data.month} className="text-center">
                    <p className="text-xs text-muted-foreground">{data.month}</p>
                    <div className="mt-1 h-16 flex items-end justify-center">
                      <div 
                        className="w-6 bg-primary rounded-t-sm" 
                        style={{ 
                          height: `${Math.max(5, (data.count / Math.max(...monthlyData.map(d => d.count), 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs mt-1">{data.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 