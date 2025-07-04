import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Allow access to auth pages without token
    if (pathname.startsWith("/auth/")) {
      return NextResponse.next()
    }

    // If no token, redirect to sign in
    if (!token) {
      const signInUrl = new URL("/auth/signin", req.url)
      signInUrl.searchParams.set("callbackUrl", req.url)
      return NextResponse.redirect(signInUrl)
    }

    // Check Super Admin context for admin routes
    if (pathname.startsWith("/admin")) {
      // Allow if user is ADMIN or if Super Admin is acting as Team Leader
      if (token.role === "ADMIN" || token.role === "SUPER_ADMIN") {
        return NextResponse.next()
      }

      // Redirect unauthorized users
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Check role-based access for other routes
    if (pathname.startsWith("/super-admin") && token.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    if (pathname.startsWith("/mini-admin") && !["MINI_ADMIN", "ADMIN", "SUPER_ADMIN"].includes(token.role as string)) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    if (
      pathname.startsWith("/inspector") &&
      !["INSPECTOR", "MINI_ADMIN", "ADMIN", "SUPER_ADMIN"].includes(token.role as string)
    ) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith("/auth/")) {
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
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)",
  ],
}
