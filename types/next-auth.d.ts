declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: string
      organizationId?: string
      areaId?: string
      departmentId?: string
    }
  }

  interface User {
    role: string
    organizationId?: string
    areaId?: string
    departmentId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    organizationId?: string
    areaId?: string
    departmentId?: string
  }
}
