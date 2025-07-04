"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateAreaDialog } from "./create-area-dialog"
import { AreasList } from "./areas-list"

interface AreasManagementProps {
  onUpdate: () => void
  organizationId?: string
}

export function AreasManagement({ onUpdate, organizationId }: AreasManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [listKey, setListKey] = useState(0)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Areas Management</CardTitle>
            <CardDescription>Create and manage areas within your organization</CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Area
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <AreasList
          key={listKey}
          onUpdate={onUpdate}
          organizationId={organizationId}
        />
      </CardContent>

      <CreateAreaDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          onUpdate()
          setListKey((k) => k + 1)
        }}
        organizationId={organizationId}
      />
    </Card>
  )
}
