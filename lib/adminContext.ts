export async function getAdminContext(req: Request) {
  const { getServerSession } = await import("next-auth/next")
  const { authOptions } = await import("@/lib/auth")
  const session = await getServerSession(authOptions)
  if (!session) return null

  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
    return null
  }

  let organizationId: string | null = null
  if (session.user.role === "ADMIN") {
    organizationId = session.user.organizationId
  } else if (session.user.role === "SUPER_ADMIN") {
    const url = new URL(req.url)
    organizationId = url.searchParams.get("organizationId")
  }
  if (!organizationId) return null
  return { session, organizationId }
}
