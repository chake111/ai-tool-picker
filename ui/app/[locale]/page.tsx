"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { SearchInput } from "@/components/search-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { RecommendItem } from "@/lib/recommend"
import quickScenesConfig from "@/data/quick-scenes.json"

type QuickSceneConfig = {
  id: string
  presetQuery: string
  languageKey: string
  order: number
}

type DisplayItem = RecommendItem & {
  priceRange: string
  platform: string
  languageSupport: string
}

const MAX_COMPARE_TOOLS = 3

export default function HomePage() {
  const t = useTranslations()
  const locale = useLocale()
  const [query, setQuery] = useState("")
  const [selectedQuickScene, setSelectedQuickScene] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState<DisplayItem[]>([])
  const [compareTools, setCompareTools] = useState<DisplayItem[]>([])

  const quickScenes = useMemo(
    () =>
      [...(quickScenesConfig as QuickSceneConfig[])]
        .sort((a, b) => a.order - b.order)
        .map((scene) => ({ ...scene, label: t(scene.languageKey) })),
    [t],
  )

  const handleSearch = async (nextQuery: string) => {
    const trimmed = nextQuery.trim()
    if (!trimmed) {
      setError(t("home.searchEmptyPrompt"))
      return
    }

    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, locale }),
      })

      if (!response.ok) {
        throw new Error("request failed")
      }

      const data = (await response.json()) as { recommendations?: RecommendItem[] }
      const normalized = (data.recommendations ?? []).map((item) => ({
        ...item,
        priceRange: item.priceRange?.trim() || (locale === "zh" ? "未知" : "Unknown"),
        platform: item.platform?.trim() || (locale === "zh" ? "未知" : "Unknown"),
        languageSupport: item.languageSupport?.trim() || (locale === "zh" ? "未知" : "Unknown"),
      }))
      setResults(normalized)
    } catch {
      setError(t("errors.recommendationFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCompare = (tool: DisplayItem) => {
    setCompareTools((prev) => {
      const exists = prev.some((item) => item.name === tool.name)
      if (exists) return prev.filter((item) => item.name !== tool.name)
      if (prev.length >= MAX_COMPARE_TOOLS) return prev
      return [...prev, tool]
    })
  }

  const compareQuery = encodeURIComponent(compareTools.map((tool) => tool.name).join(","))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">{t("home.title")}</h1>
        <p className="text-muted-foreground">{t("home.subtitle")}</p>
        <div className="flex flex-wrap gap-2">
          {quickScenes.map((scene) => (
            <Button
              key={scene.id}
              type="button"
              variant={selectedQuickScene === scene.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedQuickScene(scene.id)
                setQuery(scene.presetQuery)
              }}
            >
              {scene.label}
            </Button>
          ))}
        </div>
      </section>

      <SearchInput
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        isLoading={isLoading}
        placeholder={t("home.searchPlaceholder")}
        submitLabel={t("home.searchAction")}
        loadingLabel={t("common.thinking")}
        helperText={t("home.searchHelper")}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("home.resultsTitle")}</h2>
          <Link href={`/${locale}/favorites`} className="text-sm text-primary underline-offset-4 hover:underline">
            {locale === "zh" ? "去收藏页管理" : "Manage in Favorites"}
          </Link>
        </div>

        {results.length === 0 && !isLoading ? (
          <Card className="p-6 text-sm text-muted-foreground">{t("home.emptyHint")}</Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((item) => {
              const selected = compareTools.some((tool) => tool.name === item.name)
              return (
                <Card key={item.name} className="space-y-3 p-4">
                  <div>
                    <h3 className="text-base font-semibold">{item.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <p className="text-sm">{item.reason}</p>
                  <div className="flex flex-wrap gap-2">
                    {(item.tags ?? []).slice(0, 4).map((tag) => (
                      <Badge key={`${item.name}-${tag}`} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        {t("common.visitWebsite")}
                      </a>
                    </Button>
                    <Button size="sm" variant={selected ? "default" : "outline"} onClick={() => toggleCompare(item)}>
                      {selected ? t("compare.added") : t("compare.add")}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted-foreground">
            {locale === "zh"
              ? `已选 ${compareTools.length}/${MAX_COMPARE_TOOLS} 个工具进行对比`
              : `${compareTools.length}/${MAX_COMPARE_TOOLS} tools selected for compare`}
          </p>
          <Button asChild variant="outline" size="sm" disabled={compareTools.length < 2}>
            <Link href={`/${locale}/compare?tools=${compareQuery}`}>{locale === "zh" ? "进入对比页" : "Open compare"}</Link>
          </Button>
        </Card>
      </section>
    </main>
  )
}
