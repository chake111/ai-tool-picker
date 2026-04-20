"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Trash2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { sanitizeFavoriteItem, type FavoriteItem } from "@/lib/favorites-store"

const FAVORITES_STORAGE_KEY = "ai_tool_picker_favorites"

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
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [sortMode, setSortMode] = useState<SortMode>("name")

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]")
      if (!Array.isArray(parsed)) return
      setFavorites(parsed.map((item) => sanitizeFavoriteItem(item)).filter((item): item is FavoriteItem => Boolean(item)))
    } catch {
      setFavorites([])
    }
  }, [])

  const sortedFavorites = useMemo(() => {
    const next = [...favorites]
    next.sort((a, b) => {
      if (sortMode === "ai") return getFavoriteAiScore(b) - getFavoriteAiScore(a)
      if (sortMode === "scenario") return (b.tags?.length ?? 0) - (a.tags?.length ?? 0)
      return a.name.localeCompare(b.name, locale === "zh" ? "zh-Hans-CN" : "en", { numeric: true, sensitivity: "base" })
    })
    return next
  }, [favorites, locale, sortMode])

  const removeFavorite = (name: string) => {
    setFavorites((prev) => {
      const next = prev.filter((item) => item.name !== name)
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("favorites.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("favorites.subtitle")}</p>
        </div>
        <select
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          aria-label={t("favorites.sortAria")}
        >
          <option value="name">{t("favorites.sort.name")}</option>
          <option value="ai">{t("favorites.sort.ai")}</option>
          <option value="scenario">{t("favorites.sort.scenario")}</option>
        </select>
      </section>

      {sortedFavorites.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">{t("favorites.empty")}</Card>
      ) : (
        <div className="grid gap-3">
          {sortedFavorites.map((item) => (
            <Card key={item.name} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{item.name}</h2>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Button size="icon-sm" variant="ghost" onClick={() => removeFavorite(item.name)} aria-label={t("favorites.removeOne", { name: item.name })}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="text-sm">{item.reason}</p>
              <div className="flex flex-wrap gap-2">
                {(item.tags ?? []).map((tag) => (
                  <span key={`${item.name}-${tag}`} className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
              {item.link ? (
                <Button asChild size="sm" variant="outline">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {t("common.visitWebsite")} <ExternalLink className="ml-1 size-3.5" />
                  </a>
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">{t("common.noWebsite")}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
