"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Navigation } from "@/components/ui/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { MiniAdminDepartmentsManagement } from "./departments-management"
import { MiniAdminUsersManagement } from "./users-management"
import { MiniAdminTemplatesManagement } from "./templates-management"
import { MiniAdminInspectionsOverview } from "./inspections-overview"
import { CreateInspectionDialog } from "./create-inspection-dialog"
import { QRScanner } from "@/components/inspector/qr-scanner"
import {
  Building2,
  Users,
  FileText,
  Activity,
  Plus,
  ClipboardList,
  Calendar,
  CheckCircle,
  AlertTriangle,
  MapPin,
  TrendingUp,
  QrCode,
  Zap,
} from "lucide-react"

interface DashboardStats {
  totalDepartments: number
  totalUsers: number
  totalTemplates: number
  totalInspections: number
  activeInspections: number
  completedInspections: number
  pendingInspections: number
  dueSoonInspections: number
  overdueInspections: number
  areaName: string
}

export function MiniAdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalDepartments: 0,
    totalUsers: 0,
    totalTemplates: 0,
    totalInspections: 0,
    activeInspections: 0,
    completedInspections: 0,
    pendingInspections: 0,
    dueSoonInspections: 0,
    overdueInspections: 0,
    areaName: "",
  })
  const [createInspectionOpen, setCreateInspectionOpen] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/mini-admin/stats")
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

  const handleCreateInspectionSuccess = () => {
    fetchStats() // Refresh stats after creating inspection
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-7xl mx-auto mobile-padding py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded-lg w-1/2"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="max-w-7xl mx-auto mobile-padding py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent inline-block">
                Area Leader Dashboard
              </h1>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-gray-600 mobile-text">Welcome back, {session?.user?.name}!</p>
                <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 rounded-full text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  {stats.areaName}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-sm font-medium">
                <TrendingUp className="inline h-4 w-4 mr-1" />
                Area Active
              </div>
            </div>
          </div>
        </div>

        {/* Area Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 animate-slide-up">
          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Departments</CardTitle>
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent inline-block">
                {stats.totalDepartments}
              </div>
              <p className="text-xs text-gray-600 mt-1">In your area</p>
            </CardContent>
          </Card>

          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Users</CardTitle>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent inline-block">
                {stats.totalUsers}
              </div>
              <p className="text-xs text-gray-600 mt-1">Team members</p>
            </CardContent>
          </Card>

          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Templates</CardTitle>
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent inline-block">
                {stats.totalTemplates}
              </div>
              <p className="text-xs text-gray-600 mt-1">Available</p>
            </CardContent>
          </Card>

          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Active</CardTitle>
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent inline-block">
                {stats.activeInspections}
              </div>
              <p className="text-xs text-gray-600 mt-1">In progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 animate-slide-up">
          <Card variant="glass" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Button
                onClick={() => setShowQRScanner(true)}
                className="h-14 text-base font-semibold flex items-center"
                size="lg"
              >
                <QrCode className="mr-3 h-5 w-5" />
                <span>Scan QR Code</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Inspection Analytics */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Inspection Analytics</h2>
              <p className="text-gray-600 mobile-text">Real-time insights for your area</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            <Card variant="elevated" className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Total Inspections</CardTitle>
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-800">{stats.totalInspections}</div>
                <p className="text-xs text-blue-600 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Pending</CardTitle>
                <Calendar className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-800">{stats.pendingInspections}</div>
                <p className="text-xs text-blue-600 mt-1">Not due yet</p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-700">Due Soon</CardTitle>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-800">{stats.dueSoonInspections}</div>
                <p className="text-xs text-amber-600 mt-1">Within 3 days</p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700">Overdue</CardTitle>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-800">{stats.overdueInspections}</div>
                <p className="text-xs text-red-600 mt-1">Past due date</p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Completed</CardTitle>
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-800">{stats.completedInspections}</div>
                <p className="text-xs text-emerald-600 mt-1">Finished</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Management Tabs */}
        <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="glass border border-white/20 p-1 h-auto">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 data-[state=active]:shadow-md">
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="departments"
                  className="data-[state=active]:bg-white/20 data-[state=active]:shadow-md"
                >
                  Departments
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-white/20 data-[state=active]:shadow-md">
                  Users
                </TabsTrigger>
                <TabsTrigger
                  value="templates"
                  className="data-[state=active]:bg-white/20 data-[state=active]:shadow-md"
                >
                  Templates
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Inspections Overview</h3>
                  <p className="text-sm text-gray-600">Monitor and manage all inspections in your area</p>
                </div>
                <Button onClick={() => setCreateInspectionOpen(true)} className="w-full sm:w-auto" size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Inspection
                </Button>
              </div>
              <MiniAdminInspectionsOverview onUpdate={fetchStats} />
            </TabsContent>

            <TabsContent value="departments">
              <MiniAdminDepartmentsManagement onUpdate={fetchStats} />
            </TabsContent>

            <TabsContent value="users">
              <MiniAdminUsersManagement onUpdate={fetchStats} />
            </TabsContent>

            <TabsContent value="templates">
              <MiniAdminTemplatesManagement onUpdate={fetchStats} />
            </TabsContent>
          </Tabs>
        </div>

        <CreateInspectionDialog
          open={createInspectionOpen}
          onOpenChange={setCreateInspectionOpen}
          onSuccess={handleCreateInspectionSuccess}
        />
        <QRScanner
          open={showQRScanner}
          onClose={() => setShowQRScanner(false)}
        />
      </div>
    </div>
  )
}
