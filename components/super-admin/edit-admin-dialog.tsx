"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface EditAdminDialogProps {
  organizationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface AdminUser {
  id: string
  name?: string
  email: string
}

export function EditAdminDialog({ organizationId, open, onOpenChange, onSuccess }: EditAdminDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (open && organizationId) {
      fetchAdmin()
    }
  }, [open, organizationId])

  const fetchAdmin = async () => {
    if (!organizationId) return
    setLoadingData(true)
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/admin`)
      if (response.ok) {
        const data = await response.json()
        setAdmin(data)
        setName(data.name || "")
        setEmail(data.email)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to load admin",
          variant: "destructive",
        })
        onOpenChange(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      onOpenChange(false)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admin) return

    setLoading(true)
    try {
      const response = await fetch(`/api/super-admin/users/${admin.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin updated successfully.",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update admin",
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
          <DialogTitle>Edit Admin</DialogTitle>
        </DialogHeader>
        {loadingData ? (
          <div className="py-4 text-center">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                Update Admin
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
