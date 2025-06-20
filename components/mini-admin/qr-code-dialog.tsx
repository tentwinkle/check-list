"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  templateName: string
  items: any[]
}

export function QRCodeDialog({ open, onOpenChange, templateId, templateName, items }: QRCodeDialogProps) {
  const { toast } = useToast()

  const handleDownloadSingle = async (itemId: string, title: string) => {
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

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>QR Codes - {templateName}</DialogTitle>
          <DialogDescription>QR codes for all checklist items. Print or download individual codes.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <Button onClick={handlePrint} variant="outline">
              Print All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 text-center space-y-2">
                <div className="bg-white p-4 rounded border">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.qrCodeId)}`}
                    alt={`QR Code for ${item.title}`}
                    className="mx-auto"
                    style={{ width: "150px", height: "150px" }}
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-500">Order: {item.order}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadSingle(item.id, item.title)}
                  className="no-print"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
