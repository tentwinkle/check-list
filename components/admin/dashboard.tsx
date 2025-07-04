"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Building,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Briefcase,
  FileText,
  Crown,
  ArrowLeft,
} from "lucide-react"
import { UsersManagement } from "./users-management"
import { AreasManagement } from "./areas-management"
import { DepartmentsManagement } from "./departments-management"
import { TemplatesManagement } from "./templates-management"
import { InspectionsOverview } from "./inspections-overview"
import { useToast } from "@/hooks/use-toast"

interface DashboardStats {
  totalUsers: number
  totalAreas: number
  totalDepartments: number
  totalTemplates: number
  totalInspections: number
  completedInspections: number
  pendingInspections: number
  overdueInspections: number
}

interface AdminDashboardProps {
  organizationId?: string
  isSuperAdminView?: boolean
}

export function AdminDashboard({ organizationId, isSuperAdminView = false }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAreas: 0,
    totalDepartments: 0,
    totalTemplates: 0,
    totalInspections: 0,
    completedInspections: 0,
    pendingInspections: 0,
    overdueInspections: 0,
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
  }, [organizationId])

  const fetchStats = async () => {
    try {
      const endpoint =
        isSuperAdminView && organizationId ? `/api/admin/stats?organizationId=${organizationId}` : "/api/admin/stats"

      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch dashboard statistics",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReturnToSuperAdmin = () => {
    try {
      sessionStorage.removeItem("superAdminContext")
      toast({
        title: "Returning to Super Admin",
        description: "Switching back to Super Admin dashboard",
      })
      setTimeout(() => {
        window.location.href = "/super-admin"
      }, 500)
    } catch (error) {
      console.error("Error returning to Super Admin:", error)
      toast({
        title: "Error",
        description: "Failed to return to Super Admin dashboard",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building className="h-8 w-8 text-blue-600" />
            Admin Dashboard
            {isSuperAdminView && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                <Crown className="w-4 h-4 mr-1" />
                Super Admin View
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization's users, areas, departments, and inspections
          </p>
        </div>
        {isSuperAdminView && (
          <Button
            onClick={handleReturnToSuperAdmin}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Super Admin
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalUsers}</div>
            <p className="text-xs text-blue-600">Active system users</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Areas</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.totalAreas}</div>
            <p className="text-xs text-green-600">Managed areas</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Departments</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.totalDepartments}</div>
            <p className="text-xs text-purple-600">Active departments</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Templates</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.totalTemplates}</div>
            <p className="text-xs text-orange-600">Inspection templates</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700">Total Inspections</CardTitle>
            <ClipboardList className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{stats.totalInspections}</div>
            <p className="text-xs text-indigo-600">All inspections</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{stats.completedInspections}</div>
            <p className="text-xs text-emerald-600">Finished inspections</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{stats.pendingInspections}</div>
            <p className="text-xs text-yellow-600">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats.overdueInspections}</div>
            <p className="text-xs text-red-600">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Overview</CardTitle>
              <CardDescription>Quick overview of your organization's inspection management system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold">System Health</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate</span>
                      <span className="font-medium">
                        {stats.totalInspections > 0
                          ? Math.round((stats.completedInspections / stats.totalInspections) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Overdue Rate</span>
                      <span className="font-medium text-red-600">
                        {stats.totalInspections > 0
                          ? Math.round((stats.overdueInspections / stats.totalInspections) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveTab("users")}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveTab("inspections")}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      View Inspections
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UsersManagement onUpdate={fetchStats} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="areas">
          <AreasManagement onUpdate={fetchStats} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsManagement onUpdate={fetchStats} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesManagement onUpdate={fetchStats} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="inspections">
          <InspectionsOverview onUpdate={fetchStats} organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
