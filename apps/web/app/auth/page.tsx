import { redirect } from "next/navigation"
import { getTokenFromCookie } from "@/lib/auth"

export async function GET() {
  const token = getTokenFromCookie()
  if (token) {
    redirect("/dashboard")
  }
  redirect("/auth/login")
}
