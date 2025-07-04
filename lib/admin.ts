export function buildAdminApiUrl(path: string, organizationId?: string) {
  return organizationId ? `${path}?organizationId=${organizationId}` : path;
}

export function extractOrganizationId(session: any, request: Request) {
  return session.user.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("organizationId")
    : session.user.organizationId;
}
