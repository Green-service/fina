"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ChartBarIcon,
  UsersIcon,
  CreditCardIcon,
  UserGroupIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  onSignOut: () => void
  onUserManagementClick?: () => void
  onStokvelaGroupsClick?: () => void
  onInvestmentsClick?: () => void
}

export function AdminSidebar({ onSignOut, onUserManagementClick, onStokvelaGroupsClick, onInvestmentsClick }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const pathname = usePathname()

  const navigation = [
    {
      name: "Dashboard",
      href: "/adminDashboard",
      icon: ChartBarIcon,
    },
    {
      name: "Loan Management",
      href: "/adminDashboard/loans",
      icon: CreditCardIcon,
    },
    {
      name: "User Management",
      href: "#",
      icon: UsersIcon,
      onClick: onUserManagementClick,
    },
    {
      name: "Stokvela Groups",
      href: "#",
      icon: UserGroupIcon,
      onClick: onStokvelaGroupsClick,
    },
    {
      name: "Investments",
      href: "#",
      icon: BanknotesIcon,
      onClick: onInvestmentsClick,
    },
    {
      name: "Analytics",
      href: "/adminDashboard/analytics",
      icon: ChartPieIcon,
    },
    {
      name: "Settings",
      href: "/adminDashboard/settings",
      icon: Cog6ToothIcon,
    },
  ]

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-30 flex flex-col bg-[#151521] transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-white font-semibold text-lg">GreenFina</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if (item.onClick) {
                  e.preventDefault()
                  item.onClick()
                }
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
                isCollapsed && "justify-center"
              )}
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center gap-3 text-white/70 hover:bg-white/10 hover:text-white",
            isCollapsed && "justify-center"
          )}
          onClick={onSignOut}
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          {!isCollapsed && <span>Sign out</span>}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full text-white hover:bg-white/10"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
} 