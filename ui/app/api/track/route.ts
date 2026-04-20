import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type TrackPayload = {
  event: "search" | "favorite" | "click" | "exposure" | "impression"
  anonymousId: string
  timestamp: number
  page?: string
  toolId?: string
  keyword?: string
  operation?: "add" | "remove"
  metadata?: Record<string, unknown>
}

const VALID_EVENTS = new Set<TrackPayload["event"]>(["search", "favorite", "click", "exposure", "impression"])

function isValidPayload(payload: unknown): payload is TrackPayload {
  if (!payload || typeof payload !== "object") return false
  const candidate = payload as Partial<TrackPayload>
  if (!candidate.event || !VALID_EVENTS.has(candidate.event)) return false
  if (typeof candidate.anonymousId !== "string" || !candidate.anonymousId.trim()) return false
  if (typeof candidate.timestamp !== "number") return false

  if (candidate.event === "search") {
    return typeof candidate.keyword === "string" && candidate.keyword.trim().length > 0
  }
  if (candidate.event === "favorite") {
    return (
      typeof candidate.toolId === "string" &&
      candidate.toolId.trim().length > 0 &&
      (candidate.operation === "add" || candidate.operation === "remove")
    )
  }
  if (candidate.event === "click") {
    return typeof candidate.toolId === "string" && candidate.toolId.trim().length > 0
  }
  if (candidate.event === "exposure" || candidate.event === "impression") {
    return typeof candidate.toolId === "string" && candidate.toolId.trim().length > 0
  }
  return false
}

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    console.warn("[track] payload_validation_failed", { reason: "invalid_json" })
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  if (!isValidPayload(payload)) {
    console.warn("[track] payload_validation_failed", { reason: "schema_invalid" })
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null
  console.info("[track] auth_state", { isAuthenticated: Boolean(userId) })

  const eventRecord = {
    action: payload.event === "exposure" ? "impression" : payload.event,
    toolId: payload.toolId ?? null,
    keyword: payload.keyword ?? null,
    metadata:
      payload.event === "favorite"
        ? {
            operation: payload.operation,
            ...(payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {}),
          }
        : payload.event === "exposure" || payload.event === "impression" || payload.event === "click"
          ? (payload.metadata as Prisma.InputJsonValue | undefined)
          : undefined,
    userId,
  }

  try {
    await prisma.userEvent.create({
      data: eventRecord,
    })
  } catch (error) {
    console.error("[track] db_write_failed", {
      action: eventRecord.action,
      hasToolId: Boolean(eventRecord.toolId),
      hasKeyword: Boolean(eventRecord.keyword),
      hasMetadata: Boolean(eventRecord.metadata),
      isAuthenticated: Boolean(userId),
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  console.info("[track] event_persisted", {
    action: eventRecord.action,
    hasToolId: Boolean(eventRecord.toolId),
    hasKeyword: Boolean(eventRecord.keyword),
    hasMetadata: Boolean(eventRecord.metadata),
    isAuthenticated: Boolean(userId),
  })
  return NextResponse.json({ ok: true })
}
