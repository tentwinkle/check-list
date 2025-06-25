import { prisma } from "@/lib/prisma"
import { addDays } from "date-fns"

export async function createScheduledInspections() {
  try {
    // Get all active templates
    const templates = await prisma.masterTemplate.findMany({
      include: {
        organization: true,
        department: true,
        checklistItems: true,
      },
    })

    // Process templates concurrently to avoid sequential awaits
    await Promise.all(
      templates.map(async (template) => {
        const [lastInspection, existingPendingInspection] = await Promise.all([
          // Last completed inspection for due date calculation
          prisma.inspectionInstance.findFirst({
            where: {
              masterTemplateId: template.id,
              status: "COMPLETED",
            },
            orderBy: {
              completedAt: "desc",
            },
          }),
          // See if there is a currently pending inspection
          prisma.inspectionInstance.findFirst({
            where: {
              masterTemplateId: template.id,
              status: {
                in: ["PENDING", "IN_PROGRESS"],
              },
            },
          }),
        ])

        // Determine the next due date based on last completed inspection
        let nextDueDate: Date
        if (lastInspection && lastInspection.completedAt) {
          nextDueDate = addDays(new Date(lastInspection.completedAt), template.frequency)
        } else {
          nextDueDate = addDays(new Date(), template.frequency)
        }

        // Create a new inspection only when no pending inspection exists and due date is near
        if (!existingPendingInspection && nextDueDate <= addDays(new Date(), 7)) {
          // Inspectors belonging to the same organization/department
          const availableInspectors = await prisma.user.findMany({
            where: {
              organizationId: template.organizationId,
              role: "INSPECTOR",
              ...(template.departmentId && { departmentId: template.departmentId }),
            },
          })

          if (availableInspectors.length > 0) {
            const inspectorIds = availableInspectors.map((i) => i.id)

            // Fetch pending inspection counts for all inspectors in one query
            const counts = await prisma.inspectionInstance.groupBy({
              by: ["inspectorId"],
              where: {
                inspectorId: { in: inspectorIds },
                status: { in: ["PENDING", "IN_PROGRESS"] },
              },
              _count: { inspectorId: true },
            })

            const countMap = new Map<string, number>()
            counts.forEach((c) => countMap.set(c.inspectorId, c._count.inspectorId))

            // Choose inspector with the least amount of pending work
            const inspectorWorkload = availableInspectors.map((inspector) => ({
              inspector,
              pendingCount: countMap.get(inspector.id) ?? 0,
            }))

            const assignedInspector = inspectorWorkload.sort(
              (a, b) => a.pendingCount - b.pendingCount,
            )[0].inspector

            // Create the inspection - FIXED: removed organizationId
            await prisma.inspectionInstance.create({
              data: {
                masterTemplateId: template.id,
                inspectorId: assignedInspector.id,
                departmentId: template.departmentId || assignedInspector.departmentId!,
                dueDate: nextDueDate,
                status: "PENDING",
              },
            })

            console.log(
              `Created inspection for template ${template.name}, assigned to ${assignedInspector.email}`,
            )
          }
        }
      }),
    )
  } catch (error) {
    console.error("Error creating scheduled inspections:", error)
  }
}

export async function createInspectionForTemplate(templateId: string, inspectorId: string, dueDate?: Date) {
  try {
    const template = await prisma.masterTemplate.findUnique({
      where: { id: templateId },
      include: {
        organization: true,
        department: true,
      },
    })

    if (!template) {
      throw new Error("Template not found")
    }

    const inspector = await prisma.user.findUnique({
      where: { id: inspectorId },
    })

    if (!inspector || inspector.role !== "INSPECTOR") {
      throw new Error("Invalid inspector")
    }

    // FIXED: removed organizationId from create data
    const inspection = await prisma.inspectionInstance.create({
      data: {
        masterTemplateId: templateId,
        inspectorId: inspectorId,
        departmentId: template.departmentId || inspector.departmentId!,
        dueDate: dueDate || addDays(new Date(), template.frequency),
        status: "PENDING",
      },
    })

    return inspection
  } catch (error) {
    console.error("Error creating inspection:", error)
    throw error
  }
}
