"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { HomeCompareEntry } from "@/components/home/home-compare-entry"
import { ResultsList } from "@/components/results/results-list"
import { FILTER_OPTIONS, useSearchFlow } from "@/hooks/use-search-flow"
import { useHistory } from "@/hooks/use-history"
import { trackCompare, trackSearch } from "@/lib/track"
import type { RecommendItem } from "@/lib/recommend"

type DisplayItem = RecommendItem & {
  priceRange: string
  platform: string
  languageSupport: string
}

const MAX_COMPARE_TOOLS = 3

export default function ResultsPage() {
  const t = useTranslations()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const [compareTools, setCompareTools] = useState<DisplayItem[]>([])
  const initialQuery = searchParams.get("query")?.trim() ?? ""
  const lastSearched = useRef("")

  const history = useHistory()
  const searchFlow = useSearchFlow({
    locale,
    onSearchSuccess: (query) => {
      history.addEntry(query)
      void trackSearch(query)
    },
  })

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
        toast({ description: locale === "zh" ? "已加入对比" : "Added to compare" })
        void trackCompare(tool.name, { source: "results_page" })
      }
      return next
    })
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
        filters={searchFlow.filters}
        filterOptions={FILTER_OPTIONS}
        onFilterSelect={searchFlow.setFilterAndResetPage}
        getFilterLabel={(option) => t(`filters.options.${option}`)}
        onToggleCompare={toggleCompare}
        addLabel={t("compare.add")}
        addedLabel={t("compare.added")}
        visitWebsiteLabel={t("common.visitWebsite")}
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
