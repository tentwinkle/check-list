"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateTemplateDialog } from "./create-template-dialog"
import { TemplatesList } from "./templates-list"

interface TemplatesManagementProps {
  onUpdate: () => void
  organizationId?: string
}

export function TemplatesManagement({
  onUpdate,
  organizationId,
}: TemplatesManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Templates Management</CardTitle>
            <CardDescription>Create and manage inspection templates across your organization</CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <TemplatesList onUpdate={onUpdate} organizationId={organizationId} />
      </CardContent>

      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={onUpdate}
        organizationId={organizationId}
      />
    </Card>
  )
}
