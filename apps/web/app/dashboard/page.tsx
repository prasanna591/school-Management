import Link from "next/link"
import { StatCard } from "@/components/ui/card"
import { TrendUp, Users, CreditCard, Calendar, Bus, Shield } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            School overview for today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/attendance">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-background hover:bg-accent">
              <Calendar className="h-4 w-4" /> Mark Attendance
            </button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value="120" sublabel="+5 this week" trend="up" trendValue="+4%" />
        <StatCard label="Attendance Today" value="94%" sublabel="vs 88% yesterday" trend="up" trendValue="+6%" />
        <StatCard label="Fees Collected" value="₹45,000" sublabel="This month" trend="up" trendValue="+12%" />
        <StatCard label="Pending Approvals" value="3" sublabel="Concessions, leave" trend="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/students">
              <button className="w-full flex items-center justify-between px-4 py-2 text-left rounded-md text-sm font-medium hover:bg-accent transition-colors">
                <span>Student Management</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </button>
            </Link>
            <Link href="/fees">
              <button className="w-full flex items-center justify-between px-4 py-2 text-left rounded-md text-sm font-medium hover:bg-accent transition-colors">
                <span>Fee Collection</span>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </button>
            </Link>
            <Link href="/admissions">
              <button className="w-full flex items-center justify-between px-4 py-2 text-left rounded-md text-sm font-medium hover:bg-accent transition-colors">
                <span>Admissions Funnel</span>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </button>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Today's Schedule</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Bus className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Route 5 - North Campus</div>
                  <div className="text-xs text-muted-foreground">Trip starts 7:15 AM</div>
                </div>
              </div>
              <span className="text-xs font-medium text-green-600">On time</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Fire drill practice</div>
                  <div className="text-xs text-muted-foreground">10:30 AM - Assembly Hall</div>
                </div>
              </div>
              <span className="text-xs font-medium text-amber-600">Scheduled</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Fee defaulters</div>
                <div className="text-xs text-amber-700">12 students with dues &gt;30 days</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Chronic absence</div>
                <div className="text-xs text-blue-700">3 students below 75% attendance</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
