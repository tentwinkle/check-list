"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { TemplateItemsManagement } from "@/components/admin/template-items-management"
import { Navigation } from "@/components/ui/navigation"

interface TemplateItemsPageProps {
  params: {
    id: string
  }
}

export default function TemplateItemsPage({ params }: TemplateItemsPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session || session?.user?.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }

    fetchTemplate()
  }, [session, status, params.id, router])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/templates/${params.id}`)
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
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <TemplateItemsManagement templateId={params.id} templateName={template.name} onUpdate={fetchTemplate} />
      </div>
    </div>
  )
}
