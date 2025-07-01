"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Camera, Type } from "lucide-react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const QrScanner = dynamic(() => import("react-qr-barcode-scanner"), { ssr: false })

interface QRScannerProps {
  open: boolean
  onClose: () => void
}

export function QRScanner({ open, onClose }: QRScannerProps) {
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!open) {
      setManualCode("")
      setShowManualInput(false)
      setErrorMsg("")
    }
  }, [open])

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

  const startScan = async () => {
    if (!cameraId) return
    try {
      // Request permission first so we can provide clearer errors
      await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: cameraId } },
      })

      scannerRef.current = new Html5Qrcode("qr-reader")
      await scannerRef.current.start(
        { deviceId: { exact: cameraId } },
        { fps: 10, qrbox: 250 },
        (decoded) => decoded && handleQRCodeFound(decoded),
        () => {}
      )
      setScanning(true)
    } catch (error) {
      console.error("Failed to start scan:", error)
      const message =
        error instanceof Error ? error.message : "Unable to start camera."
      toast({
        title: "Scanner Error",
        description: message,
        variant: "destructive",
      })
    }
  }

  const stopScan = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {})
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setScanning(false)
  }

  const handleClose = () => {
    setManualCode("")
    setShowManualInput(false)
    setErrorMsg("")
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
            <>
              <div className="rounded-lg overflow-hidden bg-black">
                <QrScanner
                  onUpdate={(err, result) => {
                    if (result) {
                      handleQRCodeFound(result.text)
                      setErrorMsg("") // Clear any previous error
                    } else if (err) {
                      if (
                        err.name === "NotAllowedError" || // permission denied
                        err.name === "NotFoundError" ||   // no camera found
                        err.name === "NotReadableError"   // hardware issue
                      ) {
                        setErrorMsg("Camera access failed or is not supported by this device.")
                      } else {
                        setErrorMsg("") // clear message for harmless detection misses
                      }
                    }
                  }}
                  constraints={{ facingMode: "environment" }}
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
              {errorMsg && (
                <p className="text-sm text-red-500 text-center">{errorMsg}</p>
              )}
              <p className="text-sm text-gray-600 text-center">
                Position the QR code within the frame
              </p>
              <Button
                variant="outline"
                onClick={() => setShowManualInput(true)}
                className="w-full"
              >
                <Type className="mr-2 h-4 w-4" />
                Enter Code Manually
              </Button>
            </>
          ) : (
            <>
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
                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualCode.trim()}
                  className="flex-1"
                >
                  Find Item
                </Button>
                <Button variant="outline" onClick={() => setShowManualInput(false)}>
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
