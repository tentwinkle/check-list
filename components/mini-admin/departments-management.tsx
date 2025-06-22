"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateDepartmentDialog } from "./create-department-dialog"
import { DepartmentsList } from "./departments-list"

interface DepartmentsManagementProps {
  onUpdate: () => void
}

export function MiniAdminDepartmentsManagement({ onUpdate }: DepartmentsManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Departments Management</CardTitle>
            <CardDescription>Create and manage departments within your area</CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Department
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DepartmentsList onUpdate={onUpdate} />
      </CardContent>

      <CreateDepartmentDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={onUpdate} />
    </Card>
  )
}
