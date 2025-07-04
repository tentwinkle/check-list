import type { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: credentials.email,
              mode: "insensitive",
            },
          },
          include: {
            organization: true,
            area: true,
            department: true,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          areaId: user.areaId,
          departmentId: user.departmentId,
          profileImage: user.image,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.areaId = user.areaId
        token.departmentId = user.departmentId
        token.profileImage = (user as any).profileImage ?? (user as any).image
      }

      // Handle session updates
      if (trigger === "update" && session) {
        token.name = session.user.name
        token.email = session.user.email
        token.profileImage = session.user.profileImage
      }

      return token
    },
    async session({ session, token }) {
      if (!token?.sub) return session

      try {
        const user = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: {
            email: true,
            role: true,
            organizationId: true,
            areaId: true,
            departmentId: true,
            image: true,
            name: true,
          },
        })

        if (!user) {
          return session
        }

        session.user.id = token.sub!
        session.user.role = user.role
        session.user.organizationId = user.organizationId
        session.user.areaId = user.areaId
        session.user.departmentId = user.departmentId
        session.user.profileImage = user.image || (token.profileImage as string)
        session.user.name = user.name || session.user.name
        session.user.email = user.email

        return session
      } catch (error) {
        console.error("Error validating session:", error)
        return session
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
}
