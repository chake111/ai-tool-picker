import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  FAVORITES_MAX_COUNT,
  sanitizeFavoriteItem,
  type FavoriteItem,
} from "@/lib/favorites-store"

const TOOL_ID_MAX_LENGTH = 255

const getUserKey = async () => {
  const session = await getServerSession(authOptions)
  const stableId = session?.user?.id?.trim()
  if (stableId) return stableId
  // Backward compatibility for sessions/providers that do not expose a stable id.
  const email = session?.user?.email?.trim()
  if (!email) return null
  return email
}

// Keep backwards compatibility for existing payloads: when toolId is absent, use name as stable identifier.
const toToolId = (favorite: FavoriteItem) => (favorite.toolId?.trim() || favorite.name.trim()).slice(0, TOOL_ID_MAX_LENGTH)
const hashUserKey = (userKey: string) => createHash("sha256").update(userKey).digest("hex").slice(0, 12)
const toResponseFavorite = (favorite: FavoriteItem) => ({
  name: favorite.name,
  desc: favorite.desc,
  reason: favorite.reason,
  link: favorite.link,
  tags: favorite.tags,
})

const dedupeFavorites = (favorites: FavoriteItem[]) => {
  const seen = new Set<string>()
  return favorites.filter((favorite) => {
    const key = toToolId(favorite)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function GET() {
  const userKey = await getUserKey()
  if (!userKey) {
    console.warn("[favorites] auth", { operation: "get", reason: "missing_session_user_email" })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: userKey },
      orderBy: { updatedAt: "desc" },
      take: FAVORITES_MAX_COUNT,
    })

    return NextResponse.json({
      favorites: favorites.map((favorite) => ({
        name: favorite.name,
        desc: favorite.desc,
        reason: favorite.reason,
        link: favorite.link ?? undefined,
        tags: favorite.tags.length > 0 ? favorite.tags : undefined,
      })),
    })
  } catch (error) {
    console.error("[favorites] db_read_failed", {
      operation: "get",
      error: error instanceof Error ? error.message : "unknown_error",
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const userKey = await getUserKey()
  if (!userKey) {
    console.warn("[favorites] auth", { operation: "post", reason: "missing_session_user_email" })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    console.warn("[favorites] validation", { operation: "post", reason: "invalid_json" })
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  if (!payload || typeof payload !== "object") {
    console.warn("[favorites] validation", { operation: "post", reason: "payload_not_object" })
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const rawFavorites = (payload as { favorites?: unknown }).favorites
  if (!Array.isArray(rawFavorites)) {
    console.warn("[favorites] validation", { operation: "post", reason: "favorites_not_array" })
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const nextFavorites = dedupeFavorites(
    rawFavorites
      .map((item) => sanitizeFavoriteItem(item))
      .filter((item): item is FavoriteItem => !!item)
      .slice(0, FAVORITES_MAX_COUNT),
  )

  try {
    await prisma.$transaction([
      prisma.userFavorite.deleteMany({ where: { userId: userKey } }),
      ...nextFavorites.map((favorite) =>
        prisma.userFavorite.create({
          data: {
            userId: userKey,
            toolId: toToolId(favorite),
            name: favorite.name,
            desc: favorite.desc,
            reason: favorite.reason,
            link: favorite.link ?? null,
            tags: favorite.tags ?? [],
          },
        }),
      ),
    ])
  } catch (error) {
    console.error("[favorites] db_write_failed", {
      operation: "post",
      userKeyHash: hashUserKey(userKey),
      favoritesCount: nextFavorites.length,
      error: error instanceof Error ? error.message : "unknown_error",
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  return NextResponse.json({ favorites: nextFavorites.map((favorite) => toResponseFavorite(favorite)) })
}
