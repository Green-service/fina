import { DashboardNavbar } from "@/components/dashboard/navbar"
import { ForceSidebarClosed } from "@/components/dashboard/force-sidebar-closed"

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ForceSidebarClosed />
      <DashboardNavbar />
      <main className="min-h-screen pt-16">
        {children}
      </main>
    </>
  )
} 