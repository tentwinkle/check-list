"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateTemplateDialog } from "./create-template-dialog"
import { TemplatesList } from "./templates-list"

interface TemplatesManagementProps {
  onUpdate: () => void
}

export function TemplatesManagement({ onUpdate }: TemplatesManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Templates Management</CardTitle>
            <CardDescription>Create and manage inspection templates across your organization</CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <TemplatesList onUpdate={onUpdate} />
      </CardContent>

      <CreateTemplateDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={onUpdate} />
    </Card>
  )
}
