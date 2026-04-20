"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { HomeCompareEntry } from "@/components/home/home-compare-entry"
import { HomeHero } from "@/components/home/home-hero"
import { HomeQuickScenes } from "@/components/home/home-quick-scenes"
import { HomeResults } from "@/components/home/home-results"
import { SearchInput } from "@/components/search-input"
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
const RESULTS_PER_PAGE = 6
const FILTER_OPTIONS = ["all", "free", "paid", "beginner", "pro", "chinese"] as const

type FilterOption = (typeof FILTER_OPTIONS)[number]

export default function HomePage() {
  const t = useTranslations()
  const locale = useLocale()
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState<DisplayItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterOption>("all")
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
      setCurrentPage(1)
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

  const filteredResults = useMemo(() => {
    if (filters === "all") return results

    const includesAny = (item: DisplayItem, candidates: string[]) => {
      const text = `${item.priceRange} ${item.platform} ${item.languageSupport} ${(item.tags ?? []).join(" ")}`.toLowerCase()
      return candidates.some((candidate) => text.includes(candidate))
    }

    return results.filter((item) => {
      if (filters === "free") return includesAny(item, ["free", "免费"])
      if (filters === "paid") return includesAny(item, ["paid", "付费", "订阅", "pro"])
      if (filters === "beginner") return includesAny(item, ["beginner", "新手", "easy", "入门"])
      if (filters === "pro") return includesAny(item, ["pro", "advanced", "专业"])
      return includesAny(item, ["chinese", "中文", "zh"])
    })
  }, [filters, results])

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / RESULTS_PER_PAGE))
  const pageStart = (currentPage - 1) * RESULTS_PER_PAGE
  const pagedResults = filteredResults.slice(pageStart, pageStart + RESULTS_PER_PAGE)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <HomeHero title={t("home.title")} subtitle={t("home.subtitle")} actions={<HomeQuickScenes scenes={quickScenes} query={query} onSelect={setQuery} />} />

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

      <HomeResults
        title={t("home.resultsTitle")}
        emptyHint={t("home.emptyHint")}
        isLoading={isLoading}
        results={results}
        pagedResults={pagedResults}
        compareTools={compareTools}
        filters={filters}
        filterOptions={FILTER_OPTIONS}
        onFilterSelect={(option) => {
          setFilters(option)
          setCurrentPage(1)
        }}
        getFilterLabel={(option) => t(`filters.options.${option}`)}
        onToggleCompare={toggleCompare}
        addLabel={t("compare.add")}
        addedLabel={t("compare.added")}
        visitWebsiteLabel={t("common.visitWebsite")}
        showPagination={filteredResults.length > 0}
        currentPage={currentPage}
        totalPages={totalPages}
        pageLabel={t("home.history.pagination.page", { current: currentPage, total: totalPages })}
        previousLabel={t("home.pagination.previous")}
        nextLabel={t("home.pagination.next")}
        onPreviousPage={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        onNextPage={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
      />

      <HomeCompareEntry locale={locale} selectedCount={compareTools.length} maxCount={MAX_COMPARE_TOOLS} compareQuery={compareQuery} />
    </main>
  )
}
