"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2, ChevronUp, ChevronDown, QrCode } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CreateTemplateItemDialog } from "./create-template-item-dialog"
import { useToast } from "@/hooks/use-toast"

interface TemplateItem {
  id: string
  name: string
  description?: string
  location?: string
  order: number
  qrCodeId: string
}

interface TemplateItemsListProps {
  templateId: string
  items: TemplateItem[]
  onUpdate: () => void
  onShowQR: (item: TemplateItem) => void
}

export function TemplateItemsList({ templateId, items, onUpdate, onShowQR }: TemplateItemsListProps) {
  const [editingItem, setEditingItem] = useState<TemplateItem | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDelete = async (itemId: string) => {
    setLoading(itemId)
    try {
      const response = await fetch(`/api/mini-admin/template-items/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Template item deleted successfully",
        })
        onUpdate()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to delete template item",
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
      setLoading(null)
    }
  }

  const handleReorder = async (itemId: string, direction: "up" | "down") => {
    setLoading(itemId)
    try {
      const response = await fetch(`/api/mini-admin/template-items/${itemId}/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ direction }),
      })

      if (response.ok) {
        onUpdate()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to reorder item",
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
      setLoading(null)
    }
  }

  const handleDownloadQR = async (itemId: string, title: string) => {
    try {
      const response = await fetch(`/api/mini-admin/template-items/qr-codes/${itemId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-qr.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      })
    }
  }


  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No items found. Add your first checklist item to get started.
      </div>
    )
  }

  const sortedItems = [...items].sort((a, b) => a.order - b.order)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Order</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>QR Code</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{item.order}</span>
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => handleReorder(item.id, "up")}
                      disabled={index === 0 || loading === item.id}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => handleReorder(item.id, "down")}
                      disabled={index === sortedItems.length - 1 || loading === item.id}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.description || "-"}</TableCell>
              <TableCell>{item.location || "-"}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShowQR(item)}
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingItem(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Template Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{item.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingItem && (
        <CreateTemplateItemDialog
          open={!!editingItem}
          onOpenChange={() => setEditingItem(null)}
          templateId={templateId}
          editItem={editingItem}
          onSuccess={onUpdate}
        />
      )}
    </>
  )
}
