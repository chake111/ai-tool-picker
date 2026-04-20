"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { HomeCompareEntry } from "@/components/home/home-compare-entry"
import { HomeHero } from "@/components/home/home-hero"
import { HomeQuickScenes } from "@/components/home/home-quick-scenes"
import { HomeResults } from "@/components/home/home-results"
import { SearchInput } from "@/components/search-input"
import { FILTER_OPTIONS, useSearchFlow } from "@/hooks/use-search-flow"
import { useHistory } from "@/hooks/use-history"
import { trackCompare, trackSearch } from "@/lib/track"
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
  const [compareTools, setCompareTools] = useState<DisplayItem[]>([])

  const history = useHistory()
  const searchFlow = useSearchFlow({
    locale,
    onSearchSuccess: (query) => {
      history.addEntry(query)
      void trackSearch(query)
    },
  })

  const quickScenes = useMemo(
    () =>
      [...(quickScenesConfig as QuickSceneConfig[])]
        .sort((a, b) => a.order - b.order)
        .map((scene) => ({ ...scene, label: t(scene.languageKey) })),
    [t],
  )

  const handleSearch = async (nextQuery: string) => {
    await searchFlow.search(nextQuery, t("home.searchEmptyPrompt"), t("errors.recommendationFailed"))
  }

  const toggleCompare = (tool: DisplayItem) => {
    setCompareTools((prev) => {
      const exists = prev.some((item) => item.name === tool.name)
      const next = exists ? prev.filter((item) => item.name !== tool.name) : prev.length >= MAX_COMPARE_TOOLS ? prev : [...prev, tool]
      if (!exists && next.length > prev.length) {
        void trackCompare(tool.name, { source: "home_results" })
      }
      return next
    })
  }

  const compareQuery = encodeURIComponent(compareTools.map((tool) => tool.name).join(","))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <HomeHero
        title={t("home.title")}
        subtitle={t("home.subtitle")}
        actions={<HomeQuickScenes scenes={quickScenes} query={searchFlow.query} onSelect={searchFlow.setQuery} />}
      />

      <SearchInput
        query={searchFlow.query}
        onQueryChange={searchFlow.setQuery}
        onSearch={handleSearch}
        isLoading={searchFlow.isLoading}
        placeholder={t("home.searchPlaceholder")}
        submitLabel={t("home.searchAction")}
        loadingLabel={t("common.thinking")}
        helperText={t("home.searchHelper")}
        historySuggestions={history.suggestions}
        historyTitle={t("home.history.title")}
        onSuggestionClick={(suggestion) => {
          searchFlow.setQuery(suggestion)
          void handleSearch(suggestion)
        }}
      />

      {searchFlow.error && <p className="text-sm text-destructive">{searchFlow.error}</p>}

      <HomeResults
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

      <HomeCompareEntry locale={locale} selectedCount={compareTools.length} maxCount={MAX_COMPARE_TOOLS} compareQuery={compareQuery} />
    </main>
  )
}
