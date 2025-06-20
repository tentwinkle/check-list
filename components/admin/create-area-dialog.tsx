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

interface CreateAreaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateAreaDialog({ open, onOpenChange, onSuccess }: CreateAreaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    areaName: "",
    areaDescription: "",
    leaderName: "",
    leaderEmail: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/areas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Area created successfully. Leader will receive an email to set their password.",
        })
        setFormData({
          areaName: "",
          areaDescription: "",
          leaderName: "",
          leaderEmail: "",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to create area",
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
          <DialogTitle>Create New Area</DialogTitle>
          <DialogDescription>Create a new area and assign a leader to manage it.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="areaName">Area Name</Label>
            <Input
              id="areaName"
              value={formData.areaName}
              onChange={(e) => setFormData({ ...formData, areaName: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="areaDescription">Description (Optional)</Label>
            <Textarea
              id="areaDescription"
              value={formData.areaDescription}
              onChange={(e) => setFormData({ ...formData, areaDescription: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaderName">Area Leader Name</Label>
            <Input
              id="leaderName"
              value={formData.leaderName}
              onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaderEmail">Area Leader Email</Label>
            <Input
              id="leaderEmail"
              type="email"
              value={formData.leaderEmail}
              onChange={(e) => setFormData({ ...formData, leaderEmail: e.target.value })}
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
              Create Area
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
