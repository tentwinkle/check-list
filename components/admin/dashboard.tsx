"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Users, Building2, MapPin, ClipboardList, CheckCircle, AlertCircle, Clock, Plus } from "lucide-react"
import { AreasManagement } from "./areas-management"
import { DepartmentsManagement } from "./departments-management"
import { TemplatesManagement } from "./templates-management"
import { UsersManagement } from "./users-management"
import { InspectionsOverview } from "./inspections-overview"
import { CreateInspectionDialog } from "./create-inspection-dialog"

interface DashboardStats {
  totalUsers: number
  totalAreas: number
  totalDepartments: number
  totalTemplates: number
  totalInspections: number
  pendingInspections: number
  completedInspections: number
  overdueInspections: number
}

interface AdminDashboardProps {
  organizationId?: string
}

export function AdminDashboard({ organizationId }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAreas: 0,
    totalDepartments: 0,
    totalTemplates: 0,
    totalInspections: 0,
    pendingInspections: 0,
    completedInspections: 0,
    overdueInspections: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showCreateInspection, setShowCreateInspection] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchStats()
  }, [organizationId])

  const fetchStats = async () => {
    try {
      const endpoint = organizationId ? `/api/admin/stats?organizationId=${organizationId}` : "/api/admin/stats"

      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatsUpdate = () => {
    fetchStats()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Leader Dashboard</h1>
          <p className="text-muted-foreground">Manage your organization's inspection system</p>
        </div>
        <Button onClick={() => setShowCreateInspection(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Inspection
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Areas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAreas}</div>
            <p className="text-xs text-muted-foreground">Inspection areas</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">Active departments</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">Inspection templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Inspection Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingInspections}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedInspections}</div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueInspections}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <InspectionsOverview onUpdate={handleStatsUpdate} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="areas" className="space-y-4">
          <AreasManagement onUpdate={handleStatsUpdate} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <DepartmentsManagement onUpdate={handleStatsUpdate} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplatesManagement onUpdate={handleStatsUpdate} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersManagement onUpdate={handleStatsUpdate} organizationId={organizationId} />
        </TabsContent>
      </Tabs>

      <CreateInspectionDialog
        open={showCreateInspection}
        onOpenChange={setShowCreateInspection}
        onSuccess={handleStatsUpdate}
        organizationId={organizationId}
      />
    </div>
  )
}
