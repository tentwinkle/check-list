"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  templateName: string
  selectedItem?: {
    qrCodeId: string
    qrCodeUrl: string
    id: string
    name: string
    location?: string
  }
}

interface TemplateItem {
  id: string
  name: string
  order: number
  qrCodeId: string
  qrCodeUrl: string
  location?: string
}

export function QRCodeDialog({ open, onOpenChange, templateId, templateName, selectedItem }: QRCodeDialogProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetchQRCodes()
    }
  }, [open, templateId])

  const fetchQRCodes = async () => {
    try {
      const response = await fetch(`/api/mini-admin/template-items/qr-codes?templateId=${templateId}&format=json`)
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error("Failed to fetch QR codes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadSingle = async (itemId: string, name: string) => {
    try {
      const response = await fetch(`/api/mini-admin/template-items/qr-codes/${itemId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-qr.png`
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

  const handlePrint = () => {
    window.print()
  }

  const selectedFromList = selectedItem
    ? items.find((it) => it.id === selectedItem.id) || selectedItem
    : null
  const itemsToShow = selectedItem ? (selectedFromList ? [selectedFromList] : []) : items

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          {selectedItem ? (
            <>
              <DialogTitle>QR Code - {selectedItem.name}</DialogTitle>
              <DialogDescription>QR code for this template item.</DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle>QR Codes - {templateName}</DialogTitle>
              <DialogDescription>
                QR codes for all checklist items. Print or download individual codes.
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print All
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading QR codes...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemsToShow.map((item) => (
                <Card key={item.id} className="print:break-inside-avoid">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{item.name}</CardTitle>
                    {item.location && <p className="text-xs text-gray-600">{item.location}</p>}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-center">
                      <img
                        src={item.qrCodeUrl || "/placeholder.svg"}
                        alt={`QR Code for ${item.name}`}
                        className="w-32 h-32"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-mono text-gray-500">{item.qrCodeId}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadSingle(item.id, item.name)}
                      className="w-full no-print"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
