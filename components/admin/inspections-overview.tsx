"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { getInspectionStatus, formatDate } from "@/lib/utils"
import { Download, Play } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface InspectionInstance {
  id: string
  dueDate: string
  status: string
  completedAt?: string
  masterTemplate: {
    name: string
  }
  department: {
    name: string
  }
  inspector: {
    name?: string
    email: string
  }
}

interface InspectionsOverviewProps {
  onUpdate: () => void
}

export function InspectionsOverview({ onUpdate }: InspectionsOverviewProps) {
  const [inspections, setInspections] = useState<InspectionInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchInspections()
    window.addEventListener("inspection-created", fetchInspections)
    return () => {
      window.removeEventListener("inspection-created", fetchInspections)
    }
  }, [])

  const fetchInspections = async () => {
    try {
      const response = await fetch("/api/admin/inspections")
      if (response.ok) {
        const data = await response.json()
        setInspections(data)
      }
    } catch (error) {
      console.error("Failed to fetch inspections:", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async (inspectionId: string, templateName: string) => {
    setDownloadingPdf(inspectionId)

    try {
      const response = await fetch(`/api/admin/inspections/${inspectionId}/generate-pdf`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `inspection_${templateName}_${new Date().toISOString().split("T")[0]}.pdf`
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
      setDownloadingPdf(null)
    }
  }

  const deleteInspection = async (inspectionId: string) => {
    setDeletingId(inspectionId)
    try {
      const res = await fetch(`/api/admin/inspections/${inspectionId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchInspections()
        toast({ title: 'Success', description: 'Inspection deleted' })
      } else {
        const err = await res.json()
        toast({
          title: 'Error',
          description: err.error || 'Failed to delete inspection',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspections Overview</CardTitle>
          <CardDescription>Recent inspections across your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading inspections...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspections Overview</CardTitle>
        <CardDescription>Recent inspections across your organization</CardDescription>
      </CardHeader>
      <CardContent>
        {inspections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No inspections found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.slice(0, 10).map((inspection) => {
                const status =
                  inspection.status === "COMPLETED" ? "completed" : getInspectionStatus(new Date(inspection.dueDate))

                return (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium">{inspection.masterTemplate.name}</TableCell>
                    <TableCell>{inspection.department.name}</TableCell>
                    <TableCell>{inspection.inspector.name || inspection.inspector.email}</TableCell>
                    <TableCell>{formatDate(new Date(inspection.dueDate))}</TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell>{inspection.completedAt ? formatDate(new Date(inspection.completedAt)) : "-"}</TableCell>
                    <TableCell className="space-x-2">
                      {inspection.status !== "COMPLETED" && (
                        <Button size="sm">
                          <Link
                            href={`/inspector/inspection/${inspection.id}`}
                            className="flex items-center"
                          >
                            <Play className="mr-2 h-3 w-3" /> Start
                          </Link>
                        </Button>
                      )}
                      {inspection.status === "COMPLETED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            downloadPDF(inspection.id, inspection.masterTemplate.name)
                          }
                          disabled={downloadingPdf === inspection.id}
                        >
                          {downloadingPdf === inspection.id ? (
                            <>
                              <Download className="mr-2 h-3 w-3 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-3 w-3" />
                              PDF
                            </>
                          )}
                        </Button>
                      )}
                      {inspection.status === "PENDING" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteInspection(inspection.id)}
                          disabled={deletingId === inspection.id}
                        >
                          {deletingId === inspection.id ? "Deleting..." : "Delete"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
