"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, LogOut, Settings, Menu, X, Crown, ArrowLeft, Building } from "lucide-react"
import Image from "next/image"

interface SuperAdminContext {
  originalRole: string
  targetOrganization: {
    id: string
    name: string
  }
  loginAsAdmin: boolean
  timestamp: number
}

export function Navigation() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [superAdminContext, setSuperAdminContext] = useState<SuperAdminContext | null>(null)

  useEffect(() => {
    // Check if Super Admin is acting as Team Leader
    const contextData = sessionStorage.getItem("superAdminContext")
    if (contextData) {
      try {
        const context = JSON.parse(contextData) as SuperAdminContext
        if (context.originalRole === "SUPER_ADMIN" && context.loginAsAdmin) {
          setSuperAdminContext(context)
        }
      } catch (error) {
        console.error("Failed to parse super admin context:", error)
        sessionStorage.removeItem("superAdminContext")
      }
    }
  }, [])

  const handleReturnToSuperAdmin = () => {
    sessionStorage.removeItem("superAdminContext")
    window.location.href = "/super-admin"
  }

  if (!session) return null

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
        return "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
      case "ADMIN":
        return "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
      case "MINI_ADMIN":
        return "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
      case "INSPECTOR":
        return "bg-gradient-to-r from-amber-600 to-amber-700 text-white"
      default:
        return "bg-gradient-to-r from-gray-600 to-gray-700 text-white"
    }
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto mobile-padding">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="flex items-center space-x-2">
                <Image src="/checklist-logo.png" alt="Logo" width={32} height={32} />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent hidden sm:inline-block">
                  Inspection System
                </span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Super Admin Context Indicator */}
            {superAdminContext && (
              <>
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300">
                  <Crown className="h-3 w-3" />
                  <span>Super Admin</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
                  <Building className="h-3 w-3" />
                  <span className="max-w-32 truncate">{superAdminContext.targetOrganization.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReturnToSuperAdmin}
                  className="glass hover:shadow-lg transition-all duration-300 bg-transparent border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return
                </Button>
              </>
            )}

            {/* Role Badge */}
            {!superAdminContext && (
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${getRoleColor(session.user.role)}`}
              >
                {getRoleDisplay(session.user.role)}
              </div>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative p-0 rounded-full glass hover:shadow-lg transition-all duration-300"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-white/20">
                    {session.user.profileImage ? (
                      <AvatarImage src={session.user.profileImage || "/placeholder.svg"} alt="Avatar" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold">
                        {getInitials(session.user.name || session.user.email)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 glass border-white/20 shadow-xl" align="end" forceMount>
                <div className="flex items-center justify-start gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-white/20">
                    {session.user.profileImage ? (
                      <AvatarImage src={session.user.profileImage || "/placeholder.svg"} alt="Avatar" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold">
                        {getInitials(session.user.name || session.user.email)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{session.user.name}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[180px]">{session.user.email}</p>
                    {superAdminContext && (
                      <p className="text-xs text-purple-600 font-medium">
                        Managing: {superAdminContext.targetOrganization.name}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 transition-colors">
                  <Link href="/profile" className="flex items-center">
                    <span className="flex items-center">
                      <User className="mr-3 h-4 w-4" />
                      Profile
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 transition-colors">
                  <Link href="/settings" className="flex items-center">
                    <span className="flex items-center">
                      <Settings className="mr-3 h-4 w-4" />
                      Settings
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  onSelect={() => signOut()}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="glass hover:shadow-lg transition-all duration-300"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden animate-slide-up">
            <div className="px-2 pt-2 pb-3 space-y-1 glass rounded-xl mt-2 mb-4 border border-white/20">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/10">
                <Avatar className="h-10 w-10 ring-2 ring-white/20">
                  {session.user.profileImage ? (
                    <AvatarImage src={session.user.profileImage || "/placeholder.svg"} alt="Avatar" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold">
                      {getInitials(session.user.name || session.user.email)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{session.user.name}</p>
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {superAdminContext ? (
                      <>
                        <div className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                          <Crown className="inline w-3 h-3 mr-1" />
                          Super Admin
                        </div>
                        <div className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                          <Building className="inline w-3 h-3 mr-1" />
                          {superAdminContext.targetOrganization.name}
                        </div>
                      </>
                    ) : (
                      <div
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(session.user.role)}`}
                      >
                        {getRoleDisplay(session.user.role)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {superAdminContext && (
                <div className="px-3 py-2 rounded-lg bg-purple-50 border border-purple-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleReturnToSuperAdmin()
                    }}
                    className="w-full text-purple-700 hover:bg-purple-100 justify-start"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Super Admin
                  </Button>
                </div>
              )}

              <Link
                href="/profile"
                className="flex items-center px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center">
                  <User className="mr-3 h-4 w-4" />
                  Profile
                </span>
              </Link>

              <Link
                href="/settings"
                className="flex items-center px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center">
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </span>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut()
                }}
                className="flex items-center w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
