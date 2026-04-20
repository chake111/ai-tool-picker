"use client"

import { useCallback, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { sanitizeFavoriteItem, type FavoriteItem } from "@/lib/favorites-store"

export const FAVORITES_STORAGE_KEY = "ai_tool_picker_favorites"

const sanitizeFavorites = (input: unknown): FavoriteItem[] => {
  if (!Array.isArray(input)) return []
  return input.map((item) => sanitizeFavoriteItem(item)).filter((item): item is FavoriteItem => Boolean(item))
}

async function fetchRemoteFavorites(): Promise<FavoriteItem[]> {
  const response = await fetch("/api/favorites", { method: "GET" })
  if (!response.ok) throw new Error("load favorites failed")

  const data = (await response.json()) as { favorites?: unknown }
  return sanitizeFavorites(data.favorites)
}

async function saveRemoteFavorites(favorites: FavoriteItem[]) {
  const response = await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favorites }),
  })
  if (!response.ok) throw new Error("save favorites failed")
}

export function useFavorites(storageKey = FAVORITES_STORAGE_KEY) {
  const { status } = useSession()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]")
      setFavorites(sanitizeFavorites(parsed))
    } catch {
      setFavorites([])
    }
  }, [storageKey])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(favorites))
  }, [favorites, storageKey])

  useEffect(() => {
    if (status !== "authenticated") return

    let cancelled = false

    const syncFromRemote = async () => {
      try {
        const remoteFavorites = await fetchRemoteFavorites()
        if (cancelled) return

        setFavorites((prev) => {
          const merged = [...remoteFavorites]
          prev.forEach((item) => {
            const key = item.toolId ?? item.name
            if (!merged.some((fav) => (fav.toolId ?? fav.name) === key)) {
              merged.push(item)
            }
          })
          void saveRemoteFavorites(merged)
          return merged
        })
      } catch {
        // ignore sync errors on client and keep local data as source of truth
      }
    }

    void syncFromRemote()
    return () => {
      cancelled = true
    }
  }, [status])

  const replaceFavorites = useCallback(
    (next: FavoriteItem[]) => {
      setFavorites(next)
      if (status === "authenticated") {
        void saveRemoteFavorites(next)
      }
    },
    [status],
  )

  const removeFavorite = useCallback(
    (name: string) => {
      setFavorites((prev) => {
        const next = prev.filter((item) => item.name !== name)
        if (status === "authenticated") {
          void saveRemoteFavorites(next)
        }
        return next
      })
    },
    [status],
  )

  return {
    favorites,
    setFavorites: replaceFavorites,
    removeFavorite,
    syncStatus: status,
  }
}
