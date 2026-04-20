"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Heart, Search } from "lucide-react"
import { signIn, signOut, useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { SearchInput } from "@/components/search-input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ComparePanel } from "@/components/compare-panel"
import { LanguageSwitcher } from "@/components/language-switcher"
import type { RecommendItem } from "@/lib/recommend"
import { cn } from "@/lib/utils"
import { sanitizeFavoriteItem, type FavoriteItem } from "@/lib/favorites-store"
import { track } from "@/lib/track"

type SearchHistoryItem = {
  query: string
  timestamp: number
}

type HomeFilters = {
  free: boolean
  paid: boolean
  beginner: boolean
  pro: boolean
  chinese: boolean
}

const HISTORY_STORAGE_KEY = "ai_tool_picker_history"
const FAVORITES_STORAGE_KEY = "ai_tool_picker_favorites"
const HISTORY_LIMIT = 10
const FAVORITES_LIMIT = 30
const MAX_COMPARE_TOOLS = 3
const AI_KEYWORD_REGEX = /(?:\bai\b|人工智能|大模型|生成式|llm|gpt|copilot|智能)/i
const LOADING_SIMULATION_DELAY_MS = 350
const FAVORITE_ANIMATION_DURATION_MS = 250
const MAIN_COMPARE_PADDING_CLASS = "pb-72 sm:pb-64"
const FILTER_OPTIONS: Array<{ key: keyof HomeFilters; group: "price" | "multi" }> = [
  { key: "free", group: "price" },
  { key: "paid", group: "price" },
  { key: "beginner", group: "multi" },
  { key: "pro", group: "multi" },
  { key: "chinese", group: "multi" },
]
const POPULAR_TOOLS_BY_LOCALE: Record<"zh" | "en", RecommendItem[]> = {
  zh: [
    {
      name: "ChatGPT",
      desc: "多场景通用 AI 助手，适合写作、编程、总结和创意生成",
      reason: "上手简单，适合新手和专业用户，支持中文对话",
      link: "https://chat.openai.com",
      tags: ["写作", "编程", "中文支持", "Beginner"],
    },
    {
      name: "Claude",
      desc: "擅长长文本理解与结构化输出的 AI 助手",
      reason: "适合深度分析和长内容创作，专业用户体验友好",
      link: "https://claude.ai",
      tags: ["写作", "分析", "Pro"],
    },
    {
      name: "Notion AI",
      desc: "面向文档与团队协作的一体化 AI 功能",
      reason: "和知识库结合紧密，适合办公与项目管理",
      link: "https://www.notion.so/product/ai",
      tags: ["办公", "团队", "Paid"],
    },
    {
      name: "Gamma",
      desc: "快速生成演示文稿与文档页面，适合做 PPT",
      reason: "模板丰富、产出快，演示类需求效率高",
      link: "https://gamma.app",
      tags: ["PPT", "Beginner", "Free"],
    },
    {
      name: "Midjourney",
      desc: "高质量 AI 绘图工具，适合创意和视觉设计",
      reason: "图片表现力强，适合对画面质量要求较高的场景",
      link: "https://www.midjourney.com",
      tags: ["绘图", "设计", "Pro", "Paid"],
    },
    {
      name: "GitHub Copilot",
      desc: "代码补全与编程建议工具，提升开发效率",
      reason: "开发者常用，支持多语言编程场景",
      link: "https://github.com/features/copilot",
      tags: ["编程", "Pro", "Paid"],
    },
  ],
  en: [
    {
      name: "ChatGPT",
      desc: "A general AI assistant for writing, coding, summaries and creative work.",
      reason: "Easy to start with and suitable for both beginners and pros.",
      link: "https://chat.openai.com",
      tags: ["Writing", "Coding", "Chinese support", "Beginner"],
    },
    {
      name: "Claude",
      desc: "An AI assistant that excels at long-context understanding and structured output.",
      reason: "Great for deep analysis and long-form content creation.",
      link: "https://claude.ai",
      tags: ["Writing", "Analysis", "Pro"],
    },
    {
      name: "Notion AI",
      desc: "Integrated AI features for docs and team collaboration.",
      reason: "Works tightly with your knowledge base and team workflows.",
      link: "https://www.notion.so/product/ai",
      tags: ["Office", "Team", "Paid"],
    },
    {
      name: "Gamma",
      desc: "Create presentations and pages quickly, ideal for slide decks.",
      reason: "Fast output with rich templates for presentation-heavy tasks.",
      link: "https://gamma.app",
      tags: ["PPT", "Beginner", "Free"],
    },
    {
      name: "Midjourney",
      desc: "High-quality image generation for creative and visual design tasks.",
      reason: "Strong image quality for scenarios requiring visual impact.",
      link: "https://www.midjourney.com",
      tags: ["Image", "Design", "Pro", "Paid"],
    },
    {
      name: "GitHub Copilot",
      desc: "Code completion and programming suggestions to boost dev productivity.",
      reason: "Popular among developers and supports many coding languages.",
      link: "https://github.com/features/copilot",
      tags: ["Coding", "Pro", "Paid"],
    },
  ],
}

const pickRandomTools = (tools: RecommendItem[], count: number): RecommendItem[] => {
  const shuffled = [...tools]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

const buildNextHistory = (currentHistory: SearchHistoryItem[], query: string): SearchHistoryItem[] => {
  const deduplicatedHistory = currentHistory.filter((item) => item.query !== query)
  return [{ query, timestamp: Date.now() }, ...deduplicatedHistory].slice(0, HISTORY_LIMIT)
}

const getFavoriteAiScore = (tool: FavoriteItem) => {
  const source = `${tool.desc} ${tool.reason} ${(tool.tags ?? []).join(" ")}`
  const matches = source.match(AI_KEYWORD_REGEX)
  return matches?.length ?? 0
}

export default function Home() {
  const t = useTranslations()
  const locale = useLocale()
  const { data: session, status: sessionStatus } = useSession()
  const isLoggedIn = sessionStatus === "authenticated"
  const categories = [
    t("home.categories.code"),
    t("home.categories.ppt"),
    t("home.categories.draw"),
    t("home.categories.write"),
  ] as const
  const popularTools = POPULAR_TOOLS_BY_LOCALE[locale === "zh" ? "zh" : "en"]
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number] | null>(null)
  const [results, setResults] = useState<RecommendItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [compareTools, setCompareTools] = useState<RecommendItem[]>([])
  const [compareLimitHint, setCompareLimitHint] = useState("")
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [favoriteSortMode, setFavoriteSortMode] = useState<"name" | "ai" | "scenario">("name")
  const [favoriteLimitHint, setFavoriteLimitHint] = useState("")
  const [favoritesHydrated, setFavoritesHydrated] = useState(false)
  const [lastSearchedQuery, setLastSearchedQuery] = useState("")
  const [historyCollapsed, setHistoryCollapsed] = useState(true)
  const [favoritesCollapsed, setFavoritesCollapsed] = useState(true)
  const [activeFilters, setActiveFilters] = useState<HomeFilters>({
    free: false,
    paid: false,
    beginner: false,
    pro: false,
    chinese: false,
  })
  const [favoriteAnimatingTool, setFavoriteAnimatingTool] = useState("")
  const [recommendMeta, setRecommendMeta] = useState<{
    requestId: string
    ranker: "v1" | "v2"
    scenario: string
    query: string
  } | null>(null)
  const resultsTitleRef = useRef<HTMLDivElement>(null)
  const lastExposureSignatureRef = useRef("")
  const resultRankMap = useMemo(() => {
    return new Map(results.map((item, index) => [item.name, index]))
  }, [results])
  const comparePanelTools = useMemo(
    () =>
      compareTools.map((tool, index) => ({
        ...tool,
        recommendationRank: resultRankMap.get(tool.name) ?? index,
      })),
    [compareTools, resultRankMap],
  )
  const sortedFavorites = useMemo(() => {
    const next = [...favorites]
    next.sort((a, b) => {
      if (favoriteSortMode === "ai") {
        return getFavoriteAiScore(b) - getFavoriteAiScore(a)
      }
      if (favoriteSortMode === "scenario") {
        return (b.tags?.length ?? 0) - (a.tags?.length ?? 0)
      }
      return a.name.localeCompare(b.name, locale === "zh" ? "zh-Hans-CN" : "en", { numeric: true, sensitivity: "base" })
    })
    return next
  }, [favoriteSortMode, favorites, locale])
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      const text = `${item.name} ${item.desc} ${item.reason} ${(item.tags ?? []).join(" ")}`.toLowerCase()
      if (activeFilters.free && !text.includes("free") && !text.includes("免费")) return false
      if (activeFilters.paid && !text.includes("paid") && !text.includes("付费")) return false
      if (activeFilters.beginner && !text.includes("beginner") && !text.includes("新手")) return false
      if (activeFilters.pro && !text.includes("pro") && !text.includes("专业")) return false
      if (activeFilters.chinese && !text.includes("中文") && !text.includes("chinese")) return false
      return true
    })
  }, [activeFilters, results])
  const getMatchedCategory = (value: string) => categories.find((category) => category === value) ?? null
  const userNameInitial = (session?.user?.name ?? session?.user?.email ?? "U").charAt(0).toUpperCase()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (!stored) return

      const parsed = JSON.parse(stored) as SearchHistoryItem[]
      if (!Array.isArray(parsed)) return

      const sanitized = parsed
        .filter(
          (item): item is SearchHistoryItem =>
            typeof item?.query === "string" && item.query.trim().length > 0 && typeof item?.timestamp === "number",
        )
        .slice(0, HISTORY_LIMIT)

      setHistory(sanitized)
    } catch {
      setHistory([])
    }
  }, [])

  useEffect(() => {
    if (sessionStatus === "loading") return
    setFavoritesHydrated(false)

    if (isLoggedIn) {
      const loadAccountFavorites = async () => {
        try {
          const response = await fetch("/api/favorites")
          if (!response.ok) throw new Error("favorites fetch failed")
          const data = (await response.json()) as { favorites?: unknown[] }
          const rawFavorites = Array.isArray(data.favorites) ? data.favorites : []
          const sanitized = rawFavorites
            .map((item) => sanitizeFavoriteItem(item))
            .filter((item): item is FavoriteItem => !!item)
            .slice(0, FAVORITES_LIMIT)
          setFavorites(sanitized)
        } catch {
          setFavorites([])
        } finally {
          setFavoritesHydrated(true)
        }
      }
      void loadAccountFavorites()
      return
    }

    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (!stored) {
        setFavorites([])
      } else {
        const parsed = JSON.parse(stored) as unknown[]
        if (!Array.isArray(parsed)) {
          setFavorites([])
        } else {
          const sanitized = parsed
            .map((item) => sanitizeFavoriteItem(item))
            .filter((item): item is FavoriteItem => !!item)
          setFavorites(sanitized.slice(0, FAVORITES_LIMIT))
        }
      }
    } catch {
      setFavorites([])
    } finally {
      setFavoritesHydrated(true)
    }
  }, [isLoggedIn, sessionStatus])

  useEffect(() => {
    if (!favoritesHydrated || sessionStatus === "loading") return

    if (isLoggedIn) {
      const saveAccountFavorites = async () => {
        await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ favorites }),
        })
      }
      void saveAccountFavorites()
      return
    }

    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites, favoritesHydrated, isLoggedIn, sessionStatus])

  useEffect(() => {
    if (!isLoading && results.length > 0) {
      resultsTitleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [isLoading, results.length])

  useEffect(() => {
    if (isLoading || results.length === 0) return
    const signature = results.map((item, index) => `${index + 1}:${item.name}`).join("|")
    if (lastExposureSignatureRef.current === signature) return
    lastExposureSignatureRef.current = signature

    results.forEach((item, index) => {
      void track({
        action: "impression",
        toolId: item.name,
        metadata: {
          rank: index + 1,
          source: "recommendation_list",
          locale,
          query: recommendMeta?.query ?? lastSearchedQuery,
          scenario: recommendMeta?.scenario ?? "general",
          ranker: recommendMeta?.ranker ?? "v1",
          requestId: recommendMeta?.requestId ?? "unknown",
        },
      }).catch(() => {})
    })
  }, [isLoading, lastSearchedQuery, locale, recommendMeta, results])

  const saveHistory = (inputQuery: string) => {
    const normalizedQuery = inputQuery.trim()
    if (!normalizedQuery) return

    setHistory((prev) => {
      if (prev[0]?.query === normalizedQuery) {
        return prev
      }
      const nextHistory = buildNextHistory(prev, normalizedQuery)
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory))
      return nextHistory
    })
  }

  const handleSearch = async (inputQuery: string) => {
    const normalizedQuery = inputQuery.trim()
    if (!normalizedQuery) {
      setIsLoading(true)
      setError("")
      setCompareLimitHint("")
      setLastSearchedQuery(t("home.popularTools"))
      setResults([])
      await new Promise((resolve) => setTimeout(resolve, LOADING_SIMULATION_DELAY_MS))
      setResults(pickRandomTools(popularTools, 3))
      setIsLoading(false)
      return
    }

    saveHistory(normalizedQuery)
    void track({
      action: "search",
      keyword: normalizedQuery,
    }).catch(() => {})
    setIsLoading(true)
    setError("")
    setResults([])
    setCompareLimitHint("")
    setLastSearchedQuery(normalizedQuery)

    try {
      const localHistorySnapshot = [{ query: normalizedQuery, timestamp: Date.now() }, ...history]
      const requestBody = {
        query: normalizedQuery,
        locale: locale === "zh" ? "zh" : "en",
        ranker: Math.random() < 0.5 ? "v1" : "v2",
        ...(!isLoggedIn
          ? {
              localBehavior: {
                history: localHistorySnapshot.slice(0, 10).map((item) => ({ query: item.query, timestamp: item.timestamp })),
                favorites: favorites.slice(0, 10).map((item) => ({ toolId: item.toolId, name: item.name })),
              },
            }
          : {}),
      }
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error("request_failed")
      }

      const data = (await response.json()) as RecommendItem[]
      setRecommendMeta({
        query: normalizedQuery,
        ranker: (response.headers.get("x-recommend-ranker") as "v1" | "v2") ?? "v1",
        scenario: response.headers.get("x-recommend-scenario") ?? "general",
        requestId: response.headers.get("x-recommend-request-id") ?? `rec_client_${Date.now()}`,
      })
      setResults(data)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : ""
      const errorKeyMap: Record<string, string> = {
        request_failed: "errors.requestFailed",
        recommendation_failed: "errors.recommendationFailed",
      }
      const mapped = errorKeyMap[message] ?? "errors.recommendationFailed"
      try {
        setError(t(mapped))
      } catch {
        setError(message || t("errors.fallback"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryClick = (category: (typeof categories)[number]) => {
    setSelectedCategory(category)
    setQuery(category)
    void handleSearch(category)
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (selectedCategory && value !== selectedCategory) {
      setSelectedCategory(null)
    }
  }

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery)
    setSelectedCategory(getMatchedCategory(historyQuery))
    void handleSearch(historyQuery)
  }

  const handleClearHistory = () => {
    setHistory([])
    setHistoryCollapsed(true)
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  }

  const isToolFavorited = (toolName: string) => favorites.some((tool) => tool.name === toolName)

  const handleFavoriteToggle = (item: RecommendItem) => {
    const exists = favorites.some((tool) => tool.name === item.name)
    const action = exists ? "remove" : "add"
    void track({
      action: "favorite",
      toolId: item.name,
      operation: action,
      metadata: {
        source: "recommendation_list",
        locale,
        query: recommendMeta?.query ?? lastSearchedQuery,
        scenario: recommendMeta?.scenario ?? "general",
        ranker: recommendMeta?.ranker ?? "v1",
        requestId: recommendMeta?.requestId ?? "unknown",
      },
    }).catch(() => {})

    setFavorites((prev) => {
      if (exists) {
        setFavoriteLimitHint("")
        setFavoriteAnimatingTool(item.name)
        setTimeout(() => setFavoriteAnimatingTool(""), FAVORITE_ANIMATION_DURATION_MS)
        return prev.filter((tool) => tool.name !== item.name)
      }
      if (prev.length >= FAVORITES_LIMIT) {
        setFavoriteLimitHint(t("favorites.limit", { limit: FAVORITES_LIMIT }))
        return prev
      }
      setFavoriteLimitHint("")
      setFavoriteAnimatingTool(item.name)
      setTimeout(() => setFavoriteAnimatingTool(""), FAVORITE_ANIMATION_DURATION_MS)
      return [
        {
          name: item.name,
          desc: item.desc,
          reason: item.reason,
          link: item.link,
          tags: item.tags,
        },
        ...prev,
      ]
    })
  }

  const handleRemoveFavorite = (toolName: string) => {
    setFavorites((prev) => prev.filter((tool) => tool.name !== toolName))
    setFavoriteLimitHint("")
  }

  const handleFilterToggle = (filter: keyof typeof activeFilters) => {
    setActiveFilters((prev) => {
      if (filter === "free") {
        const nextFree = !prev.free
        return { ...prev, free: nextFree, paid: nextFree ? false : prev.paid }
      }
      if (filter === "paid") {
        const nextPaid = !prev.paid
        return { ...prev, paid: nextPaid, free: nextPaid ? false : prev.free }
      }
      return { ...prev, [filter]: !prev[filter] }
    })
  }

  const clearCompareLimitHint = () => setCompareLimitHint("")

  const isToolSelected = (toolName: string) => compareTools.some((tool) => tool.name === toolName)

  const handleCompareToggle = (item: RecommendItem, checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") {
      return
    }
    if (!checked) {
      setCompareTools((prev) => prev.filter((tool) => tool.name !== item.name))
      clearCompareLimitHint()
      return
    }

    setCompareTools((prev) => {
      if (prev.some((tool) => tool.name === item.name)) {
        return prev
      }
      if (prev.length >= MAX_COMPARE_TOOLS) {
        setCompareLimitHint(t("compare.limit", { limit: MAX_COMPARE_TOOLS }))
        return prev
      }
      clearCompareLimitHint()
      return [...prev, item]
    })
  }

  const handleRemoveCompareTool = (toolName: string) => {
    setCompareTools((prev) => prev.filter((tool) => tool.name !== toolName))
    clearCompareLimitHint()
  }

  const handleClearCompareTools = () => {
    setCompareTools([])
    clearCompareLimitHint()
  }

  return (
    <main
      className={cn("min-h-screen flex flex-col items-center justify-center px-4 py-16", MAIN_COMPARE_PADDING_CLASS)}
    >
      <div className="w-full max-w-3xl flex flex-col items-center gap-12">
        <div className="w-full flex justify-end gap-2">
          <LanguageSwitcher />
          {isLoggedIn ? (
            <div className="flex items-center gap-3 rounded-full border border-border/70 bg-muted/20 px-3 py-1.5">
              <Avatar className="size-7">
                <AvatarImage src={session?.user?.image ?? ""} alt={t("auth.userAvatarAlt")} />
                <AvatarFallback>{userNameInitial}</AvatarFallback>
              </Avatar>
              <span className="max-w-40 truncate text-sm text-foreground">
                {session?.user?.name ?? t("auth.userFallback")}
              </span>
              <Button type="button" size="sm" variant="outline" onClick={() => void signOut()}>
                {t("auth.logout")}
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => void signIn("google")} disabled={sessionStatus === "loading"}>
              {t("auth.loginWithGoogle")}
            </Button>
          )}
        </div>

        {/* 标题区域 */}
        {results.length === 0 && (
          <div className="w-full max-w-2xl text-center">
            <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              AI Tool Picker
            </div>
            <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-foreground tracking-tight text-balance sm:text-4xl md:text-5xl md:leading-[1.1]">
              {t("home.title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
              {t("home.subtitle")}
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground/85 sm:text-[0.95rem]">
              {t("home.heroHint")}
            </p>
          </div>
        )}

        {/* 分类快捷入口 + 搜索输入 */}
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryClick(category)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  selectedCategory === category
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <SearchInput
            query={query}
            onQueryChange={handleQueryChange}
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder={t("home.searchPlaceholder")}
            submitLabel={t("home.searchAction")}
            loadingLabel={t("common.thinking")}
          />
          {results.length === 0 && (
            <p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {t("home.examples")}
            </p>
          )}

          {history.length > 0 && (
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{t("home.history.title")}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("home.history.clear")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryCollapsed((prev) => !prev)}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    aria-expanded={!historyCollapsed}
                    aria-controls="history-panel"
                  >
                    {historyCollapsed ? t("common.expand") : t("common.collapse")}
                  </button>
                </div>
              </div>
              <div id="history-panel" className={cn("mt-2 flex flex-wrap gap-2", historyCollapsed && "hidden")}>
                {history.map((item) => (
                  <button
                    key={`${item.query}-${item.timestamp}`}
                    type="button"
                    onClick={() => handleHistoryClick(item.query)}
                    className="rounded-md border border-border/70 bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted"
                  >
                    {item.query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {favoriteLimitHint && (
            <div
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700"
              role="status"
              aria-live="polite"
            >
              {favoriteLimitHint}
            </div>
          )}

          {favorites.length > 0 && (
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Heart className="size-4 text-rose-500" aria-hidden="true" />
                    <span>{t("favorites.title")}</span>
                    <Badge
                      variant="secondary"
                      aria-label={t("favorites.countAria", { count: favorites.length })}
                      className="font-semibold"
                    >
                      {t("favorites.countDisplay", { count: favorites.length })}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">{t("favorites.subtitle")}</p>
                  <p
                    className="text-xs text-muted-foreground"
                    aria-label={t("favorites.storageAria", {
                      where: isLoggedIn ? t("favorites.storage.account") : t("favorites.storage.local"),
                    })}
                  >
                    {isLoggedIn ? t("favorites.storage.account") : t("favorites.storage.local")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={favoriteSortMode}
                    onChange={(event) => setFavoriteSortMode(event.target.value as "name" | "ai" | "scenario")}
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                    aria-label={t("favorites.sortAria")}
                  >
                    <option value="name">{t("favorites.sort.name")}</option>
                    <option value="ai">{t("favorites.sort.ai")}</option>
                    <option value="scenario">{t("favorites.sort.scenario")}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setFavoritesCollapsed((prev) => !prev)}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    aria-expanded={!favoritesCollapsed}
                    aria-controls="favorites-panel"
                  >
                    {favoritesCollapsed ? t("common.expand") : t("common.collapse")}
                  </button>
                </div>
              </div>

              <div id="favorites-panel" className={cn("mt-3 grid gap-3 sm:grid-cols-2", favoritesCollapsed && "hidden")}>
                {sortedFavorites.map((favorite) => (
                  <Card key={`favorite-${favorite.name}`} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{favorite.name}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(favorite.name)}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        title={t("favorites.remove")}
                        aria-label={t("favorites.removeOne", { name: favorite.name })}
                      >
                        {t("favorites.remove")}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground" title={favorite.desc}>
                      {favorite.desc}
                    </p>
                    <p className="mt-2 text-xs text-foreground">{favorite.reason}</p>
                    {Array.isArray(favorite.tags) && favorite.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {favorite.tags.map((tag) => (
                          <span
                            key={`${favorite.name}-favorite-${tag}`}
                            className="rounded-full border border-border/70 bg-muted px-2 py-0.5 text-[11px] text-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3">
                      {favorite.link ? (
                        <Button asChild size="sm" className="w-full sm:w-auto">
                          <a
                            href={favorite.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              void track({
                                action: "click",
                                toolId: favorite.name,
                                metadata: {
                                  source: "favorites_panel",
                                  rank: (resultRankMap.get(favorite.name) ?? -1) + 1,
                                  locale,
                                  query: recommendMeta?.query ?? lastSearchedQuery,
                                  scenario: recommendMeta?.scenario ?? "general",
                                  ranker: recommendMeta?.ranker ?? "v1",
                                  requestId: recommendMeta?.requestId ?? "unknown",
                                },
                              }).catch(() => {})
                            }}
                          >
                            {t("common.visitWebsite")}
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("common.noWebsite")}</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
            <span>{t("home.loading")}</span>
          </div>
        )}

        {/* 错误提示 */}
        {error && !isLoading && (
          <div className="w-full max-w-2xl rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 结果列表 */}
          {results.length > 0 && !isLoading && (
             <div className="mt-6 w-full max-w-2xl border-t border-border/70 pt-6 flex flex-col gap-3">
              <div ref={resultsTitleRef} className="flex flex-col gap-1">
                 <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                   <Search className="size-4 text-primary" aria-hidden="true" />
                   <span>{t("home.resultsTitle")}</span>
                   <Badge className="font-semibold">{t("home.resultsCount", { count: filteredResults.length })}</Badge>
                 </p>
                 <p className="text-xs text-muted-foreground">{t("home.resultsSubtitle")}</p>
               </div>
               <div className="flex flex-wrap items-center gap-2">
                 <p className="text-xs text-muted-foreground">{t("filters.title")}</p>
                 {FILTER_OPTIONS.map((filter) => {
                   const selected = activeFilters[filter.key as keyof typeof activeFilters]
                   const isPriceFilter = filter.group === "price"
                   return (
                     <button
                       key={filter.key}
                       type="button"
                       onClick={() => handleFilterToggle(filter.key as keyof typeof activeFilters)}
                       className={cn(
                         "rounded-full border px-3 py-1 text-xs transition-colors",
                         selected
                           ? "border-foreground bg-foreground text-background"
                           : "border-border bg-background text-foreground hover:bg-muted",
                       )}
                       aria-pressed={selected}
                       role={isPriceFilter ? "radio" : undefined}
                       aria-checked={isPriceFilter ? selected : undefined}
                     >
                       {t(`filters.options.${filter.key}`)}
                     </button>
                   )
                 })}
               </div>
               {compareLimitHint && (
                 <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                   {compareLimitHint}
                 </div>
              )}
              {filteredResults.map((item) => (
                 <Card
                    key={item.name}
                    className={cn(
                      "p-5 rounded-xl border transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                      isToolSelected(item.name) ? "border-primary ring-1 ring-primary/30" : "border-border",
                    )}
                  >
                  <div className="flex h-full flex-col">
                   <div className="flex items-start justify-between gap-3">
                       <h2 className="text-lg font-semibold text-foreground">{item.name}</h2>
                       <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleFavoriteToggle(item)}
                            className={cn(
                              "inline-flex items-center gap-1 text-xs transition-transform duration-150 active:scale-95",
                              isToolFavorited(item.name)
                                ? "text-rose-500"
                                : "text-muted-foreground hover:text-foreground",
                              favoriteAnimatingTool === item.name ? "scale-95" : "scale-100",
                            )}
                            title={isToolFavorited(item.name) ? t("favorites.remove") : t("favorites.add")}
                            aria-label={
                              isToolFavorited(item.name)
                                ? t("favorites.removeOne", { name: item.name })
                                : t("favorites.addOne", { name: item.name })
                            }
                         >
                            <Heart className={cn("size-4", isToolFavorited(item.name) ? "fill-current" : "")} />
                            <span>{isToolFavorited(item.name) ? t("favorites.added") : t("favorites.add")}</span>
                          </button>
                           <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                             <Checkbox
                               checked={isToolSelected(item.name)}
                               onCheckedChange={(checked) => handleCompareToggle(item, checked)}
                               aria-label={t("compare.addOne", { name: item.name })}
                             />
                             {t("compare.label")}
                           </label>
                           <Button
                             type="button"
                             size="sm"
                             variant={isToolSelected(item.name) ? "secondary" : "outline"}
                             onClick={() => handleCompareToggle(item, !isToolSelected(item.name))}
                             className={cn(
                               "min-w-20",
                               isToolSelected(item.name) ? "border-primary bg-primary/10 text-primary" : "",
                             )}
                            >
                              {isToolSelected(item.name) ? t("compare.added") : t("compare.add")}
                            </Button>
                        </div>
                      </div>
                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={`${item.name}-${tag}`}
                            className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                     <p className="mt-2 text-sm text-muted-foreground" title={item.desc}>
                       {item.desc}
                     </p>
                     <p className="mt-3 text-sm text-foreground">{item.reason}</p>
                  <div className="mt-5">
                    <Button asChild className="w-full sm:w-auto">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          void track({
                            action: "click",
                            toolId: item.name,
                            metadata: {
                              source: "recommendation_list",
                              rank: (resultRankMap.get(item.name) ?? 0) + 1,
                              locale,
                              query: recommendMeta?.query ?? lastSearchedQuery,
                              scenario: recommendMeta?.scenario ?? "general",
                              ranker: recommendMeta?.ranker ?? "v1",
                              requestId: recommendMeta?.requestId ?? "unknown",
                            },
                          }).catch(() => {})
                        }}
                      >
                        {t("common.visitWebsite")}
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 底部提示 */}
        {!error && results.length === 0 && !isLoading && (
          <div className="text-center text-sm text-muted-foreground">
            <p>{lastSearchedQuery ? t("home.noResults") : t("home.emptyHint")}</p>
          </div>
        )}
      </div>
      <ComparePanel
        tools={comparePanelTools}
        onRemove={handleRemoveCompareTool}
        onClear={handleClearCompareTools}
      />
    </main>
  )
}
