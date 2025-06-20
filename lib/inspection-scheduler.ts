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

    for (const template of templates) {
      // Find the last completed inspection for this template
      const lastInspection = await prisma.inspectionInstance.findFirst({
        where: {
          masterTemplateId: template.id,
          status: "COMPLETED",
        },
        orderBy: {
          completedAt: "desc",
        },
      })

      // Calculate next due date
      let nextDueDate: Date
      if (lastInspection && lastInspection.completedAt) {
        nextDueDate = addDays(new Date(lastInspection.completedAt), template.frequency)
      } else {
        // If no previous inspection, start from today
        nextDueDate = addDays(new Date(), template.frequency)
      }

      // Check if we need to create a new inspection
      const existingPendingInspection = await prisma.inspectionInstance.findFirst({
        where: {
          masterTemplateId: template.id,
          status: {
            in: ["PENDING", "IN_PROGRESS"],
          },
        },
      })

      // Only create if no pending inspection exists and due date is within next 7 days
      if (!existingPendingInspection && nextDueDate <= addDays(new Date(), 7)) {
        // Find available inspectors in the same organization
        const availableInspectors = await prisma.user.findMany({
          where: {
            organizationId: template.organizationId,
            role: "INSPECTOR",
            // Optionally filter by department if template has one
            ...(template.departmentId && {
              departmentId: template.departmentId,
            }),
          },
        })

        if (availableInspectors.length > 0) {
          // Assign to inspector with least pending inspections
          const inspectorWorkload = await Promise.all(
            availableInspectors.map(async (inspector) => {
              const pendingCount = await prisma.inspectionInstance.count({
                where: {
                  inspectorId: inspector.id,
                  status: {
                    in: ["PENDING", "IN_PROGRESS"],
                  },
                },
              })
              return { inspector, pendingCount }
            }),
          )

          const assignedInspector = inspectorWorkload.sort((a, b) => a.pendingCount - b.pendingCount)[0].inspector

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

          console.log(`Created inspection for template ${template.name}, assigned to ${assignedInspector.email}`)
        }
      }
    }
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
