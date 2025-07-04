"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ArrowLeft,
  Search,
  Filter,
  Play,
  CheckCircle,
  Clock,
} from "lucide-react";
import { getInspectionStatus, formatDate } from "@/lib/utils";
import Link from "next/link";

interface InspectionInstance {
  id: string;
  dueDate: string;
  status: string;
  inspectorId: string;
  completedAt?: string;
  masterTemplate: {
    name: string;
    description?: string;
  };
  department: {
    name: string;
  };
}

export function InspectionsList() {
  const { data: session } = useSession();
  const [inspections, setInspections] = useState<InspectionInstance[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<
    InspectionInstance[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchInspections();
  }, []);

  useEffect(() => {
    filterInspections();
  }, [inspections, searchTerm, statusFilter]);

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

  const filterInspections = () => {
    let filtered = inspections;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (inspection) =>
          inspection.masterTemplate.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          inspection.department.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((inspection) => {
        if (statusFilter === "completed") {
          return inspection.status === "COMPLETED";
        } else {
          const status = getInspectionStatus(new Date(inspection.dueDate));
          return status === statusFilter;
        }
      });
    }

    setFilteredInspections(filtered);
  };

  const getStatusCounts = () => {
    const counts = {
      all: inspections.length,
      pending: 0,
      "due-soon": 0,
      overdue: 0,
      completed: 0,
    };

    inspections.forEach((inspection) => {
      if (inspection.status === "COMPLETED") {
        counts.completed++;
      } else {
        const status = getInspectionStatus(new Date(inspection.dueDate));
        if (status === "pending") counts.pending++;
        else if (status === "due-soon") counts["due-soon"]++;
        else if (status === "overdue") counts.overdue++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading inspections...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Button variant="outline">
              <Link href="/inspector" className="flex items-center">
                <span className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </span>
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            All Inspections
          </h1>
          <p className="text-gray-600">
            Manage and track your assigned inspections
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search inspections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All ({statusCounts.all})
                    </SelectItem>
                    <SelectItem value="pending">
                      Pending ({statusCounts.pending})
                    </SelectItem>
                    <SelectItem value="due-soon">
                      Due Soon ({statusCounts["due-soon"]})
                    </SelectItem>
                    <SelectItem value="overdue">
                      Overdue ({statusCounts.overdue})
                    </SelectItem>
                    <SelectItem value="completed">
                      Completed ({statusCounts.completed})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspections List */}
        <div className="space-y-4">
          {filteredInspections.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "No inspections match your filters."
                    : "No inspections assigned yet."}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredInspections.map((inspection) => {
              const status =
                inspection.status === "COMPLETED"
                  ? "completed"
                  : getInspectionStatus(new Date(inspection.dueDate));

              return (
                <Card
                  key={inspection.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {inspection.masterTemplate.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {inspection.department.name}
                            </p>
                          </div>
                          <StatusBadge status={status} />
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
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
                          <p className="text-sm text-gray-600 mt-2">
                            {inspection.masterTemplate.description}
                          </p>
                        )}
                      </div>

                      <div className="ml-4">
                        {inspection.status !== "COMPLETED" ? (
                          <Button>
                            <Link
                              href={`/inspector/inspection/${inspection.id}`}
                              className="flex items-center"
                            >
                              <span className="flex items-center">
                                <Play className="mr-2 h-4 w-4" /> Start
                              </span>
                            </Link>
                          </Button>
                        ) : (
                          session?.user?.id === inspection.inspectorId && (
                            <Button variant="outline">
                              <Link
                                href={`/inspector/inspection/${inspection.id}`}
                                className="flex items-center"
                              >
                                <span className="flex items-center">
                                  View Report
                                </span>
                              </Link>
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
