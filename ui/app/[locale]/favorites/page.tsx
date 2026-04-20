"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { FavoritesList } from "@/components/favorites/favorites-list"
import { FavoritesToolbar } from "@/components/favorites/favorites-toolbar"
import { useFavorites } from "@/hooks/use-favorites"
import type { FavoriteItem } from "@/lib/favorites-store"
import { trackFavorite } from "@/lib/track"

type SortMode = "name" | "ai" | "scenario"

const AI_KEYWORD_REGEX = /(?:\bai\b|人工智能|大模型|生成式|llm|gpt|copilot|智能)/i

const getFavoriteAiScore = (tool: FavoriteItem) => {
  const source = `${tool.desc} ${tool.reason} ${(tool.tags ?? []).join(" ")}`
  const matches = source.match(AI_KEYWORD_REGEX)
  return matches?.length ?? 0
}

export default function FavoritesPage() {
  const t = useTranslations()
  const locale = useLocale()
  const { favorites, removeFavorite } = useFavorites()
  const [sortMode, setSortMode] = useState<SortMode>("name")

  const sortedFavorites = useMemo(() => {
    const next = [...favorites]
    next.sort((a, b) => {
      if (sortMode === "ai") return getFavoriteAiScore(b) - getFavoriteAiScore(a)
      if (sortMode === "scenario") return (b.tags?.length ?? 0) - (a.tags?.length ?? 0)
      return a.name.localeCompare(b.name, locale === "zh" ? "zh-Hans-CN" : "en", { numeric: true, sensitivity: "base" })
    })
    return next
  }, [favorites, locale, sortMode])

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <FavoritesToolbar
        title={t("favorites.title")}
        subtitle={t("favorites.subtitle")}
        sortMode={sortMode}
        onSortChange={setSortMode}
        sortAriaLabel={t("favorites.sortAria")}
        nameLabel={t("favorites.sort.name")}
        aiLabel={t("favorites.sort.ai")}
        scenarioLabel={t("favorites.sort.scenario")}
        statsLabel={locale === "zh" ? `共 ${sortedFavorites.length} 项收藏` : `${sortedFavorites.length} favorites`}
      />

      <FavoritesList
        items={sortedFavorites}
        emptyLabel={t("favorites.empty")}
        visitLabel={t("common.visitWebsite")}
        noWebsiteLabel={t("common.noWebsite")}
        getRemoveLabel={(name) => t("favorites.removeOne", { name })}
        onRemove={(name) => {
          removeFavorite(name)
          void trackFavorite(name, "remove", { source: "favorites_page" })
        }}
      />
    </main>
  )
}
