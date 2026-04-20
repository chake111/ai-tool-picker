"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { HomeCompareEntry } from "@/components/home/home-compare-entry"
import { ResultsList } from "@/components/results/results-list"
import { FILTER_OPTIONS, SORT_OPTIONS, filterItems, useSearchFlow, type DisplayItem, type FilterOption } from "@/hooks/use-search-flow"
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
  const [refineQuery, setRefineQuery] = useState("")
  const initialQuery = searchParams.get("query")?.trim() ?? ""
  const lastSearched = useRef("")

  const history = useHistory()
  const { favorites, setFavorites } = useFavorites()
  const searchFlow = useSearchFlow({
    locale,
    onSearchSuccess: ({ query, requestId }) => {
      history.addEntry(query)
      setRefineQuery(query)
      void trackSearch(query, {
        entry: "results_page",
        locale,
        request_id: requestId,
      })
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
    setRefineQuery(initialQuery)
    void searchFlow.search(initialQuery, t("home.searchEmptyPrompt"), t("errors.recommendationFailed"))
  }, [initialQuery, searchFlow, t])

  const onFilterSelect = (option: FilterOption) => {
    const beforeCount = searchFlow.filteredResults.length
    const afterCount = filterItems(searchFlow.results, option).length
    searchFlow.setFilterAndResetPage(option)
    void track({
      action: "click",
      toolId: `filter:${option}`,
      metadata: {
        action: "filter_apply",
        locale,
        query: searchFlow.query,
        request_id: searchFlow.requestId,
        filter_key: "preset",
        filter_value: option,
        result_count_before: beforeCount,
        result_count_after: afterCount,
      },
    })
  }

  const onRefineSubmit = () => {
    const trimmed = refineQuery.trim()
    if (!trimmed) {
      toast({ description: t("home.searchEmptyPrompt") })
      return
    }

    void searchFlow.search(trimmed, t("home.searchEmptyPrompt"), t("errors.recommendationFailed"))
    void track({
      action: "click",
      toolId: "refine",
      metadata: {
        action: "refine_submit",
        locale,
        query: searchFlow.query,
        refine_query: trimmed,
        request_id: searchFlow.requestId,
        active_filter: searchFlow.filters,
        active_sort: searchFlow.sortBy,
      },
    })
  }

  const toggleCompare = (tool: DisplayItem) => {
    setCompareTools((prev) => {
      const exists = prev.some((item) => item.name === tool.name)
      const next = exists ? prev.filter((item) => item.name !== tool.name) : prev.length >= MAX_COMPARE_TOOLS ? prev : [...prev, tool]
      if (!exists && next.length > prev.length) {
        touchActionFeedback(tool.name, "compare")
        toast({ description: locale === "zh" ? "已加入对比" : "Added to compare" })
        void trackCompare(tool.name, { source: "results_page", request_id: searchFlow.requestId, query: searchFlow.query, locale })
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
    void trackFavorite(tool.name, exists ? "remove" : "add", { source: "results_page", request_id: searchFlow.requestId, query: searchFlow.query, locale })
  }

  const visitWebsite = (tool: DisplayItem) => {
    touchActionFeedback(tool.name, "visit")
    toast({ description: locale === "zh" ? "已打开官网" : "Website opened" })
    void track({
      action: "click",
      toolId: tool.name,
      metadata: {
        source: "results_page",
        target: "official_site",
        request_id: searchFlow.requestId,
        query: searchFlow.query,
        locale,
      },
    })
    window.open(tool.link, "_blank", "noopener,noreferrer")
  }

  const compareQuery = useMemo(() => encodeURIComponent(compareTools.map((tool) => tool.name).join(",")), [compareTools])

  return (
    <main className="app-page-container">
      {searchFlow.error && <p className="text-sm text-destructive">{searchFlow.error}</p>}

      <ResultsList
        title={t("resultsPage.title")}
        summary={t("resultsPage.summary")}
        currentQuery={searchFlow.query || initialQuery}
        resultCountLabel={t("resultsPage.resultCount", { count: searchFlow.filteredResults.length })}
        workspaceEyebrow={t("resultsPage.workspaceEyebrow")}
        matchScoreLabel={t("resultsPage.matchScore")}
        reputationLabel={t("resultsPage.reputation")}
        reasonsLabel={t("resultsPage.reasons")}
        bestForLabel={t("resultsPage.bestFor")}
        caveatsLabel={t("resultsPage.caveats")}
        capabilityLabel={t("resultsPage.capabilities")}
        nextActionLabel={t("resultsPage.nextAction")}
        detailsLabel={t("details.view")}
        compareReadyLabel={t("resultsPage.compareReady")}
        comparedLabel={t("resultsPage.inCompare")}
        emptyHint={t("resultsStates.empty")}
        noMatchHint={t("resultsStates.noMatch")}
        loadingHint={t("resultsStates.loading")}
        isLoading={searchFlow.isLoading}
        results={searchFlow.results}
        pagedResults={searchFlow.pagedResults}
        compareTools={compareTools}
        favorites={favorites.map((item) => item.name)}
        filters={searchFlow.filters}
        filterOptions={FILTER_OPTIONS}
        onFilterSelect={onFilterSelect}
        getFilterLabel={(option) => t(`filters.options.${option}`)}
        sortBy={searchFlow.sortBy}
        sortOptions={SORT_OPTIONS}
        onSortSelect={searchFlow.setSortAndResetPage}
        getSortLabel={(option) => t(`resultsToolbar.sort.${option}`)}
        clearConditionsLabel={t("resultsToolbar.clear")}
        onClearConditions={searchFlow.clearConditions}
        refineQuery={refineQuery}
        onRefineQueryChange={setRefineQuery}
        refineInputLabel={t("resultsToolbar.refineInputLabel")}
        refineInputPlaceholder={t("resultsToolbar.refineInputPlaceholder")}
        refineSubmitLabel={t("resultsToolbar.refineSubmit")}
        onRefineSubmit={onRefineSubmit}
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
