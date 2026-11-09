import { getTokenFromCookie } from "@/lib/auth"
import { Shell } from "@/components/layout/shell"

export const metadata = {
  title: "SmartSchool - Dashboard",
  description: "School management dashboard",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = getTokenFromCookie()
  if (!token) {
    // In a real app, redirect to login
    return null
  }
  return <Shell>{children}</Shell>
}
