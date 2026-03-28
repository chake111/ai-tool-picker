import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

function getLimit(rawLimit: string | null): number {
  if (!rawLimit) return DEFAULT_LIMIT
  const parsed = Number.parseInt(rawLimit, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(parsed, MAX_LIMIT)
}

export async function GET(request: Request) {
  if (process.env.TRACK_DEBUG_API_ENABLED !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = getLimit(searchParams.get("limit"))

  try {
    const events = await prisma.userEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        toolId: true,
        keyword: true,
        userId: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ ok: true, events })
  } catch (error) {
    console.error("[track-debug] db_read_failed", {
      requestedLimit: limit,
      error: error instanceof Error ? error.message : "unknown_error",
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
