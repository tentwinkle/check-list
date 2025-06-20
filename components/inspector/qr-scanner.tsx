"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Camera, Type } from "lucide-react"
import { useRouter } from "next/navigation"

interface QRScannerProps {
  open: boolean
  onClose: () => void
}

export function QRScanner({ open, onClose }: QRScannerProps) {
  const [hasCamera, setHasCamera] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (open) {
      checkCameraAvailability()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [open])

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasVideoInput = devices.some((device) => device.kind === "videoinput")
      setHasCamera(hasVideoInput)

      if (hasVideoInput) {
        startCamera()
      }
    } catch (error) {
      console.error("Error checking camera:", error)
      setHasCamera(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setScanning(true)

        // Start scanning for QR codes
        scanForQRCode()
      }
    } catch (error) {
      console.error("Error starting camera:", error)
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please use manual input.",
        variant: "destructive",
      })
      setShowManualInput(true)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      setTimeout(scanForQRCode, 100)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      // Simple QR code detection - in a real app, you'd use a library like jsQR
      // For now, we'll simulate detection and let users input manually
      setTimeout(scanForQRCode, 100)
    } catch (error) {
      console.error("Error scanning QR code:", error)
      setTimeout(scanForQRCode, 100)
    }
  }

  const handleQRCodeFound = async (qrCodeId: string) => {
    try {
      // Find inspection and item with this QR code
      const response = await fetch(`/api/inspector/qr-scan/${qrCodeId}`)

      if (response.ok) {
        const data = await response.json()
        stopCamera()
        onClose()

        // Navigate to the specific inspection and item
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
    stopCamera()
    setShowManualInput(false)
    setManualCode("")
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
          {hasCamera && !showManualInput ? (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 text-center">Position the QR code within the frame to scan</p>

              <Button variant="outline" onClick={() => setShowManualInput(true)} className="w-full">
                <Type className="mr-2 h-4 w-4" />
                Enter Code Manually
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!hasCamera && (
                <p className="text-sm text-gray-600 text-center">
                  Camera not available. Please enter the QR code manually.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="manual-code">QR Code</Label>
                <Input
                  id="manual-code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter QR code (e.g., abc123def456)"
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleManualSubmit} disabled={!manualCode.trim()} className="flex-1">
                  Find Item
                </Button>
                {hasCamera && (
                  <Button variant="outline" onClick={() => setShowManualInput(false)}>
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
