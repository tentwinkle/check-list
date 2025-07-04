"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { buildAdminApiUrl } from "@/lib/admin"

interface Area {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
  description?: string
  createdAt: string
  area?: {
    id: string
    name: string
  }
  _count: {
    users: number
    templates: number
    inspections: number
  }
}

interface EditDepartmentDialogProps {
  department: Department | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  organizationId?: string
}

export function EditDepartmentDialog({
  department,
  open,
  onOpenChange,
  onSuccess,
  organizationId,
}: EditDepartmentDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [areaId, setAreaId] = useState<string>("")
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (department) {
      setName(department.name)
      setDescription(department.description || "")
      setAreaId(department.area?.id || "NONE")
    }
  }, [department])

  useEffect(() => {
    if (open) {
      fetchAreas()
    }
  }, [open])

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
      console.error("Error fetching areas:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!department) return

    setLoading(true)
    try {
      const response = await fetch(
        buildAdminApiUrl(`/api/admin/departments/${department.id}`, organizationId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description: description || undefined,
            areaId: areaId === "NONE" ? null : areaId,
          }),
        },
      )

      if (response.ok) {
        toast.success("Department updated successfully")
        onSuccess()
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update department")
      }
    } catch (error) {
      toast.error("Failed to update department")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update the department information. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="area" className="text-right">
                Area (Optional)
              </Label>
              <Select value={areaId} onValueChange={setAreaId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No specific area</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
