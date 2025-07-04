"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin/dashboard"
import { Skeleton } from "@/components/ui/skeleton"

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
  const [superAdminContext, setSuperAdminContext] = useState<SuperAdminContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    // Check for Super Admin context
    const contextData = sessionStorage.getItem("superAdminContext")
    if (contextData) {
      try {
        const context = JSON.parse(contextData) as SuperAdminContext
        if (context.originalRole === "SUPER_ADMIN" && context.loginAsAdmin) {
          setSuperAdminContext(context)
          setIsLoading(false)
          return
        }
      } catch (error) {
        console.error("Failed to parse super admin context:", error)
        sessionStorage.removeItem("superAdminContext")
      }
    }

    // Check if user has admin access
    if (status === "authenticated") {
      if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/")
      }
      setIsLoading(false)
    } else if (status === "unauthenticated") {
      redirect("/auth/signin")
    }
  }, [session, status])

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!session) {
    redirect("/auth/signin")
  }

  // Determine the organization context
  const organizationId = superAdminContext ? superAdminContext.targetOrganization.id : session.user.organizationId

  if (!organizationId && !superAdminContext) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Organization Access</h2>
          <p className="text-gray-600">You don't have access to any organization. Please contact your administrator.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6">
        {superAdminContext && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-purple-900">Super Admin Mode</h3>
                <p className="text-sm text-purple-700">
                  Managing organization: <strong>{superAdminContext.targetOrganization.name}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  sessionStorage.removeItem("superAdminContext")
                  window.location.href = "/super-admin"
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Return to Super Admin
              </button>
            </div>
          </div>
        )}

        <AdminDashboard organizationId={organizationId} />
      </div>
    </div>
  )
}
