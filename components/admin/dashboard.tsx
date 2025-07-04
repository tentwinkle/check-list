"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/ui/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Users, Building2, FileText, ClipboardList, MapPin } from "lucide-react"
import { UsersManagement } from "./users-management"
import { DepartmentsManagement } from "./departments-management"
import { AreasManagement } from "./areas-management"
import { TemplatesManagement } from "./templates-management"
import { InspectionsOverview } from "./inspections-overview"
import { CreateUserDialog } from "./create-user-dialog"
import { CreateDepartmentDialog } from "./create-department-dialog"
import { CreateAreaDialog } from "./create-area-dialog"
import { CreateTemplateDialog } from "./create-template-dialog"
import { CreateInspectionDialog } from "./create-inspection-dialog"
import { useSuperAdminContext } from "./super-admin-context"
import { useSession } from "next-auth/react"

interface DashboardStats {
  totalUsers: number
  totalDepartments: number
  totalAreas: number
  totalTemplates: number
  totalInspections: number
  pendingInspections: number
}

export function AdminDashboard() {
  const { data: session } = useSession()
  const superAdminContext = useSuperAdminContext()
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDepartments: 0,
    totalAreas: 0,
    totalTemplates: 0,
    totalInspections: 0,
    pendingInspections: 0,
  })
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false)
  const [showCreateDepartmentDialog, setShowCreateDepartmentDialog] = useState(false)
  const [showCreateAreaDialog, setShowCreateAreaDialog] = useState(false)
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false)
  const [showCreateInspectionDialog, setShowCreateInspectionDialog] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchStats()
  }, [refreshKey, superAdminContext?.targetOrganizationId])

  const fetchStats = async () => {
    try {
      // Use different API endpoint based on context
      const apiBase = superAdminContext?.isActingAsAdmin ? "/api/admin" : "/api/admin"
      const orgParam = superAdminContext?.targetOrganizationId ? `?org=${superAdminContext.targetOrganizationId}` : ""

      const response = await fetch(`${apiBase}/stats${orgParam}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="max-w-7xl mx-auto mobile-padding py-6 sm:py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent inline-block">
                {superAdminContext?.isActingAsAdmin ? "Super Admin - Team Leader View" : "Team Leader Dashboard"}
              </h1>
              <p className="mt-2 text-gray-600 mobile-text">
                {superAdminContext?.targetOrganizationName
                  ? `Managing ${superAdminContext.targetOrganizationName}`
                  : "Manage your team, templates, and inspections"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 animate-slide-up">
          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent inline-block">
                {stats.totalUsers}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Departments</CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent inline-block">
                {stats.totalDepartments}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Areas</CardTitle>
              <MapPin className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent inline-block">
                {stats.totalAreas}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Templates</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent inline-block">
                {stats.totalTemplates}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Inspections</CardTitle>
              <ClipboardList className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent inline-block">
                {stats.totalInspections}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Pending Inspections</CardTitle>
              <ClipboardList className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent inline-block">
                {stats.pendingInspections}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Management</CardTitle>
            <CardDescription>Manage your organization's resources</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="departments">Departments</TabsTrigger>
                <TabsTrigger value="areas">Areas</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <InspectionsOverview key={refreshKey} organizationId={superAdminContext?.targetOrganizationId} />
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Users Management</h3>
                  <Button onClick={() => setShowCreateUserDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </div>
                <UsersManagement
                  key={refreshKey}
                  onUpdate={handleRefresh}
                  organizationId={superAdminContext?.targetOrganizationId}
                />
              </TabsContent>

              <TabsContent value="departments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Departments Management</h3>
                  <Button onClick={() => setShowCreateDepartmentDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>
                </div>
                <DepartmentsManagement
                  key={refreshKey}
                  onUpdate={handleRefresh}
                  organizationId={superAdminContext?.targetOrganizationId}
                />
              </TabsContent>

              <TabsContent value="areas" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Areas Management</h3>
                  <Button onClick={() => setShowCreateAreaDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Area
                  </Button>
                </div>
                <AreasManagement
                  key={refreshKey}
                  onUpdate={handleRefresh}
                  organizationId={superAdminContext?.targetOrganizationId}
                />
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Templates Management</h3>
                  <Button onClick={() => setShowCreateTemplateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Template
                  </Button>
                </div>
                <TemplatesManagement
                  key={refreshKey}
                  onUpdate={handleRefresh}
                  organizationId={superAdminContext?.targetOrganizationId}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Create Dialogs */}
        <CreateUserDialog
          open={showCreateUserDialog}
          onOpenChange={setShowCreateUserDialog}
          onSuccess={handleRefresh}
          organizationId={superAdminContext?.targetOrganizationId}
        />

        <CreateDepartmentDialog
          open={showCreateDepartmentDialog}
          onOpenChange={setShowCreateDepartmentDialog}
          onSuccess={handleRefresh}
          organizationId={superAdminContext?.targetOrganizationId}
        />

        <CreateAreaDialog
          open={showCreateAreaDialog}
          onOpenChange={setShowCreateAreaDialog}
          onSuccess={handleRefresh}
          organizationId={superAdminContext?.targetOrganizationId}
        />

        <CreateTemplateDialog
          open={showCreateTemplateDialog}
          onOpenChange={setShowCreateTemplateDialog}
          onSuccess={handleRefresh}
          organizationId={superAdminContext?.targetOrganizationId}
        />

        <CreateInspectionDialog
          open={showCreateInspectionDialog}
          onOpenChange={setShowCreateInspectionDialog}
          onSuccess={handleRefresh}
          organizationId={superAdminContext?.targetOrganizationId}
        />
      </div>
    </div>
  )
}
