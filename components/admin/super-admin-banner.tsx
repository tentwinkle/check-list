"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface SuperAdminContext {
  originalRole: string
  actingAsRole: string
  targetOrganizationId: string
  targetOrganizationName: string
  returnUrl: string
}

export function SuperAdminBanner() {
  const [context, setContext] = useState<SuperAdminContext | null>(null)
  const router = useRouter()

  useEffect(() => {
    const contextData = sessionStorage.getItem("superAdminContext")
    if (contextData) {
      try {
        setContext(JSON.parse(contextData))
      } catch (error) {
        console.error("Failed to parse SuperAdmin context:", error)
      }
    }
  }, [])

  const handleReturnToSuperAdmin = () => {
    sessionStorage.removeItem("superAdminContext")
    router.push("/super-admin")
  }

  if (!context) return null

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Shield className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-blue-800">
          <strong>Super Admin Mode:</strong> Acting as Team Leader for {context.targetOrganizationName}
        </span>
        <Button variant="outline" size="sm" onClick={handleReturnToSuperAdmin} className="ml-4 bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Super Admin
        </Button>
      </AlertDescription>
    </Alert>
  )
}
