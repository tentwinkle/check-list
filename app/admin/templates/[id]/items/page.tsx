"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { TemplateItemsManagement } from "@/components/admin/template-items-management"
import { Navigation } from "@/components/ui/navigation"
import { buildAdminApiUrl } from "@/lib/admin"

interface TemplateItemsPageProps {
  params: {
    id: string
  }
  searchParams?: { organizationId?: string }
}

export default function TemplateItemsPage({ params, searchParams }: TemplateItemsPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const organizationId =
    session?.user.role === "SUPER_ADMIN" ? searchParams?.organizationId : session?.user.organizationId

  useEffect(() => {
    if (status === "loading") return

    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role as any)) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role === "SUPER_ADMIN" && !organizationId) {
      router.push("/super-admin")
      return
    }

    fetchTemplate()
  }, [session, status, params.id, router])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(
        buildAdminApiUrl(`/api/admin/templates/${params.id}`, organizationId),
      )
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
      } else {
        router.push("/admin")
      }
    } catch (error) {
      console.error("Failed to fetch template:", error)
      router.push("/admin")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto mobile-padding py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto mobile-padding py-6">
        <TemplateItemsManagement
          templateId={params.id}
          templateName={template.name}
          onUpdate={fetchTemplate}
          organizationId={organizationId || undefined}
        />
      </div>
    </div>
  )
}
