"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Navigation } from "@/components/ui/navigation"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Calendar, Shield, Edit3, Save, X, Building, Users, Camera, Upload, Loader2 } from "lucide-react"

interface UserStats {
  totalInspections: number
  completedInspections: number
  pendingInspections: number
  successRate: number
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats>({
    totalInspections: 0,
    completedInspections: 0,
    pendingInspections: 0,
    successRate: 0,
  })
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    profileImage: session?.user?.profileImage || "",
  })

  useEffect(() => {
    if (session) {
      setFormData({
        name: session.user?.name || "",
        email: session.user?.email || "",
        profileImage: session.user?.profileImage || "",
      })
      setProfileImage(session.user?.profileImage || null)
      fetchUserStats()
    }
  }, [session])

  const fetchUserStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch("/api/user/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error)
      // Keep default values on error
    } finally {
      setStatsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin"
      case "ADMIN":
        return "Team Leader"
      case "MINI_ADMIN":
        return "Area Leader"
      case "INSPECTOR":
        return "Inspector"
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-gradient-to-r from-purple-600 to-purple-700"
      case "ADMIN":
        return "bg-gradient-to-r from-blue-600 to-blue-700"
      case "MINI_ADMIN":
        return "bg-gradient-to-r from-emerald-600 to-emerald-700"
      case "INSPECTOR":
        return "bg-gradient-to-r from-amber-600 to-amber-700"
      default:
        return "bg-gradient-to-r from-gray-600 to-gray-700"
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/user/profile/image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to upload image")
      }
      const updated = await response.json()

      setProfileImage(updated.image || null)
      setFormData((prev) => ({ ...prev, profileImage: updated.image || "" }))

      await update({
        ...session,
        user: {
          ...session.user,
          profileImage: updated.image,
        },
      })

      toast({
        title: "Profile image updated",
        description: "Your profile image has been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
      setProfileImage(null)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to update profile")
      }
      const updated = await response.json()

      // Update session data
      await update({
        ...session,
        user: {
          ...session.user,
          name: updated.name,
          email: updated.email,
          profileImage: updated.image,
        },
      })
      setProfileImage(updated.image || null)

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
      setIsEditing(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      profileImage: session?.user?.profileImage || "",
    })
    setProfileImage(session?.user?.profileImage || null)
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navigation />

      <div className="container mx-auto mobile-padding py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent inline-block">
              Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Manage your personal information and account settings
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="lg:col-span-1">
              <Card className="glass border-white/20 dark:border-gray-700/20 shadow-xl">
                <CardContent className="p-6 text-center space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 mx-auto ring-4 ring-white/20 dark:ring-gray-700/20 shadow-lg">
                        {profileImage ? (
                          <AvatarImage src={profileImage || "/placeholder.svg"} alt="Profile" />
                        ) : (
                          <AvatarFallback
                            className={`text-2xl font-bold text-white ${getRoleColor(session.user.role)}`}
                          >
                            {getInitials(session.user.name || session.user.email)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 glass border-white/20 dark:border-gray-700/20 hover:shadow-lg"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{session.user.name}</h2>
                      <p className="text-gray-600 dark:text-gray-400">{session.user.email}</p>
                      <Badge className={`${getRoleColor(session.user.role)} text-white border-0 shadow-md`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {getRoleDisplay(session.user.role)}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="bg-white/20 dark:bg-gray-700/20" />

                  <div className="space-y-4 text-left">
                    <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Joined December 2024</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                      <Building className="w-4 h-4" />
                      <span>Region Holbæk</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>Inspection Team</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full glass border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300"
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Change Photo
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass border-white/20 dark:border-gray-700/20 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                      className="glass border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSave}
                        size="sm"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        size="sm"
                        className="glass border-white/20 dark:border-gray-700/20"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="glass border-white/20 dark:border-gray-700/20"
                        />
                      ) : (
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 dark:bg-gray-800/20 border border-white/10 dark:border-gray-700/20">
                          <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span>{session.user.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="glass border-white/20 dark:border-gray-700/20"
                        />
                      ) : (
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 dark:bg-gray-800/20 border border-white/10 dark:border-gray-700/20">
                          <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span>{session.user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Statistics */}
              <Card className="glass border-white/20 dark:border-gray-700/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Account Statistics</CardTitle>
                  <CardDescription>Your activity and performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="text-center p-4 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse">
                          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {stats.totalInspections}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Inspections</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {stats.completedInspections}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {stats.pendingInspections}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {stats.successRate}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
