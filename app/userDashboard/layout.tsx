import { DashboardNavbar } from "@/components/dashboard/navbar"

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardNavbar />
      <main className="min-h-screen pt-20">
        {children}
      </main>
    </>
  )
} 