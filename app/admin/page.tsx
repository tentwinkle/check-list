"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminDashboard } from "@/components/admin/dashboard"
import { Navigation } from "@/components/ui/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Crown, Building } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SuperAdminContext {
  originalRole: string
  targetOrganization: {
    id: string
    name: string
  }
  loginAsAdmin: boolean
  timestamp: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [superAdminContext, setSuperAdminContext] = useState<SuperAdminContext | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    // Check if user has admin access or is Super Admin
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
      router.push("/")
      return
    }

    // Check for Super Admin context
    try {
      const contextData = sessionStorage.getItem("superAdminContext")
      if (contextData) {
        const context = JSON.parse(contextData) as SuperAdminContext
        if (context.originalRole === "SUPER_ADMIN" && context.loginAsAdmin) {
          setSuperAdminContext(context)
        }
      }
    } catch (error) {
      console.error("Failed to parse Super Admin context:", error)
      sessionStorage.removeItem("superAdminContext")
    }

    setLoading(false)
  }, [session, status, router])

  const handleReturnToSuperAdmin = () => {
    sessionStorage.removeItem("superAdminContext")
    router.push("/super-admin")
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading Dashboard</h3>
            <p className="text-sm text-gray-600 text-center">Please wait while we prepare your admin dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Super Admin Context Header */}
        {superAdminContext && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    Super Admin View
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>
                    Managing: <strong>{superAdminContext.targetOrganization.name}</strong>
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleReturnToSuperAdmin}
                className="bg-white hover:bg-purple-50 border-purple-200 text-purple-700"
              >
                Return to Super Admin
              </Button>
            </div>
          </div>
        )}

        <AdminDashboard organizationId={superAdminContext?.targetOrganization.id} />
      </div>
    </div>
  )
}
