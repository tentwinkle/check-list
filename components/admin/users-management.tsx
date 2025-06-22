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

export function UsersManagement({ onUpdate }: UsersManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [listKey, setListKey] = useState(0)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>Manage all users across your organization</CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <UsersList key={listKey} onUpdate={onUpdate} />
      </CardContent>

      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          onUpdate()
          setListKey((k) => k + 1)
        }}
      />
    </Card>
  )
}
