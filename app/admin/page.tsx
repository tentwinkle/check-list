"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminDashboard } from "@/components/admin/dashboard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Crown, Building } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()
  const [superAdminContext, setSuperAdminContext] = useState<SuperAdminContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    // Check for Super Admin context
    try {
      const contextData = sessionStorage.getItem("superAdminContext")
      if (contextData) {
        const context = JSON.parse(contextData) as SuperAdminContext
        setSuperAdminContext(context)
      }
    } catch (error) {
      console.error("Error parsing Super Admin context:", error)
    }

    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session?.user) {
      // Check if user has admin access or is super admin with context
      const hasAdminAccess =
        session.user.role === "ADMIN" ||
        session.user.role === "MINI_ADMIN" ||
        (session.user.role === "SUPER_ADMIN" && superAdminContext)

      if (!hasAdminAccess) {
        router.push("/")
        return
      }
    }

    setLoading(false)
  }, [session, status, router, superAdminContext])

  const handleReturnToSuperAdmin = () => {
    try {
      // Clear the Super Admin context
      sessionStorage.removeItem("superAdminContext")

      toast({
        title: "Returning to Super Admin",
        description: "Switching back to Super Admin dashboard",
      })

      // Redirect to super admin dashboard
      setTimeout(() => {
        window.location.href = "/super-admin"
      }, 500)
    } catch (error) {
      console.error("Error returning to Super Admin:", error)
      toast({
        title: "Error",
        description: "Failed to return to Super Admin dashboard",
        variant: "destructive",
      })
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Super Admin Context Header */}
      {superAdminContext && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Crown className="w-4 h-4 mr-1" />
                  Super Admin View
                </Badge>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">Managing: {superAdminContext.targetOrganization.name}</span>
                </div>
              </div>
              <Button
                onClick={handleReturnToSuperAdmin}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Super Admin
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard */}
      <AdminDashboard
        organizationId={superAdminContext?.targetOrganization.id || session.user.organizationId}
        isSuperAdminView={!!superAdminContext}
      />
    </div>
  )
}
