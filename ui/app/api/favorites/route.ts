import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import {
  FAVORITES_MAX_COUNT,
  getUserFavorites,
  sanitizeFavoriteItem,
  setUserFavorites,
  type FavoriteItem,
} from "@/lib/favorites-store"

const getUserKey = async () => {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return null
  return email
}

export async function GET() {
  const userKey = await getUserKey()
  if (!userKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({ favorites: getUserFavorites(userKey) })
}

export async function POST(request: Request) {
  const userKey = await getUserKey()
  if (!userKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const rawFavorites = (payload as { favorites?: unknown }).favorites
  if (!Array.isArray(rawFavorites)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const nextFavorites = rawFavorites
    .map((item) => sanitizeFavoriteItem(item))
    .filter((item): item is FavoriteItem => !!item)
    .slice(0, FAVORITES_MAX_COUNT)

  const savedFavorites = setUserFavorites(userKey, nextFavorites)
  return NextResponse.json({ favorites: savedFavorites })
}
