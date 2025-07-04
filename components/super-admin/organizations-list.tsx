"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import {
  MoreHorizontal,
  Edit,
  Trash2,
  UserCog,
  Crown,
  Building,
  Calendar,
  Shield,
  Users,
  MapPin,
  Briefcase,
} from "lucide-react"

interface Organization {
  id: string
  name: string
  description?: string
  createdAt: string
  admin?: {
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
        console.log("Fetched organizations:", data) // Debug log
        setOrganizations(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch organizations",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
      toast({
        title: "Error",
        description: "Failed to fetch organizations",
        variant: "destructive",
      })
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
    try {
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

      // Use window.location.href for a full page reload to ensure context is properly set
      setTimeout(() => {
        window.location.href = "/admin"
      }, 500)
    } catch (error) {
      console.error("Failed to switch to team leader view:", error)
      toast({
        title: "Error",
        description: "Failed to switch to team leader view",
        variant: "destructive",
      })
    }
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
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
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
          <Card
            key={organization.id}
            className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    {organization.name}
                  </CardTitle>
                  {organization.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{organization.description}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => handleLoginAsTeamLeader(organization)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Login as Team Leader
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEdit(organization)} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Organization
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditAdmin(organization)} className="cursor-pointer">
                      <UserCog className="mr-2 h-4 w-4" />
                      {organization.admin ? "Edit Admin" : "Assign Admin"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(organization)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
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
                  {organization.admin ? (
                    <>
                      <p className="text-sm font-medium text-gray-900 truncate">{organization.admin.name}</p>
                      <p className="text-sm text-gray-500 truncate">{organization.admin.email}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-500">No Admin Assigned</p>
                      <p className="text-xs text-gray-400">Click "Assign Admin" to add one</p>
                    </>
                  )}
                </div>
                {organization.admin && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    Active
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-lg font-semibold text-blue-600">{organization._count.users}</div>
                  <div className="text-xs text-blue-600 font-medium">Users</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center justify-center mb-1">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-lg font-semibold text-green-600">{organization._count.areas}</div>
                  <div className="text-xs text-green-600 font-medium">Areas</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-center mb-1">
                    <Briefcase className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-lg font-semibold text-purple-600">{organization._count.departments}</div>
                  <div className="text-xs text-purple-600 font-medium">Departments</div>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center text-sm text-gray-500 px-1">
                <Calendar className="mr-2 h-4 w-4" />
                Created {formatDate(new Date(organization.createdAt))}
              </div>

              {/* Quick Action Button */}
              <Button
                onClick={() => handleLoginAsTeamLeader(organization)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                size="sm"
              >
                <Crown className="mr-2 h-4 w-4" />
                Login as Team Leader
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Organization Dialog */}
      <EditOrganizationDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          onUpdate()
          fetchOrganizations()
        }}
        organization={editingOrganization}
      />

      {/* Edit Admin Dialog */}
      <EditAdminDialog
        open={showEditAdminDialog}
        onOpenChange={setShowEditAdminDialog}
        onSuccess={() => {
          onUpdate()
          fetchOrganizations()
        }}
        organizationId={editingAdminOrgId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingOrganization?.name}"? This action cannot be undone and will
              permanently remove all associated data including:
              {deletingOrganization && (
                <div className="mt-3 space-y-1 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {deletingOrganization._count.users} users
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {deletingOrganization._count.areas} areas
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    {deletingOrganization._count.departments} departments
                  </div>
                  <div className="text-red-600 mt-2">• All templates and inspections</div>
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
