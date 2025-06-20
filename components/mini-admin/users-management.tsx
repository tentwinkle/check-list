"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateUserDialog } from "./create-user-dialog"
import { UsersList } from "./users-list"

interface UsersManagementProps {
  onUpdate: () => void
}

export function MiniAdminUsersManagement({ onUpdate }: UsersManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>Manage inspectors and users within your area</CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <UsersList onUpdate={onUpdate} />
      </CardContent>

      <CreateUserDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={onUpdate} />
    </Card>
  )
}
