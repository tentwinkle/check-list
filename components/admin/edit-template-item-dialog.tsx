"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { buildAdminApiUrl } from "@/lib/admin"

interface EditTemplateItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  item: {
    id: string
    name: string
    description?: string
    location?: string
  } | null
  onSuccess: () => void
  organizationId?: string
}

export function EditTemplateItemDialog({
  open,
  onOpenChange,
  templateId,
  item,
  onSuccess,
  organizationId,
}: EditTemplateItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "", location: "" })
  const { toast } = useToast()

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || "",
        location: item.location || "",
      })
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    setLoading(true)
    try {
      const response = await fetch(
        buildAdminApiUrl(`/api/admin/template-items/${item.id}`, organizationId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Template item updated successfully.",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to update template item",
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
          <DialogTitle>Edit Template Item</DialogTitle>
          <DialogDescription>Update the checklist item details.</DialogDescription>
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

