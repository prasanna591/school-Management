"use client"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/50 px-4">
      <div className="w-full md:w-[420px]">
        <h1 className="text-2xl font-bold">SmartSchool</h1>
        <p className="text-muted-foreground">Sign in to your school</p>
        <div className="mt-6 space-y-4">
          <input
            type="tel"
            placeholder="+91 98765 43210"
            className="w-full border border-input rounded-md px-3 py-2 text-sm"
          />
          <button className="w-full bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium">
            Send OTP
          </button>
        </div>
      </div>
    </div>
  )
}
