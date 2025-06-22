"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { MiniAdminTemplateItemsManagement } from "@/components/mini-admin/template-items-management"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: {
    id: string
  }
}

export default function MiniAdminTemplateItemsPage({ params }: PageProps) {
  const { data: session, status } = useSession()
  const [template, setTemplate] = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session || (session.user as { role: string }).role !== "MINI_ADMIN") {
      redirect("/auth/signin")
    }

    fetchTemplate()
  }, [session, status, params.id])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/mini-admin/templates/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
      } else {
        redirect("/mini-admin")
      }
    } catch (error) {
      console.error("Failed to fetch template:", error)
      redirect("/mini-admin")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return <div className="container mx-auto mobile-padding py-6">Loading...</div>
  }

  if (!session || (session.user as { role: string }).role !== "MINI_ADMIN") {
    redirect("/auth/signin")
    return null
  }

  if (!template) {
    return <div className="container mx-auto mobile-padding py-6">Template not found</div>
  }

  return (
    <div className="container mx-auto mobile-padding py-6">
      <div className="mb-6">
        <Link href="/mini-admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <MiniAdminTemplateItemsManagement
        templateId={params.id}
        templateName={template.name}
        onUpdate={() => {
          // Refresh template data if needed
          fetchTemplate()
        }}
      />
    </div>
  )
}
