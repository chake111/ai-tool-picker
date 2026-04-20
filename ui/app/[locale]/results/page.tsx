"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { HomeCompareEntry } from "@/components/home/home-compare-entry"
import { ResultsList } from "@/components/results/results-list"
import { FILTER_OPTIONS, SORT_OPTIONS, useSearchFlow, type DisplayItem } from "@/hooks/use-search-flow"
import { useFavorites } from "@/hooks/use-favorites"
import { useHistory } from "@/hooks/use-history"
import { track, trackCompare, trackFavorite, trackSearch } from "@/lib/track"

const MAX_COMPARE_TOOLS = 3
const FEEDBACK_DURATION_MS = 1500

type ActionType = "favorite" | "compare" | "visit"
type ActionFeedbackMap = Record<string, Partial<Record<ActionType, number>>>

export default function ResultsPage() {
  const t = useTranslations()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const [compareTools, setCompareTools] = useState<DisplayItem[]>([])
  const [actionFeedbackMap, setActionFeedbackMap] = useState<ActionFeedbackMap>({})
  const initialQuery = searchParams.get("query")?.trim() ?? ""
  const lastSearched = useRef("")

  const history = useHistory()
  const { favorites, setFavorites } = useFavorites()
  const searchFlow = useSearchFlow({
    locale,
    onSearchSuccess: (query) => {
      history.addEntry(query)
      void trackSearch(query)
    },
  })

  const touchActionFeedback = useCallback((toolName: string, action: ActionType) => {
    setActionFeedbackMap((prev) => ({
      ...prev,
      [toolName]: {
        ...(prev[toolName] ?? {}),
        [action]: Date.now(),
      },
    }))
  }, [])

  const getActionFeedbackState = useCallback(
    (toolName: string, action: ActionType) => {
      const createdAt = actionFeedbackMap[toolName]?.[action]
      if (!createdAt) return "idle" as const
      return Date.now() - createdAt < FEEDBACK_DURATION_MS ? ("done" as const) : ("idle" as const)
    },
    [actionFeedbackMap],
  )

  useEffect(() => {
    if (!initialQuery || lastSearched.current === initialQuery) return
    lastSearched.current = initialQuery
    searchFlow.setQuery(initialQuery)
    void searchFlow.search(initialQuery, t("home.searchEmptyPrompt"), t("errors.recommendationFailed"))
  }, [initialQuery, searchFlow, t])

  const toggleCompare = (tool: DisplayItem) => {
    setCompareTools((prev) => {
      const exists = prev.some((item) => item.name === tool.name)
      const next = exists ? prev.filter((item) => item.name !== tool.name) : prev.length >= MAX_COMPARE_TOOLS ? prev : [...prev, tool]
      if (!exists && next.length > prev.length) {
        touchActionFeedback(tool.name, "compare")
        toast({ description: locale === "zh" ? "已加入对比" : "Added to compare" })
        void trackCompare(tool.name, { source: "results_page" })
      }
      return next
    })
  }

  const toggleFavorite = (tool: DisplayItem) => {
    const exists = favorites.some((item) => item.name === tool.name)
    const nextFavorites = exists
      ? favorites.filter((item) => item.name !== tool.name)
      : [
          ...favorites,
          {
            toolId: tool.name,
            name: tool.name,
            desc: tool.desc,
            reason: tool.reason,
            link: tool.link,
            tags: tool.tags,
          },
        ]
    setFavorites(nextFavorites)
    touchActionFeedback(tool.name, "favorite")
    toast({ description: locale === "zh" ? (exists ? "已取消收藏" : "已加入收藏") : exists ? "Removed from favorites" : "Added to favorites" })
    void trackFavorite(tool.name, exists ? "remove" : "add", { source: "results_page" })
  }

  const visitWebsite = (tool: DisplayItem) => {
    touchActionFeedback(tool.name, "visit")
    toast({ description: locale === "zh" ? "已打开官网" : "Website opened" })
    void track({ action: "click", toolId: tool.name, metadata: { source: "results_page", target: "official_site" } })
    window.open(tool.link, "_blank", "noopener,noreferrer")
  }

  const compareQuery = useMemo(() => encodeURIComponent(compareTools.map((tool) => tool.name).join(",")), [compareTools])

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      {searchFlow.error && <p className="text-sm text-destructive">{searchFlow.error}</p>}

      <ResultsList
        title={t("home.resultsTitle")}
        emptyHint={t("home.emptyHint")}
        isLoading={searchFlow.isLoading}
        results={searchFlow.results}
        pagedResults={searchFlow.pagedResults}
        compareTools={compareTools}
        favorites={favorites.map((item) => item.name)}
        filters={searchFlow.filters}
        filterOptions={FILTER_OPTIONS}
        onFilterSelect={searchFlow.setFilterAndResetPage}
        getFilterLabel={(option) => t(`filters.options.${option}`)}
        sortBy={searchFlow.sortBy}
        sortOptions={SORT_OPTIONS}
        onSortSelect={searchFlow.setSortAndResetPage}
        getSortLabel={(option) => t(`resultsToolbar.sort.${option}`)}
        clearConditionsLabel={t("resultsToolbar.clear")}
        onClearConditions={searchFlow.clearConditions}
        onToggleCompare={toggleCompare}
        onToggleFavorite={toggleFavorite}
        onVisitWebsite={visitWebsite}
        getActionFeedbackState={getActionFeedbackState}
        addLabel={t("compare.add")}
        addedLabel={t("compare.added")}
        favoriteLabel={t("favorites.add")}
        favoritedLabel={t("favorites.added")}
        visitWebsiteLabel={t("common.visitWebsite")}
        visitedWebsiteLabel={t("resultsToolbar.visited")}
        showPagination={searchFlow.filteredResults.length > 0}
        currentPage={searchFlow.currentPage}
        totalPages={searchFlow.totalPages}
        pageLabel={t("home.history.pagination.page", { current: searchFlow.currentPage, total: searchFlow.totalPages })}
        previousLabel={t("home.pagination.previous")}
        nextLabel={t("home.pagination.next")}
        onPreviousPage={searchFlow.previousPage}
        onNextPage={searchFlow.nextPage}
      />

      <HomeCompareEntry
        locale={locale}
        selectedCount={compareTools.length}
        maxCount={MAX_COMPARE_TOOLS}
        compareQuery={compareQuery}
        compareTools={compareTools}
      />
    </main>
  )
}
