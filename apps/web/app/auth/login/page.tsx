"use client"

import { NextPage } from "next"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Phone, LockKey } from "lucide-react"

const LoginPage: NextPage = () => {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const sendOtp = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001"}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      if (!res.ok) {
        setError("Failed to send OTP")
        return
      }
      setStep("otp")
    } catch {
      setError("Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001"}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, tenantId: "demo-school" }),
      })
      if (!res.ok) {
        setError("Invalid OTP")
        return
      }
      const data = await res.json()
      if (data.accessToken) {
        document.cookie = `access_token=${data.accessToken}; path=/; max-age=900; SameSite=Lax`
      }
      if (data.refreshToken) {
        document.cookie = `refresh_token=${data.refreshToken}; path=/; max-age=604800; SameSite=Lax`
      }
      router.push("/dashboard")
    } catch {
      setError("Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/50 px-4">
      <Card className="w-full md:w-[420px]">
        <CardHeader>
          <CardTitle>SmartSchool</CardTitle>
          <CardDescription>
            Sign in to your school
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {step === "phone" ? (
            <>
              <div className="flex items-center space-x-2 text-muted-foreground text-sm mb-2">
                <Phone className="h-4 w-4" />
                <span>Mobile number</span>
              </div>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength="15"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                OTP will be sent to this number
              </p>
              <Button
                onClick={sendOtp}
                disabled={loading || phone.length < 10}
                className="w-full"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2 text-muted-foreground text-sm mb-2">
                <LockKey className="h-4 w-4" />
                <span>Enter OTP</span>
              </div>
              <Input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <Link href="/auth/login">Change number</Link>
                <span>OTP expires in 10 min</span>
              </div>
              <Button onClick={verifyOtp} disabled={loading || otp.length < 6} className="w-full">
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
