"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { EditUserDialog } from "./edit-user-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  name?: string
  email: string
  role: string
  createdAt: string
  area?: {
    name: string
  }
  department?: {
    name: string
  }
}

interface UsersListProps {
  onUpdate: () => void
}

export function UsersList({ onUpdate }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Team Leader"
      case "MINI_ADMIN":
        return "Area Leader"
      case "INSPECTOR":
        return "Inspector"
      default:
        return role
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "default"
      case "MINI_ADMIN":
        return "secondary"
      case "INSPECTOR":
        return "outline"
      default:
        return "outline"
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setShowEditDialog(true)
  }

  const handleDelete = (user: User) => {
    setDeletingUser(user)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingUser) return

    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully.",
        })
        setShowDeleteDialog(false)
        setDeletingUser(null)
        onUpdate()
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading users...</div>
  }

  if (users.length === 0) {
    return <div className="text-center py-8 text-gray-500">No users found. Add your first user to get started.</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Area</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name || "-"}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={getRoleBadgeVariant(user.role) as any}>{getRoleDisplay(user.role)}</Badge>
            </TableCell>
            <TableCell>{user.area?.name || "-"}</TableCell>
            <TableCell>{user.department?.name || "-"}</TableCell>
            <TableCell>{formatDate(new Date(user.createdAt))}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(user)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(user)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {showEditDialog && editingUser && (
        <EditUserDialog
          user={editingUser}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => {
            setShowEditDialog(false)
            setEditingUser(null)
            onUpdate()
            fetchUsers()
          }}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingUser?.name || deletingUser?.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Table>
  )
}
