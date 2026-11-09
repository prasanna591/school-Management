import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, LogOut, Home, Users, Building2, CreditCard, FileText, Bus, GraduationCap, Shield, Settings, TrendingUp, Calendar, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Students", href: "/students", icon: Users },
  { name: "Attendance", href: "/attendance", icon: Calendar },
  { name: "Fees", href: "/fees", icon: CreditCard },
  { name: "Messages", href: "/messages", icon: Bell },
  { name: "Admissions", href: "/admissions", icon: FileText },
  { name: "Exams", href: "/exams", icon: GraduationCap },
  { name: "Timetable", href: "/timetable", icon: TrendingUp },
  { name: "Transport", href: "/transport", icon: Bus },
  { name: "HR & Payroll", href: "/hr", icon: Shield },
  { name: "Compliance", href: "/compliance", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Audit Log", href: "/audit", icon: Shield },
  { name: "Super Admin", href: "/super-admin", icon: Building2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border h-full bg-background">
      <div className="flex items-center gap-2 px-6 py-4">
        <Building2 className="h-6 w-6 text-primary" />
        <span className="font-semibold text-lg tracking-tight">SmartSchool</span>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </button>
          )
        })}
      </nav>
      <div className="px-4 py-6 border-t border-border">
        <button
          onClick={() => {
            document.cookie =
              "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            document.cookie =
              "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            router.push("/auth/login")
          }}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-destructive rounded-md hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export function TopBar() {
  const pathname = usePathname()

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          SmartSchool
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-muted-foreground hover:text-primary relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </button>
        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
          AD
        </div>
      </div>
    </header>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/50">{children}</main>
      </div>
    </div>
  )
}
