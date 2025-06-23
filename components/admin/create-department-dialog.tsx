"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CreateDepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Area {
  id: string
  name: string
}

export function CreateDepartmentDialog({ open, onOpenChange, onSuccess }: CreateDepartmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [areas, setAreas] = useState<Area[]>([])
  const [formData, setFormData] = useState({
    departmentName: "",
    departmentDescription: "",
    areaId: "none",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchAreas()
    }
  }, [open])

  const fetchAreas = async () => {
    try {
      const response = await fetch("/api/admin/areas")
      if (response.ok) {
        const data = await response.json()
        setAreas(data)
      }
    } catch (error) {
      console.error("Failed to fetch areas:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Department created successfully.",
        })
        setFormData({
          departmentName: "",
          departmentDescription: "",
          areaId: "none",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || error.message || "Failed to create department",
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
          <DialogTitle>Create New Department</DialogTitle>
          <DialogDescription>Create a new department within your organization.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="departmentName">Department Name</Label>
            <Input
              id="departmentName"
              value={formData.departmentName}
              onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="departmentDescription">Description (Optional)</Label>
            <Textarea
              id="departmentDescription"
              value={formData.departmentDescription}
              onChange={(e) => setFormData({ ...formData, departmentDescription: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Area (Optional)</Label>
            <Select value={formData.areaId} onValueChange={(value) => setFormData({ ...formData, areaId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select area (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific area</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Department
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
