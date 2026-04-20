"use client"

import { useMemo } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { HomeHero } from "@/components/home/home-hero"
import { HomeQuickScenes } from "@/components/home/home-quick-scenes"
import { HomeResultsPreview } from "@/components/home/home-results-preview"
import { SearchInput } from "@/components/search-input"
import { useSearchFlow } from "@/hooks/use-search-flow"
import { useHistory } from "@/hooks/use-history"
import { trackSearch } from "@/lib/track"
import quickScenesConfig from "@/data/quick-scenes.json"

type QuickSceneConfig = {
  id: string
  icon?: string
  presetQuery: string
  languageKey: string
  order: number
}

export default function HomePage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()

  const history = useHistory()
  const searchFlow = useSearchFlow({
    locale,
    onSearchSuccess: (query) => {
      history.addEntry(query)
      void trackSearch(query)
      router.push(`/${locale}/results?query=${encodeURIComponent(query)}&locale=${encodeURIComponent(locale)}`)
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

  return (
    <main className="app-page-container">
      <HomeHero
        title={t("home.subtitle")}
        subtitle={t("home.heroHint")}
        inputArea={
          <SearchInput
            query={searchFlow.query}
            onQueryChange={searchFlow.setQuery}
            onSearch={handleSearch}
            isLoading={searchFlow.isLoading}
            placeholder={t("home.searchPlaceholder")}
            submitLabel={locale === "zh" ? "推荐" : "Recommend"}
            loadingLabel={t("common.thinking")}
            helperText={t("home.searchHelper")}
            historySuggestions={history.suggestions}
            historyTitle={t("home.history.title")}
            onSuggestionClick={(suggestion) => {
              searchFlow.setQuery(suggestion)
              void handleSearch(suggestion)
            }}
            rotatingPlaceholders={["做 PPT", "写文案", "画图", "写代码"]}
          />
        }
        quickScenes={<HomeQuickScenes scenes={quickScenes} query={searchFlow.query} onSelect={searchFlow.setQuery} />}
      />

      {searchFlow.error && <p className="text-sm text-destructive">{searchFlow.error}</p>}

      <HomeResultsPreview title={t("home.resultsTitle")} emptyHint={t("home.emptyHint")} />
    </main>
  )
}
