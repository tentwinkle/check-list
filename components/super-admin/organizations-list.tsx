"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { EditOrganizationDialog } from "./edit-organization-dialog"
import { EditAdminDialog } from "./edit-admin-dialog"
import { MoreHorizontal, Edit, UserCog, Shield, Trash2 } from 'lucide-react'
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
    templates: number
  }
}

interface OrganizationsListProps {
  onUpdate: () => void
}

export function OrganizationsList({ onUpdate }: OrganizationsListProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [editingAdmin, setEditingAdmin] = useState<{ org: Organization; admin: any } | null>(null)
  const router = useRouter()

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
      toast.error("Failed to load organizations")
    } finally {
      setLoading(false)
    }
  }

  const handleLoginAsTeamLeader = async (organizationId: string, organizationName: string) => {
    try {
      // Store the original role and organization context
      sessionStorage.setItem('superAdminContext', JSON.stringify({
        originalRole: 'SUPER_ADMIN',
        actingAsRole: 'ADMIN',
        targetOrganizationId: organizationId,
        targetOrganizationName: organizationName
      }))
      
      // Redirect to admin dashboard with organization context
      router.push(`/admin?org=${organizationId}`)
      toast.success(`Switched to Team Leader view for ${organizationName}`)
    } catch (error) {
      console.error("Failed to switch context:", error)
      toast.error("Failed to switch to Team Leader view")
    }
  }

  const handleDeleteOrganization = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/super-admin/organizations/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Organization deleted successfully")
        fetchOrganizations()
        onUpdate()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to delete organization")
      }
    } catch (error) {
      console.error("Failed to delete organization:", error)
      toast.error("Failed to delete organization")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No organizations found</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Areas</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead>Templates</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{org.name}</div>
                    {org.description && (
                      <div className="text-sm text-muted-foreground">{org.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {org.admin ? (
                    <div>
                      <div className="font-medium">{org.admin.name}</div>
                      <div className="text-sm text-muted-foreground">{org.admin.email}</div>
                    </div>
                  ) : (
                    <Badge variant="outline">No Admin</Badge>
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
                <TableCell>
                  <Badge variant="secondary">{org._count.templates}</Badge>
                </TableCell>
                <TableCell>
                  {new Date(org.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleLoginAsTeamLeader(org.id, org.name)}
                        className="cursor-pointer"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Login as Team Leader
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setEditingOrg(org)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Organization
                      </DropdownMenuItem>
                      {org.admin && (
                        <DropdownMenuItem
                          onClick={() => setEditingAdmin({ org, admin: org.admin })}
                          className="cursor-pointer"
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          Edit Admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteOrganization(org.id, org.name)}
                        className="cursor-pointer text-red-600 hover:text-red-700"
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
      </div>

      {editingOrg && (
        <EditOrganizationDialog
          organization={editingOrg}
          open={!!editingOrg}
          onOpenChange={(open) => !open && setEditingOrg(null)}
          onSuccess={() => {
            fetchOrganizations()
            onUpdate()
            setEditingOrg(null)
          }}
        />
      )}

      {editingAdmin && (
        <EditAdminDialog
          organizationId={editingAdmin.org.id}
          admin={editingAdmin.admin}
          open={!!editingAdmin}
          onOpenChange={(open) => !open && setEditingAdmin(null)}
          onSuccess={() => {
            fetchOrganizations()
            onUpdate()
            setEditingAdmin(null)
          }}
        />
      )}
    </>
  )
}