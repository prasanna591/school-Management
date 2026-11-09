"use client"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">School overview for today</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Students</h3>
          <div className="text-3xl font-bold">120</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Attendance Today</h3>
          <div className="text-3xl font-bold">94%</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Fees Collected</h3>
          <div className="text-3xl font-bold">₹45,000</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Pending Approvals</h3>
          <div className="text-3xl font-bold">3</div>
        </div>
      </div>
    </div>
  )
}
