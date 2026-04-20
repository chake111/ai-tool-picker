import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100
const MIN_SAMPLE_FOR_COVERAGE = 1

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
        metadata: true,
        userId: true,
        createdAt: true,
      },
    })
    const metricsByBucket = buildMetricsByBucket(events)
    return NextResponse.json({ ok: true, events, metricsByBucket })
  } catch (error) {
    console.error("[track-debug] db_read_failed", {
      requestedLimit: limit,
      error: error instanceof Error ? error.message : "unknown_error",
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

type DebugEvent = {
  action: "search" | "favorite" | "click" | "exposure" | "impression"
  toolId: string | null
  keyword: string | null
  metadata: unknown
  createdAt: Date
}

function toBucketKey(locale: string, scenario: string): string {
  return `${locale}::${scenario}`
}

function buildMetricsByBucket(events: DebugEvent[]) {
  const buckets = new Map<
    string,
    {
      locale: string
      scenario: string
      impressions: number
      clicks: number
      favorites: number
      searches: number
      firstClicks: number
      toolSet: Set<string>
      tagSet: Set<string>
    }
  >()

  for (const event of events) {
    const metadata = event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata) ? event.metadata : {}
    const locale = typeof (metadata as { locale?: unknown }).locale === "string" ? (metadata as { locale: string }).locale : "unknown"
    const scenario =
      typeof (metadata as { scenario?: unknown }).scenario === "string"
        ? (metadata as { scenario: string }).scenario
        : "general"
    const key = toBucketKey(locale, scenario)
    const current =
      buckets.get(key) ??
      {
        locale,
        scenario,
        impressions: 0,
        clicks: 0,
        favorites: 0,
        searches: 0,
        firstClicks: 0,
        toolSet: new Set<string>(),
        tagSet: new Set<string>(),
      }
    if (event.action === "impression" || event.action === "exposure") current.impressions += 1
    if (event.action === "click") {
      current.clicks += 1
      const rank = typeof (metadata as { rank?: unknown }).rank === "number" ? (metadata as { rank: number }).rank : Number.NaN
      if (rank === 1) current.firstClicks += 1
    }
    if (event.action === "favorite") current.favorites += 1
    if (event.action === "search") current.searches += 1
    if (event.toolId) current.toolSet.add(event.toolId.toLowerCase())
    const tags = Array.isArray((metadata as { tags?: unknown }).tags) ? ((metadata as { tags?: string[] }).tags ?? []) : []
    for (const tag of tags) {
      if (typeof tag === "string" && tag.trim()) current.tagSet.add(tag.trim().toLowerCase())
    }
    buckets.set(key, current)
  }

  return Array.from(buckets.values()).map((bucket) => {
    const ctr = bucket.impressions > 0 ? bucket.clicks / bucket.impressions : 0
    const favoriteRate = bucket.clicks > 0 ? bucket.favorites / bucket.clicks : 0
    const firstClickRate = bucket.clicks > 0 ? bucket.firstClicks / bucket.clicks : 0
    const toolCoverage = bucket.searches >= MIN_SAMPLE_FOR_COVERAGE ? bucket.toolSet.size / bucket.searches : 0
    const diversityIndex = bucket.impressions > 0 ? bucket.toolSet.size / bucket.impressions : 0
    return {
      locale: bucket.locale,
      scenario: bucket.scenario,
      counts: {
        searches: bucket.searches,
        impressions: bucket.impressions,
        clicks: bucket.clicks,
        favorites: bucket.favorites,
      },
      metrics: {
        ctr: Number(ctr.toFixed(4)),
        favoriteRate: Number(favoriteRate.toFixed(4)),
        firstClickRate: Number(firstClickRate.toFixed(4)),
        toolCoverage: Number(toolCoverage.toFixed(4)),
        diversityIndex: Number(diversityIndex.toFixed(4)),
      },
    }
  })
}
