"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Download, User } from "lucide-react"

export default function StudentsPage() {
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => apiRequest("/students?limit=100"),
  })

  const students = data?.items ?? []
  const filtered = students.filter(
    (s: any) =>
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage student information</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {}}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button onClick={() => {}}>
            <User className="h-4 w-4 mr-2" /> Add Student
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or admission number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="border border-input bg-background px-3 py-2 text-sm rounded-md focus:ring-2 focus:ring-ring"
          >
            <option value="">All Classes</option>
            <option value="5">Class 5</option>
            <option value="3">Class 3</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 text-muted-foreground">Admission No.</th>
                <th className="text-left pb-3 text-muted-foreground">Name</th>
                <th className="text-left pb-3 text-muted-foreground">Class / Section</th>
                <th className="text-left pb-3 text-muted-foreground">Roll No.</th>
                <th className="text-left pb-3 text-muted-foreground">Status</th>
                <th className="text-right pb-3 text-muted-foreground">Guardian</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-muted-foreground text-center">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-muted-foreground text-center">
                    No students found
                  </td>
                </tr>
              ) : (
                filtered.map((s: any) => (
                  <tr key={s.id} className="border-b border-border hover:bg-muted/50">
                    <td className="pb-3 font-medium">{s.admissionNumber}</td>
                    <td className="pb-3">{s.firstName} {s.lastName ?? ""}</td>
                    <td className="pb-3">5A</td>
                    <td className="pb-3">{s.rollNumber ?? "—"}</td>
                    <td className="pb-3">
                      <Badge variant={s.status === "active" ? "success" : "secondary"}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="pb-3 text-muted-foreground">Rajesh Sharma</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
