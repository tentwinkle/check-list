import { prisma } from "./prisma"

export async function createAuditLog(userId: string, action: string, entity: string, entityId?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId || null,
      },
    })
  } catch (error) {
    console.error("Failed to create audit log", error)
  }
}
