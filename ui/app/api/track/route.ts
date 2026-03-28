import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

type TrackPayload = {
  event: "search" | "favorite" | "click"
  anonymousId: string
  timestamp: number
  page?: string
  toolId?: string
  keyword?: string
}

const VALID_EVENTS = new Set<TrackPayload["event"]>(["search", "favorite", "click"])

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
    return typeof candidate.toolId === "string" && candidate.toolId.trim().length > 0
  }
  if (candidate.event === "click") {
    return typeof candidate.toolId === "string" && candidate.toolId.trim().length > 0
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
        ? { keyword: payload.keyword }
        : { toolId: payload.toolId, keyword: payload.keyword },
  }

  console.log("[track]", eventRecord)
  return NextResponse.json({ ok: true })
}
