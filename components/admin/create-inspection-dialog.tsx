"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Calendar, User, FileText } from "lucide-react"
import { format } from "date-fns"

interface CreateInspectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Template {
  id: string
  name: string
  frequency: number
  department?: {
    name: string
  }
}

interface Inspector {
  id: string
  name: string
  email: string
  role: string
  department?: {
    name: string
  }
}

export function CreateInspectionDialog({ open, onOpenChange, onSuccess }: CreateInspectionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [inspectors, setInspectors] = useState<Inspector[]>([])
  const [formData, setFormData] = useState({
    templateId: "",
    inspectorId: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchTemplates()
      fetchInspectors()
    }
  }, [open])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/admin/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      } else {
        throw new Error("Failed to fetch templates")
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      })
    }
  }

  const fetchInspectors = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        // Filter only inspectors
        const inspectorUsers = data.filter((user: Inspector) => user.role === "INSPECTOR")
        setInspectors(inspectorUsers)
      } else {
        throw new Error("Failed to fetch users")
      }
    } catch (error) {
      console.error("Failed to fetch inspectors:", error)
      toast({
        title: "Error",
        description: "Failed to load inspectors",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/inspections/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Inspection created successfully.",
        })
        setFormData({
          templateId: "",
          inspectorId: "",
          dueDate: format(new Date(), "yyyy-MM-dd"),
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create inspection",
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

  const selectedTemplate = templates.find((t) => t.id === formData.templateId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Inspection
          </DialogTitle>
          <DialogDescription>Manually assign an inspection to an inspector.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Template
            </Label>
            <Select
              value={formData.templateId}
              onValueChange={(value) => setFormData({ ...formData, templateId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      {template.department && <div className="text-xs text-gray-500">{template.department.name}</div>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-xs text-gray-500">Frequency: Every {selectedTemplate.frequency} days</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspector" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Inspector
            </Label>
            <Select
              value={formData.inspectorId}
              onValueChange={(value) => setFormData({ ...formData, inspectorId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an inspector" />
              </SelectTrigger>
              <SelectContent>
                {inspectors.map((inspector) => (
                  <SelectItem key={inspector.id} value={inspector.id}>
                    <div>
                      <div className="font-medium">{inspector.name}</div>
                      <div className="text-xs text-gray-500">{inspector.email}</div>
                      {inspector.department && <div className="text-xs text-gray-500">{inspector.department.name}</div>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Inspection
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
