"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2, UserCog, LogIn } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
import { EditAdminDialog } from "./edit-admin-dialog"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

interface Organization {
  id: string
  name: string
  description?: string
  createdAt: string
  admin?: {
    id: string
    name: string
    email: string
  }
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
  const [showEditAdminDialog, setShowEditAdminDialog] = useState(false)
  const [editingAdminOrgId, setEditingAdminOrgId] = useState<string | null>(null)
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

  const handleEditAdmin = (organization: Organization) => {
    setEditingAdminOrgId(organization.id)
    setShowEditAdminDialog(true)
  }

  const handleDelete = (organization: Organization) => {
    setDeletingOrganization(organization)
    setShowDeleteDialog(true)
  }

  const handleLoginAsTeamLeader = (organization: Organization) => {
    // Store the Super Admin context with specific organization
    const superAdminContext = {
      originalRole: "SUPER_ADMIN",
      targetOrganization: {
        id: organization.id,
        name: organization.name,
      },
      loginAsAdmin: true,
      timestamp: Date.now(),
    }

    sessionStorage.setItem("superAdminContext", JSON.stringify(superAdminContext))

    toast({
      title: "Switching to Team Leader View",
      description: `Accessing ${organization.name} as Team Leader`,
    })

    // Redirect to admin dashboard
    window.location.href = "/admin"
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
            <TableHead>Organization</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>Areas</TableHead>
            <TableHead>Departments</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{org.name}</div>
                  {org.description && <div className="text-sm text-gray-500 mt-1">{org.description}</div>}
                </div>
              </TableCell>
              <TableCell>
                {org.admin ? (
                  <div>
                    <div className="font-medium">{org.admin.name}</div>
                    <div className="text-sm text-gray-500">{org.admin.email}</div>
                  </div>
                ) : (
                  <Badge variant="secondary">No Admin Assigned</Badge>
                )}
              </TableCell>
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
                    <DropdownMenuItem
                      onClick={() => handleLoginAsTeamLeader(org)}
                      className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Login as Team Leader
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEdit(org)} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Organization
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditAdmin(org)} className="cursor-pointer">
                      <UserCog className="mr-2 h-4 w-4" />
                      {org.admin ? "Edit Admin" : "Assign Admin"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 cursor-pointer hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(org)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Organization
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

      <EditAdminDialog
        open={showEditAdminDialog}
        onOpenChange={setShowEditAdminDialog}
        onSuccess={() => {
          onUpdate()
          fetchOrganizations()
        }}
        organizationId={editingAdminOrgId}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingOrganization?.name}"? This action cannot be undone and will
              permanently remove all associated data including:
              {deletingOrganization && (
                <div className="mt-3 space-y-1 text-sm">
                  <div>• {deletingOrganization._count.users} users</div>
                  <div>• {deletingOrganization._count.areas} areas</div>
                  <div>• {deletingOrganization._count.departments} departments</div>
                  <div>• All templates and inspections</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={!deletingOrganization}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
