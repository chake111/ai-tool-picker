import { NextResponse } from "next/server"
import { getAuthConfigDebugSnapshot } from "@/lib/auth"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    auth: getAuthConfigDebugSnapshot(),
    note: "Debug endpoint is only available in non-production environments.",
  })
}
