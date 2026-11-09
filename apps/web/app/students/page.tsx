"use client"

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Students</h1>
      <p className="text-muted-foreground">Manage student information</p>
      <div className="rounded-xl border border-border bg-card p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left pb-3 text-muted-foreground">Name</th>
              <th className="text-left pb-3 text-muted-foreground">Admission No.</th>
              <th className="text-left pb-3 text-muted-foreground">Class</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="pb-3">Arav S.</td>
              <td className="pb-3">DEMO-001</td>
              <td className="pb-3">5A</td>
            </tr>
            <tr className="border-b border-border">
              <td className="pb-3">Meera S.</td>
              <td className="pb-3">DEMO-002</td>
              <td className="pb-3">3B</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
