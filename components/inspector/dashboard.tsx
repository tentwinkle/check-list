"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Navigation } from "@/components/ui/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { QrCode, Play, Clock, CheckCircle, Zap, Target } from "lucide-react";
import { getInspectionStatus, formatDate } from "@/lib/utils";
import Link from "next/link";
import { QRScanner } from "@/components/inspector/qr-scanner";
import { ClipboardList } from "lucide-react";

interface InspectionInstance {
  id: string;
  dueDate: string;
  status: string;
  completedAt?: string;
  masterTemplate: {
    name: string;
    description?: string;
  };
  department: {
    name: string;
  };
}

export function InspectorDashboard() {
  const { data: session } = useSession();
  const [inspections, setInspections] = useState<InspectionInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const response = await fetch("/api/inspector/inspections");
      if (response.ok) {
        const data = await response.json();
        setInspections(data);
      }
    } catch (error) {
      console.error("Failed to fetch inspections:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      dueSoon: 0,
      overdue: 0,
      completed: 0,
    };

    inspections.forEach((inspection) => {
      if (inspection.status === "COMPLETED") {
        counts.completed++;
      } else {
        const status = getInspectionStatus(new Date(inspection.dueDate));
        switch (status) {
          case "pending":
            counts.pending++;
            break;
          case "due-soon":
            counts.dueSoon++;
            break;
          case "overdue":
            counts.overdue++;
            break;
        }
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

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
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="max-w-7xl mx-auto mobile-padding py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Inspector Dashboard
              </h1>
              <p className="mt-2 text-gray-600 mobile-text">
                Welcome back, {session?.user?.name}! Ready to start inspecting?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 rounded-full text-sm font-medium">
                <Target className="inline h-4 w-4 mr-1" />
                {inspections.length} Assigned
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 animate-slide-up">
          <Card variant="glass" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-blue-100">
                Start your inspection workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={() => setShowQRScanner(true)}
                  className="h-14 text-base font-semibold flex items-center"
                  size="lg"
                >
                  <QrCode className="mr-3 h-5 w-5" />
                  <span>Scan QR Code</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-14 text-base font-semibold bg-white/80 backdrop-blur-sm hover:bg-white"
                >
                  <Link href="/inspector/inspections">
                    <span className="flex items-center">
                      <Play className="mr-3 h-5 w-5" />
                      View All Inspections
                    </span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <Card
            variant="elevated"
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:scale-105 transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Pending
              </CardTitle>
              <Clock className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                {statusCounts.pending}
              </div>
              <p className="text-xs text-blue-600 mt-1">Not due yet</p>
            </CardContent>
          </Card>

          <Card
            variant="elevated"
            className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:scale-105 transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">
                Due Soon
              </CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-800">
                {statusCounts.dueSoon}
              </div>
              <p className="text-xs text-amber-600 mt-1">Within 3 days</p>
            </CardContent>
          </Card>

          <Card
            variant="elevated"
            className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:scale-105 transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">
                Overdue
              </CardTitle>
              <Clock className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800">
                {statusCounts.overdue}
              </div>
              <p className="text-xs text-red-600 mt-1">Past due</p>
            </CardContent>
          </Card>

          <Card
            variant="elevated"
            className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:scale-105 transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">
                Completed
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-800">
                {statusCounts.completed}
              </div>
              <p className="text-xs text-emerald-600 mt-1">Finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Inspections */}
        <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">
                Recent Inspections
              </CardTitle>
              <CardDescription>
                Your assigned inspections and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inspections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No inspections assigned yet
                  </h3>
                  <p className="text-gray-600">
                    Check back later or contact your supervisor for assignments.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inspections.slice(0, 10).map((inspection, index) => {
                    const status =
                      inspection.status === "COMPLETED"
                        ? "completed"
                        : getInspectionStatus(new Date(inspection.dueDate));

                    return (
                      <div
                        key={inspection.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-lg transition-all duration-300 animate-fade-in glass-card"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                                {inspection.masterTemplate.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {inspection.department.name}
                              </p>
                            </div>
                            <StatusBadge status={status} />
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Due: {formatDate(new Date(inspection.dueDate))}
                            </div>
                            {inspection.completedAt && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Completed:{" "}
                                {formatDate(new Date(inspection.completedAt))}
                              </div>
                            )}
                          </div>

                          {inspection.masterTemplate.description && (
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {inspection.masterTemplate.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 sm:mt-0 sm:ml-6 flex-shrink-0">
                          {inspection.status !== "COMPLETED" ? (
                            <Button
                              size="lg"
                              className="w-full sm:w-auto"
                            >
                              <Link
                                href={`/inspector/inspection/${inspection.id}`}
                              >
                                <span className="flex items-center">
                                  <Play className="mr-2 h-4 w-4" />
                                  Start Inspection
                                </span>
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="lg"
                              className="w-full sm:w-auto bg-white/80 backdrop-blur-sm"
                            >
                              <Link
                                href={`/inspector/inspection/${inspection.id}`}
                              >
                                <span className="flex items-center">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  View Report
                                </span>
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {inspections.length > 10 && (
                    <div className="text-center pt-6">
                      <Button
                        variant="outline"
                        size="lg"
                        className="bg-white/80 backdrop-blur-sm"
                      >
                        <Link href="/inspector/inspections"><span>View All {inspections.length} Inspections</span></Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <QRScanner
          open={showQRScanner}
          onClose={() => setShowQRScanner(false)}
        />
      </div>
    </div>
  );
}
