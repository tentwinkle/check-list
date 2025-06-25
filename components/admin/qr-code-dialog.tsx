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
  selectedItem?: any
}

interface TemplateItem {
  id: string
  name: string
  location?: string
  qrCodeId: string
  qrCodeUrl: string
}

export function QRCodeDialog({ open, onOpenChange, templateId, selectedItem }: QRCodeDialogProps) {
  const [items, setItems] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchQRCodes()
    }
  }, [open, templateId])

  const fetchQRCodes = async () => {
    try {
      const response = await fetch(`/api/admin/template-items/qr-codes?templateId=${templateId}`)
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

  const handleDownload = async (item: TemplateItem) => {
    try {
      const response = await fetch(`/api/admin/template-items/qr-codes/${item.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `qr-${item.name.replace(/\s+/g, "-").toLowerCase()}.png`
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

  const handlePrintAll = () => {
    window.print()
  }

  const selectedFromList = selectedItem
    ? items.find((it) => it.id === selectedItem.id) || selectedItem
    : null
  const itemsToShow = selectedItem ? [selectedFromList] : items

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>QR Codes</DialogTitle>
          <DialogDescription>
            {selectedItem ? `QR Code for ${selectedItem.name}` : "QR codes for all template items"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handlePrintAll}>
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
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleDownload(item)}>
                      <Download className="mr-2 h-3 w-3" />
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
