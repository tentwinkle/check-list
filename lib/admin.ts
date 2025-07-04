export function buildAdminApiUrl(path: string, organizationId?: string) {
  return organizationId ? `${path}?organizationId=${organizationId}` : path;
}

