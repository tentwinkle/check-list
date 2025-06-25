"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Camera, Type } from "lucide-react"
import { useRouter } from "next/navigation"
import { Html5QrcodeScanner } from "html5-qrcode"

interface QRScannerProps {
  open: boolean
  onClose: () => void
}

export function QRScanner({ open, onClose }: QRScannerProps) {
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [scannerInitialized, setScannerInitialized] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
  if (open && !showManualInput && !scannerInitialized) {
    // Wait for the Dialog to render the DOM node
    const interval = setInterval(() => {
      const readerElement = document.getElementById("qr-reader")
      if (readerElement) {
        try {
          scannerRef.current = new Html5QrcodeScanner("qr-reader", {
            fps: 10,
            qrbox: 250,
            rememberLastUsedCamera: true,
          })

          scannerRef.current.render(
            async (decodedText) => {
              if (decodedText) {
                handleQRCodeFound(decodedText)
              }
            },
            (error) => {
              // optional: console.warn(error)
            }
          )

          setScannerInitialized(true)
          clearInterval(interval)
        } catch (error) {
          console.error("Failed to initialize scanner:", error)
          toast({
            title: "Scanner Error",
            description: "Could not start QR scanner. Try manual entry.",
            variant: "destructive",
          })
          setShowManualInput(true)
          clearInterval(interval)
        }
      }
    }, 200)

    return () => clearInterval(interval)
  }

  return () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.warn)
      scannerRef.current = null
      setScannerInitialized(false)
    }
  }
}, [open, showManualInput])


  const handleQRCodeFound = async (qrCodeId: string) => {
    try {
      const response = await fetch(`/api/inspector/qr-scan/${qrCodeId}`)

      if (response.ok) {
        const data = await response.json()
        handleClose()

        router.push(`/inspector/inspection/${data.inspectionId}?item=${data.itemId}`)

        toast({
          title: "QR Code Found",
          description: `Navigating to ${data.itemName}`,
        })
      } else {
        toast({
          title: "QR Code Not Found",
          description: "This QR code is not associated with any current inspection.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process QR code",
        variant: "destructive",
      })
    }
  }

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      handleQRCodeFound(manualCode.trim())
      setManualCode("")
    }
  }

  const handleClose = () => {
    setManualCode("")
    setShowManualInput(false)
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.warn)
      scannerRef.current = null
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showManualInput ? (
            <div className="space-y-4">
              <div id="qr-reader" className="rounded-lg overflow-hidden" />
              <p className="text-sm text-gray-600 text-center">Position the QR code within the frame to scan</p>
              <Button variant="outline" onClick={() => setShowManualInput(true)} className="w-full">
                <Type className="mr-2 h-4 w-4" />
                Enter Code Manually
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-code">QR Code</Label>
                <Input
                  id="manual-code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter QR code (e.g., A1B2C3D4)"
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleManualSubmit} disabled={!manualCode.trim()} className="flex-1">
                  Find Item
                </Button>
                <Button variant="outline" onClick={() => setShowManualInput(false)}>
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
