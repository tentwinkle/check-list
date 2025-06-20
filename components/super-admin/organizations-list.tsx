"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { EditOrganizationDialog } from "./edit-organization-dialog"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

interface Organization {
  id: string
  name: string
  description?: string
  createdAt: string
  _count: {
    users: number
    areas: number
    departments: number
  }
}

interface OrganizationsListProps {
  onUpdate: () => void
}

export function OrganizationsList({ onUpdate }: OrganizationsListProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)
  const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/super-admin/organizations")
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (organization: Organization) => {
    setEditingOrganization(organization)
    setShowEditDialog(true)
  }

  const handleDelete = (organization: Organization) => {
    setDeletingOrganization(organization)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingOrganization) return

    try {
      const response = await fetch(`/api/super-admin/organizations/${deletingOrganization.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Organization deleted successfully.",
        })
        setShowDeleteDialog(false)
        setDeletingOrganization(null)
        onUpdate()
        fetchOrganizations()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to delete organization",
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
    return <div className="text-center py-4">Loading organizations...</div>
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No organizations found. Create your first organization to get started.
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>Areas</TableHead>
            <TableHead>Departments</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell className="font-medium">{org.name}</TableCell>
              <TableCell>{org.description || "-"}</TableCell>
              <TableCell>
                <Badge variant="secondary">{org._count.users}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{org._count.areas}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{org._count.departments}</Badge>
              </TableCell>
              <TableCell>{formatDate(new Date(org.createdAt))}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(org)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(org)}
                      disabled={org._count.users > 0}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditOrganizationDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          onUpdate()
          fetchOrganizations()
        }}
        organization={editingOrganization}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingOrganization?.name}"? This action cannot be undone.
              {deletingOrganization?._count?.users > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  This organization has {deletingOrganization?._count?.users} users and cannot be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletingOrganization?._count.users > 0}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
