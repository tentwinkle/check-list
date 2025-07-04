import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Allow access to public routes
    if (
      pathname.startsWith("/auth") ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname === "/"
    ) {
      return NextResponse.next()
    }

    // Super Admin routes
    if (pathname.startsWith("/super-admin")) {
      if (token?.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/", req.url))
      }
      return NextResponse.next()
    }

    // Admin routes - allow ADMIN, MINI_ADMIN, and SUPER_ADMIN
    if (pathname.startsWith("/admin")) {
      if (!["ADMIN", "MINI_ADMIN", "SUPER_ADMIN"].includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/", req.url))
      }
      return NextResponse.next()
    }

    // Mini Admin routes
    if (pathname.startsWith("/mini-admin")) {
      if (!["MINI_ADMIN", "ADMIN", "SUPER_ADMIN"].includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/", req.url))
      }
      return NextResponse.next()
    }

    // Inspector routes
    if (pathname.startsWith("/inspector")) {
      if (!["INSPECTOR", "MINI_ADMIN", "ADMIN", "SUPER_ADMIN"].includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/", req.url))
      }
      return NextResponse.next()
    }

    // API routes protection
    if (pathname.startsWith("/api/super-admin")) {
      if (token?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    if (pathname.startsWith("/api/admin")) {
      if (!["ADMIN", "SUPER_ADMIN"].includes(token?.role as string)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    if (pathname.startsWith("/api/mini-admin")) {
      if (!["MINI_ADMIN", "ADMIN", "SUPER_ADMIN"].includes(token?.role as string)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes without token
        const { pathname } = req.nextUrl
        if (
          pathname.startsWith("/auth") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon") ||
          pathname === "/"
        ) {
          return true
        }

        // Require token for all other routes
        return !!token
      },
    },
  },
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
