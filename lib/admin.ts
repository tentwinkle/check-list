export function buildAdminApiUrl(path: string, organizationId?: string) {
  if (!organizationId) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}organizationId=${organizationId}`;
}

export function extractOrganizationId(session: any, request: Request) {
  return session.user.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("organizationId")
    : session.user.organizationId;
}
