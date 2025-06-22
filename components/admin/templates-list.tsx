"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
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
import { EditTemplateDialog } from "./edit-template-dialog"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string
  name: string
  description?: string
  frequency: number
  createdAt: string
  department?: {
    name: string
  }
  _count: {
    checklistItems: number
    inspections: number
  }
}

interface TemplatesListProps {
  onUpdate: () => void
}

export function TemplatesList({ onUpdate }: TemplatesListProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/admin/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setShowEditDialog(true)
  }

  const handleDelete = (template: Template) => {
    setDeletingTemplate(template)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingTemplate) return

    try {
      const response = await fetch(`/api/admin/templates/${deletingTemplate.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Template deleted successfully.",
        })
        setShowDeleteDialog(false)
        setDeletingTemplate(null)
        onUpdate()
        fetchTemplates()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to delete template",
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

  const canDelete = (_template: Template) => {
    return true
  }

  if (loading) {
    return <div className="text-center py-4">Loading templates...</div>
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No templates found. Create your first template to get started.
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
            <TableHead>Department</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Inspections</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell className="font-medium">{template.name}</TableCell>
              <TableCell>{template.description || "-"}</TableCell>
              <TableCell>{template.department?.name || "All departments"}</TableCell>
              <TableCell>{template.frequency} days</TableCell>
              <TableCell>
                <Badge variant="secondary">{template._count.checklistItems}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{template._count.inspections}</Badge>
              </TableCell>
              <TableCell>{formatDate(new Date(template.createdAt))}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.open(`/admin/templates/${template.id}/items`, "_blank")}>
                      <Eye className="mr-2 h-4 w-4" />
                      Manage Items
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(template)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(template)}
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
      <EditTemplateDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        template={editingTemplate}
        onSuccess={() => {
          onUpdate()
          fetchTemplates()
        }}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTemplate?.name}"? This action cannot be undone.
              {deletingTemplate && (
                <span className="block mt-2 text-red-600 font-medium">
                  This template has {deletingTemplate._count.inspections} inspections.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={!deletingTemplate}
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
