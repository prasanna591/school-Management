"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Mail, Shield, Users, Building2, CreditCard } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">School configuration and preferences</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <CardHeader>
            <CardTitle>School Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">School Name</span>
                <span className="text-sm font-medium">Demo Public School</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Board</span>
                <span className="text-sm font-medium">CBSE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Affiliation No.</span>
                <span className="text-sm font-medium">CBSE/123456</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Default Language</span>
                <span className="text-sm font-medium">English</span>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <CardHeader>
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Primary Color</span>
                <Badge variant="success" asChild={false}>
                  #0F766E
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Logo</span>
                <span className="text-xs text-muted-foreground">Not uploaded</span>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <CardHeader>
            <CardTitle>Academic Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Year</span>
                <span className="text-sm font-medium">2024-25</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Terms</span>
                <span className="text-sm font-medium">3 terms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rollover</span>
                <Badge variant="outline" asChild={false}>
                  Not started
                </Badge>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <CardHeader>
            <CardTitle>Roles & Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Super Admin</span>
                <Badge variant="success" asChild={false}>
                  All access
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Principal</span>
                <Badge variant="outline" asChild={false}>
                  Management
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Accountant</span>
                <Badge variant="outline" asChild={false}>
                  Fees only
                </Badge>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Payment Gateway</span>
                </div>
                <Badge variant="destructive" asChild={false}>
                  Not connected
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">WhatsApp Business</span>
                </div>
                <Badge variant="destructive" asChild={false}>
                  Not connected
                </Badge>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Offline Sync</span>
                <Badge variant="success" asChild={false}>
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">AI Remarks</span>
                <Badge variant="destructive" asChild={false}>
                  Disabled
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">UPI AutoPay</span>
                <Badge variant="destructive" asChild={false}>
                  Disabled
                </Badge>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  )
}
