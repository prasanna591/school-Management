"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, Bell, FileText } from "lucide-react"

const AUDIENCE_COLORS: Record<string, string> = {
  all: "bg-blue-100 text-blue-700 border border-blue-200/50",
  class: "bg-green-100 text-green-700 border border-green-200/50",
  section: "bg-purple-100 text-purple-700 border border-purple-200/50",
  individual: "bg-orange-100 text-orange-700 border border-orange-200/50",
  emergency: "bg-red-100 text-red-700 border border-red-200/50",
}

export default function MessagesPage() {
  const [search, setSearch] = useState("")
  const [audience, setAudience] = useState("all")

  const { data, isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => apiRequest("/notices"),
  })

  const notices = data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communication</h1>
          <p className="text-muted-foreground">Notices, circulars, and messaging</p>
        </div>
        <Button onClick={() => {}}>
          <Mail className="h-4 w-4 mr-2" /> New Notice
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <CardHeader>
            <CardTitle>Notices Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{notices.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <CardHeader>
            <CardTitle>Read Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Delivered & read</p>
          </CardContent>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <CardHeader>
            <CardTitle>Emergency Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">No active emergencies</p>
          </CardContent>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="border border-input bg-background px-3 py-2 text-sm rounded-md focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Audiences</option>
            <option value="class">By Class</option>
            <option value="section">By Section</option>
            <option value="individual">Individual</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 text-muted-foreground">Title</th>
                <th className="text-left pb-3 text-muted-foreground">Audience</th>
                <th className="text-left pb-3 text-muted-foreground">Channel</th>
                <th className="text-right pb-3 text-muted-foreground">Status</th>
                <th className="text-left pb-3 text-muted-foreground">Sent At</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-muted-foreground text-center">
                    Loading...
                  </td>
                </tr>
              ) : notices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-muted-foreground text-center">
                    No notices found
                  </td>
                </tr>
              ) : (
                notices.map((n: any) => (
                  <tr key={n.id} className="border-b border-border hover:bg-muted/50">
                    <td className="pb-3 font-medium">{n.title}</td>
                    <td className="pb-3">
                      <Badge variant="outline" asChild={false}>
                        {n.audience}
                      </Badge>
                    </td>
                    <td className="pb-3 text-muted-foreground">
                      Push, SMS
                    </td>
                    <td className="pb-3">
                      <Badge variant="success" asChild={false}>
                        Sent
                      </Badge>
                    </td>
                    <td className="pb-3 text-muted-foreground">
                      {new Date(n.createdAt ?? Date.now()).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <CardHeader>
          <CardTitle>Quick Compose</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => {}}>
              <FileText className="h-4 w-4 mr-2" /> Notice
            </Button>
            <Button variant="outline" onClick={() => {}}>
              <Bell className="h-4 w-4 mr-2" /> Emergency Alert
            </Button>
            <Button variant="outline" onClick={() => {}}>
              <Mail className="h-4 w-4 mr-2" /> Circular
            </Button>
            <Button variant="outline" onClick={() => {}}>
              <Bell className="h-4 w-4 mr-2" className="text-red-600" /> Poll
            </Button>
          </div>
        </CardContent>
      </div>
    </div>
  )
}
