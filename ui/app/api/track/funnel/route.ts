import { subDays, startOfDay } from "date-fns"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const DEFAULT_DAYS = 7
const MAX_DAYS = 30

type FunnelStage = "search_submit" | "filter_apply" | "refine_submit" | "compare_add" | "visit_official_site"

const STAGE_ORDER: FunnelStage[] = ["search_submit", "filter_apply", "refine_submit", "compare_add", "visit_official_site"]

function getDays(rawDays: string | null) {
  if (!rawDays) return DEFAULT_DAYS
  const parsed = Number.parseInt(rawDays, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_DAYS
  return Math.min(parsed, MAX_DAYS)
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function resolveStage(action: string, toolId: string | null, metadata: unknown): FunnelStage | null {
  const m = asObject(metadata)
  const actionName = typeof m.action === "string" ? m.action : ""
  const entry = typeof m.entry === "string" ? m.entry : ""
  const target = typeof m.target === "string" ? m.target : ""

  if (action === "search") return "search_submit"
  if (action === "click" && actionName === "filter_apply") return "filter_apply"
  if (action === "click" && actionName === "refine_submit") return "refine_submit"
  if (action === "click" && (entry === "compare" || actionName === "compare_add")) return "compare_add"
  if (action === "click" && (target === "official_site" || actionName === "visit_official_site")) return "visit_official_site"
  if (toolId === "refine") return "refine_submit"
  return null
}

function formatDay(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const days = getDays(searchParams.get("days"))
  const since = startOfDay(subDays(new Date(), days - 1))

  const events = await prisma.userEvent.findMany({
    where: {
      createdAt: { gte: since },
      action: { in: ["search", "click"] },
    },
    orderBy: { createdAt: "asc" },
    select: {
      action: true,
      toolId: true,
      metadata: true,
      createdAt: true,
    },
  })

  const totals: Record<FunnelStage, number> = {
    search_submit: 0,
    filter_apply: 0,
    refine_submit: 0,
    compare_add: 0,
    visit_official_site: 0,
  }

  const daily = new Map<string, Record<FunnelStage, number>>()

  for (let i = 0; i < days; i += 1) {
    const day = formatDay(startOfDay(subDays(new Date(), days - i - 1)))
    daily.set(day, { ...totals })
  }

  for (const event of events) {
    const stage = resolveStage(event.action, event.toolId, event.metadata)
    if (!stage) continue
    totals[stage] += 1
    const dayKey = formatDay(event.createdAt)
    const current = daily.get(dayKey)
    if (current) current[stage] += 1
  }

  const stages = STAGE_ORDER.map((stage) => ({ stage, count: totals[stage] }))

  const dropOff = STAGE_ORDER.slice(0, -1).map((stage, index) => {
    const next = STAGE_ORDER[index + 1]
    const currentCount = totals[stage]
    const nextCount = totals[next]
    const drop = Math.max(0, currentCount - nextCount)
    const dropRate = currentCount > 0 ? drop / currentCount : 0
    return {
      from: stage,
      to: next,
      drop,
      dropRate: Number(dropRate.toFixed(4)),
    }
  })

  const biggestDropOff = dropOff.reduce(
    (max, item) => (item.dropRate > max.dropRate ? item : max),
    { from: "search_submit", to: "filter_apply", drop: 0, dropRate: 0 },
  )

  return NextResponse.json({
    ok: true,
    days,
    since,
    stages,
    daily: Array.from(daily.entries()).map(([day, counts]) => ({ day, counts })),
    dropOff,
    biggestDropOff,
  })
}
