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
import { EditAreaDialog } from "./edit-area-dialog"
import { useToast } from "@/hooks/use-toast"
import { buildAdminApiUrl } from "@/lib/admin"
import { formatDate } from "@/lib/utils"

interface Area {
  id: string
  name: string
  description?: string
  createdAt: string
  _count: {
    users: number
    departments: number
  }
}

interface AreasListProps {
  onUpdate: () => void
  organizationId?: string
}

export function AreasList({ onUpdate, organizationId }: AreasListProps) {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [deletingArea, setDeletingArea] = useState<Area | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    try {
      const response = await fetch(
        buildAdminApiUrl("/api/admin/areas", organizationId),
      )
      if (response.ok) {
        const data = await response.json()
        setAreas(data)
      }
    } catch (error) {
      console.error("Failed to fetch areas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (area: Area) => {
    setEditingArea(area)
    setShowEditDialog(true)
  }

  const handleDelete = (area: Area) => {
    setDeletingArea(area)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingArea) return

    try {
      const response = await fetch(
        buildAdminApiUrl(`/api/admin/areas/${deletingArea.id}`, organizationId),
        {
          method: "DELETE",
        },
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Area deleted successfully.",
        })
        setShowDeleteDialog(false)
        setDeletingArea(null)
        onUpdate()
        fetchAreas()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to delete area",
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

  const canDelete = (_area: Area) => {
    return true
  }

  if (loading) {
    return <div className="text-center py-4">Loading areas...</div>
  }

  if (areas.length === 0) {
    return <div className="text-center py-8 text-gray-500">No areas found. Create your first area to get started.</div>
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>Departments</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {areas.map((area) => (
            <TableRow key={area.id}>
              <TableCell className="font-medium">{area.name}</TableCell>
              <TableCell>{area.description || "-"}</TableCell>
              <TableCell>
                <Badge variant="secondary">{area._count.users}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{area._count.departments}</Badge>
              </TableCell>
              <TableCell>{formatDate(new Date(area.createdAt))}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(area)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(area)}
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

      <EditAreaDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          onUpdate()
          fetchAreas()
        }}
        area={editingArea}
        organizationId={organizationId}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Area</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingArea?.name}"? This action cannot be undone.
              {deletingArea && (
                <span className="block mt-2 text-red-600 font-medium">
                  This area has {deletingArea._count.users} users and {deletingArea._count.departments} departments.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={!deletingArea}
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
