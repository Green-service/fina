'use client'

import { useEffect, useRef, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { createClient } from '@/lib/supabase/client'
import { authState } from '@/lib/auth-state'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface LoanData {
  month: string
  approved: number
  rejected: number
  total: number
}

export default function LoanHistoryGraph() {
  const [data, setData] = useState<LoanData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const chartRef = useRef<any>(null)

  useEffect(() => {
    fetchLoanData()
  }, [])

  const fetchLoanData = async () => {
    try {
      setLoading(true)
      const userId = authState.getUserId()
      if (!userId) return

      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      
      const { data: loanApplications, error } = await supabase
        .from('loan_applications')
        .select('created_at, status')
        .eq('user_id', userId)
        .gte('created_at', startOfYear.toISOString())
        .lte('created_at', now.toISOString())

      if (error) {
        console.error('Error fetching loan applications:', error)
        return
      }

      const monthlyData: LoanData[] = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(now.getFullYear(), i)
        const monthStr = month.toLocaleString('default', { month: 'short' })
        
        const monthApprovedLoans = loanApplications?.filter(loan => {
          const loanDate = new Date(loan.created_at)
          return loanDate.getMonth() === i && loan.status === 'approved'
        }).length || 0

        const monthRejectedLoans = loanApplications?.filter(loan => {
          const loanDate = new Date(loan.created_at)
          return loanDate.getMonth() === i && loan.status === 'rejected'
        }).length || 0

        return {
          month: monthStr,
          approved: monthApprovedLoans,
          rejected: monthRejectedLoans,
          total: monthApprovedLoans + monthRejectedLoans
        }
      })

      setData(monthlyData)
    } catch (error) {
      console.error('Error processing loan data:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Total Loans',
        data: data.map(d => d.total),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        borderRadius: 4,
        order: 3
      },
      {
        type: 'line' as const,
        label: 'Approved Loans',
        data: data.map(d => d.approved),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        order: 1
      },
      {
        type: 'line' as const,
        label: 'Rejected Loans',
        data: data.map(d => d.rejected),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        order: 2
      }
    ]
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 15,
        right: 15,
        top: 20,
        bottom: 25
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawTicks: false
        },
        ticks: {
          color: '#888',
          stepSize: 1,
          padding: 10,
          font: {
            size: 10
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawTicks: false
        },
        ticks: {
          color: '#888',
          maxRotation: 45,
          minRotation: 45,
          padding: 8,
          font: {
            size: 8
          },
          autoSkip: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          padding: 12,
          color: '#888',
          font: {
            size: 10
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 8,
        titleFont: {
          size: 10
        },
        bodyFont: {
          size: 10
        },
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
    <div className="w-full h-[400px] bg-[#1A1A1A] rounded-lg p-4">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : data.length > 0 ? (
        <Line ref={chartRef} data={chartData} options={options} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-white/60">No loan history data available</p>
        </div>
      )}
    </div>
  )
} 