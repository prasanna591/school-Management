"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api"

export default function CompliancePage() {
  const { data } = useQuery({
    queryKey: ["consent-records"],
    queryFn: async () => apiRequest("/consent-records?userId=demo"),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Compliance</h1>
      <p className="text-muted-foreground">DPDP consent readiness</p>
    </div>
  )
}
