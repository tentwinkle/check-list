"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CreateTemplateItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  onSuccess: () => void
  editItem?: {
    id: string
    name: string
    description?: string
    location?: string
  }
}

export function CreateTemplateItemDialog({
  open,
  onOpenChange,
  templateId,
  onSuccess,
  editItem,
}: CreateTemplateItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: editItem?.name || "",
    description: editItem?.description || "",
    location: editItem?.location || "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editItem ? `/api/mini-admin/template-items/${editItem.id}` : `/api/mini-admin/template-items`
      const method = editItem ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          templateId: editItem ? undefined : templateId,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Template item ${editItem ? "updated" : "created"} successfully.`,
        })
        setFormData({ name: "", description: "", location: "" })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || `Failed to ${editItem ? "update" : "create"} template item`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit" : "Add"} Template Item</DialogTitle>
          <DialogDescription>
            {editItem ? "Update the" : "Add a new"} checklist item to this template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
              placeholder="e.g., Check fire extinguisher"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              placeholder="Detailed instructions for this check"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              disabled={loading}
              placeholder="e.g., Main hallway, Room 101"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editItem ? "Update" : "Add"} Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
