"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Camera, Type } from "lucide-react"
import { useRouter } from "next/navigation"
import { Html5Qrcode, CameraDevice } from "html5-qrcode"

interface QRScannerProps {
  open: boolean
  onClose: () => void
}

export function QRScanner({ open, onClose }: QRScannerProps) {
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [cameraId, setCameraId] = useState<string>("")
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (open && !showManualInput) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          setCameras(devices)
          if (devices.length > 0) {
            setCameraId(devices[0].id)
          }
        })
        .catch((err) => {
          console.error("Camera error:", err)
          toast({
            title: "Camera Permission Needed",
            description: "Please allow camera access in your browser.",
            variant: "destructive",
          })
          setShowManualInput(true)
        })
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current.clear()
        scannerRef.current = null
      }
      setScanning(false)
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
    stopScan()
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
          {showManualInput ? (
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
          ) : (
            <div className="space-y-4">
              {scanning ? (
                <>
                  <div id="qr-reader" className="rounded-lg overflow-hidden" />
                  <p className="text-sm text-gray-600 text-center">Point the camera at a QR code</p>
                  <Button variant="outline" onClick={stopScan} className="w-full">
                    Stop Scanning
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="camera-select">Camera</Label>
                    <select
                      id="camera-select"
                      className="w-full rounded border px-3 py-2 bg-transparent"
                      value={cameraId}
                      onChange={(e) => setCameraId(e.target.value)}
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id} className="bg-gray-100 dark:bg-gray-800">
                          {c.label || c.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={startScan} disabled={!cameraId} className="w-full">
                    Start Scanning
                  </Button>
                  <Button variant="outline" onClick={() => setShowManualInput(true)} className="w-full">
                    <Type className="mr-2 h-4 w-4" />
                    Enter Code Manually
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
