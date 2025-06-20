"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
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
import { EditDepartmentDialog } from "./edit-department-dialog"
import { useToast } from "@/hooks/use-toast"

interface Department {
  id: string
  name: string
  description?: string
  createdAt: string
  area?: {
    name: string
  }
  _count: {
    users: number
    templates: number
    inspections: number
  }
}

interface DepartmentsListProps {
  onUpdate: () => void
}

export function DepartmentsList({ onUpdate }: DepartmentsListProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/admin/departments")
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    setShowEditDialog(true)
  }

  const handleDelete = (department: Department) => {
    setDeletingDepartment(department)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingDepartment) return

    try {
      const response = await fetch(`/api/admin/departments/${deletingDepartment.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Department deleted successfully.",
        })
        setShowDeleteDialog(false)
        setDeletingDepartment(null)
        onUpdate()
        fetchDepartments()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to delete department",
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

  const canDelete = (department: Department) => {
    return department._count.users === 0 && department._count.templates === 0 && department._count.inspections === 0
  }

  if (loading) {
    return <div className="text-center py-4">Loading departments...</div>
  }

  if (departments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No departments found. Create your first department to get started.
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
            <TableHead>Area</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>Templates</TableHead>
            <TableHead>Inspections</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell className="font-medium">{dept.name}</TableCell>
              <TableCell>{dept.description || "-"}</TableCell>
              <TableCell>{dept.area?.name || "No area"}</TableCell>
              <TableCell>
                <Badge variant="secondary">{dept._count.users}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{dept._count.templates}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{dept._count.inspections}</Badge>
              </TableCell>
              <TableCell>{formatDate(new Date(dept.createdAt))}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(dept)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(dept)}
                      disabled={!canDelete(dept)}
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

      <EditDepartmentDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          onUpdate()
          fetchDepartments()
        }}
        department={editingDepartment}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDepartment?.name}"? This action cannot be undone.
              {deletingDepartment && !canDelete(deletingDepartment) && (
                <span className="block mt-2 text-red-600 font-medium">
                  This department has {deletingDepartment._count.users} users, {deletingDepartment._count.templates}{" "}
                  templates, and {deletingDepartment._count.inspections} inspections and cannot be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletingDepartment ? !canDelete(deletingDepartment) : true}
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
