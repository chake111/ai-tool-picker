import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import type { TrackPayload } from "@/lib/track"

const VALID_EVENTS = new Set<TrackPayload["event"]>(["search", "favorite", "click"])

function isValidPayload(payload: unknown): payload is TrackPayload {
  if (!payload || typeof payload !== "object") return false
  const candidate = payload as Partial<TrackPayload>
  if (!candidate.event || !VALID_EVENTS.has(candidate.event)) return false
  if (typeof candidate.anonymousId !== "string" || !candidate.anonymousId.trim()) return false
  if (typeof candidate.timestamp !== "number") return false

  if (candidate.event === "search") {
    return typeof candidate.query === "string" && candidate.query.trim().length > 0
  }
  if (candidate.event === "favorite") {
    return (
      typeof candidate.toolName === "string" &&
      candidate.toolName.trim().length > 0 &&
      (candidate.action === "add" || candidate.action === "remove")
    )
  }
  if (candidate.event === "click") {
    return (
      typeof candidate.toolName === "string" &&
      candidate.toolName.trim().length > 0 &&
      typeof candidate.targetUrl === "string" &&
      candidate.targetUrl.trim().length > 0
    )
  }
  return false
}

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null

  const eventRecord = {
    event: payload.event,
    userId,
    anonymousId: payload.anonymousId,
    page: payload.page ?? "/",
    timestamp: payload.timestamp,
    metadata:
      payload.event === "search"
        ? { query: payload.query }
        : payload.event === "favorite"
          ? { toolName: payload.toolName, action: payload.action }
          : { toolName: payload.toolName, targetUrl: payload.targetUrl },
  }

  console.log("[track]", eventRecord)
  return NextResponse.json({ ok: true })
}
