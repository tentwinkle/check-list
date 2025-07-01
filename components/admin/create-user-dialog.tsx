"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Area {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
  areaId?: string
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [areas, setAreas] = useState<Area[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "INSPECTOR",
    areaId: "",
    departmentId: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchAreas()
      fetchDepartments()
    }
  }, [open])

  useEffect(() => {
    if (formData.areaId) {
      setFilteredDepartments(departments.filter((dept) => dept.areaId === formData.areaId))
    } else {
      setFilteredDepartments(departments)
    }
    // Reset department selection when area changes
    setFormData((prev) => ({ ...prev, departmentId: "" }))
  }, [formData.areaId, departments])

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

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/admin/departments")
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          areaId: formData.areaId === "" || formData.areaId === "none" ? "NONE" : formData.areaId,
          departmentId:
            formData.departmentId === "" || formData.departmentId === "none"
              ? "NONE"
              : formData.departmentId,
          password: formData.password || undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: formData.password
            ? "User created successfully."
            : "User created successfully. They will receive an email to set their password.",
        })
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "INSPECTOR",
          areaId: "",
          departmentId: "",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || error.message || "Failed to create user",
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
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user within your organization.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password (Optional)</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            disabled={loading}
          />
        </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INSPECTOR">Inspector</SelectItem>
                <SelectItem value="MINI_ADMIN">Area Leader</SelectItem>
                <SelectItem value="ADMIN">Team Leader</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <Select
              value={formData.departmentId}
              onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific department</SelectItem>
                {filteredDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
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
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
