'use client'

import { useEffect, useRef, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { createClient } from '@/lib/supabase/client'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface MonthlyData {
  month: string
  approvedLoans: number
  rejectedLoans: number
  investments: number
}

export default function MonthlySummaryGraph() {
  const [data, setData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const chartRef = useRef<any>(null)

  useEffect(() => {
    fetchMonthlyData()
  }, [])

  const fetchMonthlyData = async () => {
    try {
      setLoading(true)
      
      // Get the current date and calculate the start of the year
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      
      // Fetch loan applications for the current year
      const { data: loanApplicationsData, error: loanApplicationsError } = await supabase
        .from('loan_applications')
        .select('created_at, status')
        .gte('created_at', startOfYear.toISOString())
        .lte('created_at', now.toISOString())

      if (loanApplicationsError) {
        console.error('Error fetching loan applications:', loanApplicationsError)
        return
      }

      // Fetch investments for the current year
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select('created_at, status')
        .gte('created_at', startOfYear.toISOString())
        .lte('created_at', now.toISOString())

      if (investmentsError) {
        console.error('Error fetching investments:', investmentsError)
        return
      }

      // Process the data into monthly summaries
      const monthlyData: MonthlyData[] = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(now.getFullYear(), i)
        const monthStr = month.toLocaleString('default', { month: 'short' })
        
        const monthApprovedLoans = loanApplicationsData?.filter(loan => {
          const loanDate = new Date(loan.created_at)
          return loanDate.getMonth() === i && loan.status === 'approved'
        }).length || 0

        const monthRejectedLoans = loanApplicationsData?.filter(loan => {
          const loanDate = new Date(loan.created_at)
          return loanDate.getMonth() === i && loan.status === 'rejected'
        }).length || 0

        const monthInvestments = investmentsData?.filter(investment => {
          const investmentDate = new Date(investment.created_at)
          return investmentDate.getMonth() === i && investment.status === 'active'
        }).length || 0

        return {
          month: monthStr,
          approvedLoans: monthApprovedLoans,
          rejectedLoans: monthRejectedLoans,
          investments: monthInvestments
        }
      })

      setData(monthlyData)
    } catch (error) {
      console.error('Error processing monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Approved Loans',
        data: data.map(d => d.approvedLoans),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      },
      {
        label: 'Rejected Loans',
        data: data.map(d => d.rejectedLoans),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      },
      {
        label: 'Investments',
        data: data.map(d => d.investments),
        backgroundColor: 'rgba(14, 165, 233, 0.5)',
        borderColor: 'rgb(14, 165, 233)',
        borderWidth: 1
      }
    ]
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#888',
          stepSize: 1
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#888'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#888'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            const label = context.dataset.label
            return `${label}: ${value}`
          }
        }
      }
    }
  }

  return (
    <div className="w-full h-[400px] bg-card rounded-lg p-4">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading monthly summary data...</p>
        </div>
      ) : data.length > 0 ? (
        <Bar ref={chartRef} data={chartData} options={options} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No monthly summary data available</p>
        </div>
      )}
    </div>
  )
} 