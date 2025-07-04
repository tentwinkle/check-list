"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield } from 'lucide-react'
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface SuperAdminContextType {
  isActingAsAdmin: boolean
  targetOrganizationId: string | null
  targetOrganizationName: string | null
  exitSuperAdminMode: () => void
}

const SuperAdminContext = createContext<SuperAdminContextType | null>(null)

export function useSuperAdminContext() {
  const context = useContext(SuperAdminContext)
  return context
}

interface SuperAdminContextProviderProps {
  children: React.ReactNode
  organizationId: string
}

export function SuperAdminContextProvider({ 
  children, 
  organizationId 
}: SuperAdminContextProviderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [contextData, setContextData] = useState<{
    targetOrganizationName: string | null
  }>({ targetOrganizationName: null })

  useEffect(() => {
    // Get context from sessionStorage
    const storedContext = sessionStorage.getItem('superAdminContext')
    if (storedContext) {
      const parsed = JSON.parse(storedContext)
      setContextData({
        targetOrganizationName: parsed.targetOrganizationName
      })
    }
  }, [])

  const exitSuperAdminMode = () => {
    sessionStorage.removeItem('superAdminContext')
    router.push('/super-admin')
    toast.success("Returned to Super Admin dashboard")
  }

  if (session?.user.role !== "SUPER_ADMIN") {
    return <>{children}</>
  }

  const contextValue: SuperAdminContextType = {
    isActingAsAdmin: true,
    targetOrganizationId: organizationId,
    targetOrganizationName: contextData.targetOrganizationName,
    exitSuperAdminMode
  }

  return (
    <SuperAdminContext.Provider value={contextValue}>
      {/* Super Admin Context Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">
            Super Admin Mode: Acting as Team Leader
            {contextData.targetOrganizationName && (
              <span className="ml-1">for {contextData.targetOrganizationName}</span>
            )}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={exitSuperAdminMode}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Super Admin
        </Button>
      </div>
      {children}
    </SuperAdminContext.Provider>
  )
}