"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, QrCode, Download } from "lucide-react"
import { CreateTemplateItemDialog } from "./create-template-item-dialog"
import { TemplateItemsList } from "./template-items-list"
import { QRCodeDialog } from "./qr-code-dialog"
import { useToast } from "@/hooks/use-toast"

interface TemplateItemsManagementProps {
  templateId: string
  templateName: string
  onUpdate: () => void
}

export function MiniAdminTemplateItemsManagement({ templateId, templateName, onUpdate }: TemplateItemsManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/mini-admin/template-items?templateId=${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error("Failed to fetch items:", error)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [templateId])

  const handleDownloadAllQR = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/mini-admin/template-items/qr-codes?templateId=${templateId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${templateName}-qr-codes.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "QR codes downloaded successfully",
        })
      } else {
        throw new Error("Failed to download QR codes")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download QR codes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template Items - {templateName}</CardTitle>
              <CardDescription>Manage checklist items for this inspection template</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowQRDialog(true)} disabled={items.length === 0}>
                <QrCode className="mr-2 h-4 w-4" />
                View QR Codes
              </Button>
              <Button variant="outline" onClick={handleDownloadAllQR} disabled={items.length === 0 || loading}>
                <Download className="mr-2 h-4 w-4" />
                Download All QR
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TemplateItemsList
            templateId={templateId}
            items={items}
            onUpdate={() => {
              fetchItems()
              onUpdate()
            }}
          />
        </CardContent>
      </Card>

      <CreateTemplateItemDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        templateId={templateId}
        onSuccess={() => {
          fetchItems()
          onUpdate()
        }}
      />

      <QRCodeDialog
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
        templateId={templateId}
        templateName={templateName}
        items={items}
      />
    </div>
  )
}
