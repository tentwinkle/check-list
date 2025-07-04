"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Users,
  Building2,
  FileText,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  User,
  Shield,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SuperAdminContext {
  originalRole: string
  actingAsRole: string
  targetOrganizationId: string
  targetOrganizationName: string
  returnUrl: string
}

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [superAdminContext, setSuperAdminContext] = useState<SuperAdminContext | null>(null)

  useEffect(() => {
    const contextData = sessionStorage.getItem("superAdminContext")
    if (contextData) {
      try {
        setSuperAdminContext(JSON.parse(contextData))
      } catch (error) {
        console.error("Failed to parse SuperAdmin context:", error)
      }
    }
  }, [pathname])

  const handleReturnToSuperAdmin = () => {
    sessionStorage.removeItem("superAdminContext")
    setSuperAdminContext(null)
    router.push("/super-admin")
  }

  if (!session) return null

  const userRole = session.user.role
  const isActingSuperAdmin = superAdminContext && userRole === "SUPER_ADMIN"

  const getNavigationItems = () => {
    const effectiveRole = isActingSuperAdmin ? "ADMIN" : userRole

    switch (effectiveRole) {
      case "SUPER_ADMIN":
        return [{ href: "/super-admin", label: "Dashboard", icon: Home }]
      case "ADMIN":
        return [
          { href: "/admin", label: "Dashboard", icon: Home },
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/areas", label: "Areas", icon: Building2 },
          { href: "/admin/departments", label: "Departments", icon: Building2 },
          { href: "/admin/templates", label: "Templates", icon: FileText },
          { href: "/admin/inspections", label: "Inspections", icon: ClipboardList },
        ]
      case "MINI_ADMIN":
        return [
          { href: "/mini-admin", label: "Dashboard", icon: Home },
          { href: "/mini-admin/users", label: "Users", icon: Users },
          { href: "/mini-admin/departments", label: "Departments", icon: Building2 },
          { href: "/mini-admin/templates", label: "Templates", icon: FileText },
          { href: "/mini-admin/inspections", label: "Inspections", icon: ClipboardList },
        ]
      case "INSPECTOR":
        return [
          { href: "/inspector", label: "Dashboard", icon: Home },
          { href: "/inspector/inspections", label: "Inspections", icon: ClipboardList },
        ]
      default:
        return [{ href: "/", label: "Dashboard", icon: Home }]
    }
  }

  const navigationItems = getNavigationItems()

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigationItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              mobile && "text-base",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">CheckList Pro</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <NavItems />
          </nav>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link href="/" className="flex items-center">
              <span className="font-bold">CheckList Pro</span>
            </Link>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-2">
                <NavItems mobile />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="flex items-center space-x-2 md:hidden">
              <span className="font-bold">CheckList Pro</span>
            </Link>
          </div>

          {isActingSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReturnToSuperAdmin}
              className="hidden md:flex bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Super Admin
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                  <AvatarFallback>
                    {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session.user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                  {isActingSuperAdmin && (
                    <p className="text-xs leading-none text-blue-600 font-medium">
                      <Shield className="h-3 w-3 inline mr-1" />
                      Acting as Team Leader
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              {isActingSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleReturnToSuperAdmin}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Super Admin
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
