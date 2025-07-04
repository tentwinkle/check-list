"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navigation } from "@/components/ui/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, ArrowLeft, ArrowRight, Save, Send, Download } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface InspectionItem {
  id: string
  name: string
  description?: string
  location?: string
  qrCodeId: string
  order: number
  result?: {
    id: string
    approved: boolean
    comments?: string
    imageUrl?: string
  }
}

interface InspectionData {
  id: string
  dueDate: string
  status: string
  masterTemplate: {
    name: string
    description?: string
  }
  department: {
    name: string
  }
  checklistItems: InspectionItem[]
}

interface InspectionInterfaceProps {
  inspectionId: string
}

export function InspectionInterface({ inspectionId }: InspectionInterfaceProps) {
  const [inspection, setInspection] = useState<InspectionData | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const initialize = async () => {
      const data = await fetchInspection()
      if (!data) return

      // Handle QR code navigation after inspection is loaded
      const itemParam = searchParams.get("item")
      if (itemParam) {
        const itemIndex = data.checklistItems.findIndex((item) => item.id === itemParam)
        if (itemIndex !== -1) {
          setCurrentItemIndex(itemIndex)
        }
      }
    }

    initialize()
  }, [inspectionId, searchParams])

  const fetchInspection = async (): Promise<InspectionData | null> => {
    try {
      const response = await fetch(`/api/inspector/inspections/${inspectionId}`)
      if (response.ok) {
        const data: InspectionData = await response.json()
        setInspection(data)
        return data
      }

      // Handle non-OK responses
      const error = await response.json().catch(() => ({}))
      toast({
        title: "Error",
        description: error.message || "Failed to load inspection",
        variant: "destructive",
      })
      router.push("/inspector")
      return null
    } catch (error) {
      console.error("Failed to fetch inspection:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      router.push("/inspector")
      return null
    } finally {
      setLoading(false)
    }
  }

  const saveItemResult = async (itemId: string, approved: boolean, comments?: string, imageFile?: File) => {
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append("approved", approved.toString())
      if (comments) formData.append("comments", comments)
      if (imageFile) formData.append("image", imageFile)

      const response = await fetch(`/api/inspector/inspections/${inspectionId}/items/${itemId}`, {
        method: "PUT",
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Item result saved",
        })
        fetchInspection() // Refresh data
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to save result",
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
      setSaving(false)
    }
  }

  const submitInspection = async () => {
    if (!inspection) return

    // Check if all items are completed
    const incompleteItems = inspection.checklistItems.filter((item) => !item.result)
    if (incompleteItems.length > 0) {
      toast({
        title: "Incomplete Inspection",
        description: `Please complete all ${incompleteItems.length} remaining items before submitting.`,
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/inspector/inspections/${inspectionId}/submit`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Inspection submitted successfully",
        })
        fetchInspection() // Refresh to show completed status
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to submit inspection",
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
      setSubmitting(false)
    }
  }

  const downloadPDF = async () => {
    if (!inspection) return

    setDownloadingPdf(true)

    try {
      const response = await fetch(`/api/inspector/inspections/${inspectionId}/generate-pdf`, {
        method: "POST",
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `inspection_${inspection.masterTemplate.name}_${new Date().toISOString().split("T")[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "PDF downloaded successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to generate PDF",
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
      setDownloadingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading inspection...</div>
        </div>
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Inspection not found</div>
        </div>
      </div>
    )
  }

  const currentItem = inspection.checklistItems[currentItemIndex]
  const completedItems = inspection.checklistItems.filter((item) => item.result).length
  const totalItems = inspection.checklistItems.length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto mobile-padding py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Button variant="outline" onClick={() => router.push("/inspector")} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {completedItems} of {totalItems} completed
              </Badge>
              {inspection.status === "COMPLETED" && (
                <Button variant="outline" onClick={downloadPDF} disabled={downloadingPdf} className="w-full sm:w-auto">
                  {downloadingPdf ? (
                    <>
                      <Download className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">{inspection.masterTemplate.name}</h1>
          <p className="text-gray-600">
            {inspection.department.name} • Due: {formatDate(new Date(inspection.dueDate))}
          </p>
          {inspection.status === "COMPLETED" && (
            <Badge variant="default" className="mt-2">
              ✅ Completed
            </Badge>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 gap-2 mb-2">
            <span>Progress</span>
            <span>
              {completedItems}/{totalItems}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedItems / totalItems) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Item */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Item {currentItem.order}: {currentItem.name}
                  {currentItem.result && (
                    <Badge variant={currentItem.result.approved ? "default" : "destructive"}>
                      {currentItem.result.approved ? "Approved" : "Failed"}
                    </Badge>
                  )}
                </CardTitle>
                {currentItem.description && <CardDescription>{currentItem.description}</CardDescription>}
                {currentItem.location && <p className="text-sm text-gray-600 mt-1">Location: {currentItem.location}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">QR: {currentItem.qrCodeId}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <InspectionItemForm
              item={currentItem}
              onSave={saveItemResult}
              saving={saving}
              disabled={inspection.status === "COMPLETED"}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
            disabled={currentItemIndex === 0}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            {currentItemIndex + 1} of {totalItems}
          </span>

          <Button
            variant="outline"
            onClick={() => setCurrentItemIndex(Math.min(totalItems - 1, currentItemIndex + 1))}
            disabled={currentItemIndex === totalItems - 1}
            className="w-full sm:w-auto"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Submit */}
        {completedItems === totalItems && inspection.status !== "COMPLETED" && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Ready to Submit</h3>
                <p className="text-gray-600 mb-4">All items have been completed. Submit this inspection for review.</p>
                <Button onClick={submitInspection} disabled={submitting} size="lg" className="w-full sm:w-auto">
                  {submitting ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Inspection
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

interface InspectionItemFormProps {
  item: InspectionItem
  onSave: (itemId: string, approved: boolean, comments?: string, imageFile?: File) => void
  saving: boolean
  disabled: boolean
}

function InspectionItemForm({ item, onSave, saving, disabled }: InspectionItemFormProps) {
  const [approved, setApproved] = useState(item.result?.approved ?? true)
  const [comments, setComments] = useState(item.result?.comments ?? "")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(item.result?.imageUrl ?? null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    onSave(item.id, approved, comments || undefined, imageFile || undefined)
  }

  return (
    <div className="space-y-4">
      {/* Approval Status */}
      <div className="space-y-2">
        <Label>Status</Label>
        <div className="flex gap-2">
          <Button
            variant={approved ? "default" : "outline"}
            onClick={() => setApproved(true)}
            disabled={disabled}
            className="flex-1"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approved
          </Button>
          <Button
            variant={!approved ? "destructive" : "outline"}
            onClick={() => setApproved(false)}
            disabled={disabled}
            className="flex-1"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Failed
          </Button>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-2">
        <Label htmlFor="comments">Comments (Optional)</Label>
        <Textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add any observations or notes..."
          disabled={disabled}
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label htmlFor="image">Photo (Optional)</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={disabled}
          className="cursor-pointer"
        />
        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="max-w-xs rounded-lg border" />
          </div>
        )}
      </div>

      {/* Save Button */}
      {!disabled && (
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Result
            </>
          )}
        </Button>
      )}
    </div>
  )
}
