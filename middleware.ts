import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Allow access to auth pages
    if (pathname.startsWith("/auth/")) {
      return NextResponse.next()
    }

    // Redirect to signin if no token
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // Check for Super Admin context in admin routes
    if (pathname.startsWith("/admin")) {
      // Allow Super Admin to access admin routes (they can act as Team Leader)
      if (token.role === "SUPER_ADMIN" || token.role === "ADMIN") {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Super Admin routes
    if (pathname.startsWith("/super-admin")) {
      if (token.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/", req.url))
      }
      return NextResponse.next()
    }

    // Mini Admin routes
    if (pathname.startsWith("/mini-admin")) {
      if (token.role !== "MINI_ADMIN") {
        return NextResponse.redirect(new URL("/", req.url))
      }
      return NextResponse.next()
    }

    // Inspector routes
    if (pathname.startsWith("/inspector")) {
      if (token.role !== "INSPECTOR") {
        return NextResponse.redirect(new URL("/", req.url))
      }
      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to auth pages without token
        if (pathname.startsWith("/auth/")) {
          return true
        }

        // Require token for all other protected routes
        return !!token
      },
    },
  },
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}
