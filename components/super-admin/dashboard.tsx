"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/ui/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Building2, Users, Activity } from "lucide-react"
import { CreateOrganizationDialog } from "./create-organization-dialog"
import { OrganizationsList } from "./organizations-list"

interface DashboardStats {
  totalOrganizations: number
  totalUsers: number
  activeInspections: number
}

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    totalUsers: 0,
    activeInspections: 0,
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/super-admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="max-w-7xl mx-auto mobile-padding py-6 sm:py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                Super Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600 mobile-text">
                Manage organizations and system-wide settings
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 animate-slide-up">
          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                {stats.totalOrganizations}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                {stats.totalUsers}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Active Inspections</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                {stats.activeInspections}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>Manage all organizations in the system</CardDescription>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}  className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <OrganizationsList onUpdate={fetchStats} />
          </CardContent>
        </Card>

        <CreateOrganizationDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={fetchStats} />
      </div>
    </div>
  )
}
