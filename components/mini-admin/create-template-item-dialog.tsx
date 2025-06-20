"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CreateTemplateItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  onSuccess: () => void
  editItem?: any
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
    title: editItem?.title || "",
    description: editItem?.description || "",
    type: editItem?.type || "CHECKBOX",
    isRequired: editItem?.isRequired || true,
    expectedValue: editItem?.expectedValue || "",
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
        setFormData({
          title: "",
          description: "",
          type: "CHECKBOX",
          isRequired: true,
          expectedValue: "",
        })
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit" : "Create"} Template Item</DialogTitle>
          <DialogDescription>
            {editItem ? "Update the" : "Add a new"} checklist item to this inspection template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Item Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Check fire extinguisher pressure"
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
              placeholder="Additional instructions or details..."
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Item Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CHECKBOX">Checkbox (Pass/Fail)</SelectItem>
                <SelectItem value="TEXT">Text Input</SelectItem>
                <SelectItem value="NUMBER">Number Input</SelectItem>
                <SelectItem value="PHOTO">Photo Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === "TEXT" && (
            <div className="space-y-2">
              <Label htmlFor="expectedValue">Expected Value (Optional)</Label>
              <Input
                id="expectedValue"
                value={formData.expectedValue}
                onChange={(e) => setFormData({ ...formData, expectedValue: e.target.value })}
                placeholder="Expected text value"
                disabled={loading}
              />
            </div>
          )}

          {formData.type === "NUMBER" && (
            <div className="space-y-2">
              <Label htmlFor="expectedValue">Expected Range (Optional)</Label>
              <Input
                id="expectedValue"
                value={formData.expectedValue}
                onChange={(e) => setFormData({ ...formData, expectedValue: e.target.value })}
                placeholder="e.g., 10-50 or >20"
                disabled={loading}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRequired"
              checked={formData.isRequired}
              onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked === true })}
            />
            <Label htmlFor="isRequired">This item is required</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editItem ? "Update" : "Create"} Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
