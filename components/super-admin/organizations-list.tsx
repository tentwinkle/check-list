"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { toast } from "sonner"
import { MoreHorizontal, Edit, Trash2, User, Building, Calendar, Shield, Crown } from "lucide-react"

interface Organization {
  id: string
  name: string
  description: string | null
  createdAt: string
  admin: {
    id: string
    name: string
    email: string
  } | null
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editAdminDialogOpen, setEditAdminDialogOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/super-admin/organizations")
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      } else {
        toast.error("Failed to fetch organizations")
      }
    } catch (error) {
      console.error("Error fetching organizations:", error)
      toast.error("Failed to fetch organizations")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedOrganization) return

    try {
      const response = await fetch(`/api/super-admin/organizations/${selectedOrganization.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Organization deleted successfully")
        fetchOrganizations()
        onUpdate()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete organization")
      }
    } catch (error) {
      console.error("Error deleting organization:", error)
      toast.error("Failed to delete organization")
    } finally {
      setDeleteDialogOpen(false)
      setSelectedOrganization(null)
    }
  }

  const handleLoginAsTeamLeader = (organization: Organization) => {
    try {
      // Store Super Admin context in sessionStorage
      const context = {
        originalRole: "SUPER_ADMIN",
        targetOrganization: {
          id: organization.id,
          name: organization.name,
        },
        loginAsAdmin: true,
        timestamp: Date.now(),
      }

      sessionStorage.setItem("superAdminContext", JSON.stringify(context))

      // Show success message
      toast.success(`Switching to Team Leader view for ${organization.name}`)

      // Redirect to admin dashboard with a small delay to ensure context is set
      setTimeout(() => {
        window.location.href = "/admin"
      }, 500)
    } catch (error) {
      console.error("Error setting Super Admin context:", error)
      toast.error("Failed to switch to Team Leader view")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organizations</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first organization.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((organization) => (
          <Card key={organization.id} className="glass hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-1">{organization.name}</CardTitle>
                  {organization.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{organization.description}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => handleLoginAsTeamLeader(organization)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Login as Team Leader
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedOrganization(organization)
                        setEditDialogOpen(true)
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Organization
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedOrganization(organization)
                        setEditAdminDialogOpen(true)
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Edit Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedOrganization(organization)
                        setDeleteDialogOpen(true)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Organization
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Admin Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{organization.admin?.name || "No Admin"}</p>
                  <p className="text-sm text-gray-500 truncate">{organization.admin?.email || "No admin assigned"}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">{organization._count.users}</div>
                  <div className="text-xs text-blue-600">Users</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">{organization._count.areas}</div>
                  <div className="text-xs text-green-600">Areas</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <div className="text-lg font-semibold text-purple-600">{organization._count.departments}</div>
                  <div className="text-xs text-purple-600">Departments</div>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="mr-2 h-4 w-4" />
                Created {formatDate(organization.createdAt)}
              </div>

              {/* Quick Action Button */}
              <Button
                onClick={() => handleLoginAsTeamLeader(organization)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                size="sm"
              >
                <Crown className="mr-2 h-4 w-4" />
                Login as Team Leader
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedOrganization?.name}"? This action cannot be undone and will
              permanently delete all associated data including users, areas, departments, and inspections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Organization Dialog */}
      <EditOrganizationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        organization={selectedOrganization}
        onSuccess={() => {
          fetchOrganizations()
          onUpdate()
          setSelectedOrganization(null)
        }}
      />

      {/* Edit Admin Dialog */}
      <EditAdminDialog
        open={editAdminDialogOpen}
        onOpenChange={setEditAdminDialogOpen}
        organization={selectedOrganization}
        onSuccess={() => {
          fetchOrganizations()
          onUpdate()
          setSelectedOrganization(null)
        }}
      />
    </>
  )
}
