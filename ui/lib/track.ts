export type TrackEventType = "search" | "favorite" | "click"

type BaseTrackPayload = {
  event: TrackEventType
  anonymousId: string
  page?: string
  timestamp?: number
}

type SearchTrackPayload = BaseTrackPayload & {
  event: "search"
  query: string
}

type FavoriteTrackPayload = BaseTrackPayload & {
  event: "favorite"
  toolName: string
  action: "add" | "remove"
}

type ClickTrackPayload = BaseTrackPayload & {
  event: "click"
  toolName: string
  targetUrl: string
}

export type TrackPayload = SearchTrackPayload | FavoriteTrackPayload | ClickTrackPayload
export type TrackClientPayload =
  | {
      event: "search"
      query: string
    }
  | {
      event: "favorite"
      toolName: string
      action: "add" | "remove"
    }
  | {
      event: "click"
      toolName: string
      targetUrl: string
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

export async function trackEvent(payload: TrackClientPayload) {
  const requestPayload: TrackPayload = {
    ...payload,
    anonymousId: getAnonymousId(),
    page: typeof window !== "undefined" ? window.location.pathname : "/",
    timestamp: Date.now(),
  } as TrackPayload

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
    throw new Error(`Track request failed: ${response.status}`)
  }
}
