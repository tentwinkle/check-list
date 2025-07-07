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
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingItems, setLoadingItems] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useToast()

  const fetchItems = async () => {
    setLoadingItems(true)
    try {
      const response = await fetch(`/api/mini-admin/template-items?templateId=${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error("Failed to fetch items:", error)
    } finally {
      setLoadingItems(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [templateId, refreshKey])

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

  const handleShowQR = (item: any) => {
    setSelectedItem(item)
    setShowQRDialog(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Template Items - {templateName}</CardTitle>
              <CardDescription>Manage checklist items for this inspection template</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full sm:w-auto sm:block">
              <Button variant="outline" onClick={() => setShowQRDialog(true)} disabled={items.length === 0} className="w-full sm:w-auto">
                <QrCode className="mr-2 h-4 w-4" />
                View QR Codes
              </Button>
              <Button variant="outline" onClick={handleDownloadAllQR} disabled={items.length === 0 || loading} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download All QR
              </Button>
              <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          {loadingItems ? (
            <div className="text-center py-4">Loading items...</div>
          ) : (
            <TemplateItemsList
              templateId={templateId}
              items={items}
              onUpdate={() => {
                setRefreshKey((k) => k + 1)
                onUpdate()
              }}
              onShowQR={handleShowQR}
            />
          )}
        </CardContent>
      </Card>

      <CreateTemplateItemDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        templateId={templateId}
        onSuccess={() => {
          setRefreshKey((k) => k + 1)
          onUpdate()
        }}
      />

      <QRCodeDialog
        open={showQRDialog}
        onOpenChange={(open) => {
          setShowQRDialog(open)
          if (!open) setSelectedItem(null)
        }}
        templateId={templateId}
        templateName={templateName}
        selectedItem={selectedItem ?? undefined}
      />
    </div>
  )
}
