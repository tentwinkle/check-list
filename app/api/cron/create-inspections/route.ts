import { NextResponse } from "next/server"
import { createScheduledInspections } from "@/lib/inspection-scheduler"

export async function GET() {
  try {
    // This endpoint can be called by a cron job (e.g., Vercel Cron)
    await createScheduledInspections()
    return NextResponse.json({ message: "Scheduled inspections created successfully" })
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// For manual triggering in development
export async function POST() {
  return GET()
}
