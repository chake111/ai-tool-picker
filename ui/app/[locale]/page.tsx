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
    onSearchSuccess: ({ query, requestId }) => {
      history.addEntry(query)
      void trackSearch(query, { entry: "home_page", locale, request_id: requestId })
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
        trustNote={t("home.trustNote")}
        inputArea={
          <SearchInput
            query={searchFlow.query}
            onQueryChange={searchFlow.setQuery}
            onSearch={handleSearch}
            isLoading={searchFlow.isLoading}
            placeholder={t("home.searchPlaceholder")}
            submitLabel={locale === "zh" ? "开始推荐" : "Get recommendations"}
            loadingLabel={t("common.thinking")}
            helperText={t("home.searchHelper")}
            historySuggestions={history.suggestions}
            historyTitle={t("home.history.title")}
            onSuggestionClick={(suggestion) => {
              searchFlow.setQuery(suggestion)
              void handleSearch(suggestion)
            }}
            rotatingPrefix={locale === "zh" ? "例如：" : "Example: "}
            rotatingPlaceholders={[
              locale === "zh" ? "我需要做一份融资路演 PPT" : "I need a fundraising pitch deck",
              locale === "zh" ? "我要写小红书产品种草文案" : "I need social media product copy",
              locale === "zh" ? "我要快速做品牌视觉图" : "I need fast brand visuals",
            ]}
          />
        }
        scenarioTitle={t("home.quickScenesTitle")}
        stats={[
          { label: t("home.stats.countLabel"), value: t("home.stats.countValue") },
          { label: t("home.stats.timeLabel"), value: t("home.stats.timeValue") },
          { label: t("home.stats.reasonLabel"), value: t("home.stats.reasonValue") },
        ]}
        quickScenes={<HomeQuickScenes scenes={quickScenes} query={searchFlow.query} onSelect={searchFlow.setQuery} />}
      />

      {searchFlow.error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{searchFlow.error}</p>}

      <HomeResultsPreview title={t("home.resultsTitle")} subtitle={t("home.resultsPreviewSubtitle")} emptyHint={t("home.emptyHint")} />
    </main>
  )
}
