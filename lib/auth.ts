import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
              area: {
                select: {
                  id: true,
                  name: true,
                },
              },
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })

          if (!user) {
            throw new Error("Invalid email or password")
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            throw new Error("Invalid email or password")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: user.organization?.name,
            areaId: user.areaId,
            areaName: user.area?.name,
            departmentId: user.departmentId,
            departmentName: user.department?.name,
            profileImage: user.profileImage,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          throw new Error("Authentication failed")
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.organizationName = user.organizationName
        token.areaId = user.areaId
        token.areaName = user.areaName
        token.departmentId = user.departmentId
        token.departmentName = user.departmentName
        token.profileImage = user.profileImage
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.organizationName = token.organizationName as string
        session.user.areaId = token.areaId as string
        session.user.areaName = token.areaName as string
        session.user.departmentId = token.departmentId as string
        session.user.departmentName = token.departmentName as string
        session.user.profileImage = token.profileImage as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
