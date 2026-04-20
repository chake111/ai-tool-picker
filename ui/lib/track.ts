export type TrackAction = "search" | "favorite" | "click" | "exposure" | "impression"
export type FavoriteOperation = "add" | "remove"

type TrackEventPayload = {
  event: TrackAction
  anonymousId: string
  page?: string
  timestamp?: number
  toolId?: string
  keyword?: string
  operation?: FavoriteOperation
  metadata?: Record<string, unknown>
}

export type TrackInput =
  | {
      action: "search"
      keyword: string
    }
  | {
      action: "favorite"
      toolId: string
      operation: FavoriteOperation
      metadata?: Record<string, unknown>
    }
  | {
      action: "click"
      toolId: string
      metadata?: Record<string, unknown>
    }
  | {
      action: "exposure"
      toolId: string
      metadata?: Record<string, unknown>
    }
  | {
      action: "impression"
      toolId: string
      metadata?: Record<string, unknown>
    }

const ANONYMOUS_ID_STORAGE_KEY = "ai_tool_picker_anonymous_id"

function createAnonymousId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function getAnonymousId(): string {
  if (typeof window === "undefined") {
    return "server-anonymous"
  }
  const existing = window.localStorage.getItem(ANONYMOUS_ID_STORAGE_KEY)
  if (existing) {
    return existing
  }
  const nextId = createAnonymousId()
  window.localStorage.setItem(ANONYMOUS_ID_STORAGE_KEY, nextId)
  return nextId
}

export async function track(payload: TrackInput) {
  const requestPayload: TrackEventPayload = {
    event: payload.action,
    toolId: "toolId" in payload ? payload.toolId : undefined,
    keyword: payload.action === "search" ? payload.keyword : undefined,
    operation: payload.action === "favorite" ? payload.operation : undefined,
    metadata:
      payload.action === "exposure" ||
      payload.action === "impression" ||
      payload.action === "click" ||
      payload.action === "favorite"
        ? payload.metadata
        : undefined,
    anonymousId: getAnonymousId(),
    page: typeof window !== "undefined" ? window.location.pathname : "/",
    timestamp: Date.now(),
  }

  const response = await fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload),
    keepalive: true,
  })

  if (!response.ok) {
    console.error("Track request failed", {
      status: response.status,
      event: requestPayload.event,
    })
    throw new Error(`Track request failed for ${requestPayload.event}: ${response.status}`)
  }
}

export function trackSearch(keyword: string) {
  return track({ action: "search", keyword })
}

export function trackFavorite(toolId: string, operation: FavoriteOperation, metadata?: Record<string, unknown>) {
  return track({ action: "favorite", toolId, operation, metadata })
}

export function trackCompare(toolId: string, metadata?: Record<string, unknown>) {
  return track({ action: "click", toolId, metadata: { entry: "compare", ...metadata } })
}

export function trackDetailView(toolId: string, metadata?: Record<string, unknown>) {
  return track({ action: "impression", toolId, metadata: { entry: "detail_view", ...metadata } })
}
