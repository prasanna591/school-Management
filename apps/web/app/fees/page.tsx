"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, CreditCard, FileText, Wallet } from "lucide-react"

export default function FeesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { data, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => apiRequest("/students/STU-001/dues"),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fees</h1>
          <p className="text-muted-foreground">Fee collection and management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {}}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button onClick={() => {}}>
            <CreditCard className="h-4 w-4 mr-2" /> Collect Payment
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <CardHeader>
            <CardTitle>Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹45,000</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <CardHeader>
            <CardTitle>Outstanding Dues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">₹12,500</div>
            <p className="text-xs text-muted-foreground">12 students</p>
          </CardContent>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <CardHeader>
            <CardTitle>Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">of expected</p>
          </CardContent>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search student or admission number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-input bg-background px-3 py-2 text-sm rounded-md focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 text-muted-foreground">Student</th>
                <th className="text-left pb-3 text-muted-foreground">Class</th>
                <th className="text-right pb-3 text-muted-foreground">Due</th>
                <th className="text-right pb-3 text-muted-foreground">Paid</th>
                <th className="text-right pb-3 text-muted-foreground">Balance</th>
                <th className="text-left pb-3 text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Arav Sharma", class: "5A", due: "₹5,000", paid: "₹3,000", balance: "₹2,000", status: "partial" },
                { name: "Meera Sharma", class: "3B", due: "₹4,000", paid: "₹4,000", balance: "₹0", status: "paid" },
                { name: "Karthik R", class: "5A", due: "₹5,000", paid: "₹0", balance: "₹5,000", status: "overdue" },
              ].map((s) => (
                <tr key={s.name} className="border-b border-border hover:bg-muted/50">
                  <td className="pb-3 font-medium">{s.name}</td>
                  <td className="pb-3">{s.class}</td>
                  <td className="pb-3 text-right">{s.due}</td>
                  <td className="pb-3 text-right">{s.paid}</td>
                  <td className="pb-3 text-right font-medium">
                    {s.balance === "₹0" ? (
                      <span className="text-green-600">{s.balance}</span>
                    ) : (
                      <span className="text-red-600">{s.balance}</span>
                    )}
                  </td>
                  <td className="pb-3">
                    <Badge
                      variant={
                        s.status === "paid"
                          ? "success"
                          : s.status === "overdue"
                          ? "destructive"
                          : "warning"
                      }
                      asChild={false}
                    >
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
