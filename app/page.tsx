import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function HomePage() {
  const session: Session | null = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // Redirect based on user role
  switch (session.user.role) {
    case "SUPER_ADMIN":
      redirect("/super-admin")
    case "ADMIN":
      redirect("/admin")
    case "MINI_ADMIN":
      redirect("/mini-admin")
    case "INSPECTOR":
      redirect("/inspector")
    default:
      redirect("/auth/signin")
  }
}
