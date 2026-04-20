"use client"

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"
import { AudioWaveform, BarChart3, Code2, Heart, Image, Languages, PenTool, Presentation, RotateCcw, Scale, Search, Trash2, Video } from "lucide-react"
import { signIn, signOut, useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { SearchInput } from "@/components/search-input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ComparePanel } from "@/components/compare-panel"
import { LanguageSwitcher } from "@/components/language-switcher"
import type { RecommendItem } from "@/lib/recommend"
import { cn } from "@/lib/utils"
import { sanitizeFavoriteItem, type FavoriteItem } from "@/lib/favorites-store"
import { track } from "@/lib/track"
import quickScenesConfig from "@/data/quick-scenes.json"

type SearchHistoryItem = {
  query: string
  timestamp: number
  locale?: "zh" | "en"
}

type HomeFilters = {
  free: boolean
  paid: boolean
  beginner: boolean
  pro: boolean
  chinese: boolean
}

type UserPreferences = {
  pricing: "any" | "free" | "paid"
  chineseFirst: boolean
  platforms: {
    web: boolean
    mobile: boolean
    desktop: boolean
  }
}

type QuickSceneConfig = {
  id: string
  icon: "code" | "presentation" | "image" | "pen" | "video" | "chart" | "audio" | "languages"
  presetQuery: string
  languageKey: string
  order: number
}


type DisplayRecommendItem = RecommendItem & {
  priceRange: string
  platform: string
  languageSupport: string
}

const QUICK_SCENE_ICON_MAP: Record<QuickSceneConfig["icon"], typeof Code2> = {
  code: Code2,
  presentation: Presentation,
  image: Image,
  pen: PenTool,
  video: Video,
  chart: BarChart3,
  audio: AudioWaveform,
  languages: Languages,
}

const HISTORY_STORAGE_KEY = "ai_tool_picker_history"
const FAVORITES_STORAGE_KEY = "ai_tool_picker_favorites"
const ONBOARDING_STORAGE_KEY = "ai_tool_picker_has_seen_onboarding"
const PREFERENCES_STORAGE_KEY = "ai_tool_picker_preferences"
const HISTORY_LIMIT = 10
const HISTORY_PREVIEW_COUNT = 3
const DEFAULT_HISTORY_PAGE_SIZE = 10
const FAVORITES_LIMIT = 30
const MAX_COMPARE_TOOLS = 3
const AI_KEYWORD_REGEX = /(?:\bai\b|人工智能|大模型|生成式|llm|gpt|copilot|智能)/i
const FAVORITE_ANIMATION_DURATION_MS = 250
const MAIN_COMPARE_PADDING_CLASS = "pb-72 sm:pb-64"
const FILTER_OPTIONS: Array<keyof Pick<HomeFilters, "beginner" | "pro" | "chinese">> = ["beginner", "pro", "chinese"]
const PRICE_FILTER_OPTIONS = ["all", "free", "paid"] as const
type PriceFilterOption = (typeof PRICE_FILTER_OPTIONS)[number]
const DEFAULT_USER_PREFERENCES: UserPreferences = {
  pricing: "any",
  chineseFirst: false,
  platforms: {
    web: false,
    mobile: false,
    desktop: false,
  },
}
const buildNextHistory = (
  currentHistory: SearchHistoryItem[],
  query: string,
  locale: SearchHistoryItem["locale"],
): SearchHistoryItem[] => {
  const deduplicatedHistory = currentHistory.filter((item) => !(item.query === query && item.locale === locale))
  return [{ query, timestamp: Date.now(), locale }, ...deduplicatedHistory].slice(0, HISTORY_LIMIT)
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
  const quickScenes = useMemo(
    () =>
      [...(quickScenesConfig as QuickSceneConfig[])]
        .sort((a, b) => a.order - b.order)
        .map((scene) => ({
          ...scene,
          label: t(scene.languageKey),
        })),
    [t],
  )
  const [query, setQuery] = useState("")
  const [selectedQuickScene, setSelectedQuickScene] = useState<string | null>(null)
  const [results, setResults] = useState<RecommendItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [compareTools, setCompareTools] = useState<DisplayRecommendItem[]>([])
  const [detailTool, setDetailTool] = useState<DisplayRecommendItem | null>(null)
  const [compareLimitHint, setCompareLimitHint] = useState("")
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [favoriteSortMode, setFavoriteSortMode] = useState<"name" | "ai" | "scenario">("name")
  const [favoriteLimitHint, setFavoriteLimitHint] = useState("")
  const [favoritesHydrated, setFavoritesHydrated] = useState(false)
  const [lastSearchedQuery, setLastSearchedQuery] = useState("")
  const [historyCollapsed, setHistoryCollapsed] = useState(true)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPageSize] = useState(DEFAULT_HISTORY_PAGE_SIZE)
  const [favoritesCollapsed, setFavoritesCollapsed] = useState(true)
  const [activeFilters, setActiveFilters] = useState<HomeFilters>({
    free: false,
    paid: false,
    beginner: false,
    pro: false,
    chinese: false,
  })
  const [favoriteAnimatingTool, setFavoriteAnimatingTool] = useState("")
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingReady, setOnboardingReady] = useState(false)
  const [searchInputFocusSignal, setSearchInputFocusSignal] = useState(0)
  const [postOnboardingExample, setPostOnboardingExample] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(6)
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES)
  const [personalizedPicks, setPersonalizedPicks] = useState<RecommendItem[]>([])
  const [isLoadingPersonalized, setIsLoadingPersonalized] = useState(false)
  const currentHistoryLocale: SearchHistoryItem["locale"] = locale === "zh" ? "zh" : "en"
  const localizedHistory = useMemo(
    () => history.filter((item) => !item.locale || item.locale === currentHistoryLocale),
    [currentHistoryLocale, history],
  )
  const historyTotalPages = useMemo(
    () => Math.max(1, Math.ceil(localizedHistory.length / historyPageSize)),
    [historyPageSize, localizedHistory.length],
  )
  const paginatedHistory = useMemo(() => {
    if (historyCollapsed) {
      return localizedHistory.slice(0, HISTORY_PREVIEW_COUNT)
    }
    const start = (historyPage - 1) * historyPageSize
    return localizedHistory.slice(start, start + historyPageSize)
  }, [historyCollapsed, historyPage, historyPageSize, localizedHistory])
  const historySuggestions = useMemo(() => localizedHistory.slice(0, 5).map((item) => item.query), [localizedHistory])
  const hasAnyPreference = useMemo(() => {
    return (
      preferences.pricing !== "any" ||
      preferences.chineseFirst ||
      preferences.platforms.web ||
      preferences.platforms.mobile ||
      preferences.platforms.desktop
    )
  }, [preferences])
  const [recommendMeta, setRecommendMeta] = useState<{
    requestId: string
    ranker: "v1" | "v2"
    scenario: string
    query: string
  } | null>(null)
  const resultsTitleRef = useRef<HTMLDivElement>(null)
  const onboardingPrimaryActionRef = useRef<HTMLButtonElement>(null)
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
  const getToolDisplayInfo = (item: RecommendItem): Pick<DisplayRecommendItem, "priceRange" | "platform" | "languageSupport"> => {
    const unknownLabel = locale === "zh" ? "未知" : "Unknown"
    return {
      priceRange: item.priceRange?.trim() || unknownLabel,
      platform: item.platform?.trim() || unknownLabel,
      languageSupport: item.languageSupport?.trim() || unknownLabel,
    }
  }

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
  const displayResults = useMemo<DisplayRecommendItem[]>(
    () =>
      filteredResults.map((item) => ({
        ...item,
        ...getToolDisplayInfo(item),
      })),
    [filteredResults],
  )
  const totalPages = useMemo(() => {
    const pages = Math.ceil(displayResults.length / pageSize)
    return Math.max(1, pages)
  }, [displayResults.length, pageSize])
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return displayResults.slice(startIndex, startIndex + pageSize)
  }, [currentPage, displayResults, pageSize])
  const getMatchedQuickSceneId = (value: string) => {
    const normalizedValue = value.trim().toLowerCase()
    return (
      quickScenes.find(
        (scene) =>
          scene.label.trim().toLowerCase() === normalizedValue || scene.presetQuery.trim().toLowerCase() === normalizedValue,
      )?.id ?? null
    )
  }
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
            typeof item?.query === "string" &&
            item.query.trim().length > 0 &&
            typeof item?.timestamp === "number" &&
            (item?.locale === undefined || item?.locale === "zh" || item?.locale === "en"),
        )
        .slice(0, HISTORY_LIMIT)

      setHistory(sanitized)
    } catch {
      setHistory([])
    }
  }, [])

  useEffect(() => {
    try {
      const hasSeenOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true"
      setShowOnboarding(!hasSeenOnboarding)
    } catch {
      setShowOnboarding(true)
    } finally {
      setOnboardingReady(true)
    }
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored) as Partial<UserPreferences>
      setPreferences({
        pricing: parsed.pricing === "free" || parsed.pricing === "paid" ? parsed.pricing : "any",
        chineseFirst: parsed.chineseFirst === true,
        platforms: {
          web: parsed.platforms?.web === true,
          mobile: parsed.platforms?.mobile === true,
          desktop: parsed.platforms?.desktop === true,
        },
      })
    } catch {
      setPreferences(DEFAULT_USER_PREFERENCES)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

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
    if (historyCollapsed) {
      if (historyPage !== 1) {
        setHistoryPage(1)
      }
      return
    }
    const nextMaxPage = Math.max(1, Math.ceil(localizedHistory.length / historyPageSize))
    if (historyPage > nextMaxPage) {
      setHistoryPage(nextMaxPage)
    }
  }, [historyCollapsed, historyPage, historyPageSize, localizedHistory.length])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilters, query, results])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    const shouldShowPersonalized = hasAnyPreference || localizedHistory.length > 0
    if (!shouldShowPersonalized) {
      setPersonalizedPicks([])
      return
    }

    const controller = new AbortController()
    const run = async () => {
      setIsLoadingPersonalized(true)
      try {
        const seedQuery =
          localizedHistory[0]?.query ??
          (locale === "zh" ? "帮我推荐适合我偏好的 AI 工具" : "Recommend AI tools based on my preferences")
        const response = await fetch("/api/recommend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: seedQuery,
            locale: locale === "zh" ? "zh" : "en",
            ranker: "v2",
            localBehavior: {
              history: localizedHistory.slice(0, 10).map((item) => ({ query: item.query, timestamp: item.timestamp })),
              favorites: favorites.slice(0, 10).map((item) => ({ toolId: item.toolId, name: item.name })),
            },
            preferences,
          }),
          signal: controller.signal,
        })
        if (!response.ok) return
        const data = (await response.json()) as RecommendItem[]
        setPersonalizedPicks(data.slice(0, 3))
      } catch {
        if (!controller.signal.aborted) {
          setPersonalizedPicks([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPersonalized(false)
        }
      }
    }
    void run()
    return () => controller.abort()
  }, [favorites, hasAnyPreference, locale, localizedHistory, preferences])

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
      if (prev[0]?.query === normalizedQuery && prev[0]?.locale === currentHistoryLocale) {
        return prev
      }
      const nextHistory = buildNextHistory(prev, normalizedQuery, currentHistoryLocale)
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory))
      return nextHistory
    })
    setHistoryPage(1)
  }

  const handleSearch = async (inputQuery: string) => {
    const normalizedQuery = inputQuery.trim()
    if (!normalizedQuery) {
      setError(t("home.searchEmptyPrompt"))
      setCompareLimitHint("")
      setResults([])
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
      const localHistorySnapshot = [{ query: normalizedQuery, timestamp: Date.now(), locale: currentHistoryLocale }, ...history]
      const requestBody = {
        query: normalizedQuery,
        locale: locale === "zh" ? "zh" : "en",
        ranker: Math.random() < 0.5 ? "v1" : "v2",
        preferences,
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

  const handleQuickSceneClick = (sceneId: string) => {
    const selectedScene = quickScenes.find((scene) => scene.id === sceneId)
    if (!selectedScene) {
      return
    }
    setSelectedQuickScene(selectedScene.id)
    setQuery(selectedScene.presetQuery)
    setError("")

    void track({
      action: "click",
      toolId: `scene:${selectedScene.id}`,
      metadata: {
        source: "quick_scene",
        locale,
        languageKey: selectedScene.languageKey,
        order: selectedScene.order,
        presetQuery: selectedScene.presetQuery,
      },
    }).catch(() => {})
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (selectedQuickScene) {
      const matchedSceneId = getMatchedQuickSceneId(value)
      if (matchedSceneId !== selectedQuickScene) {
        setSelectedQuickScene(null)
      }
    }
  }

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery)
    setSelectedQuickScene(getMatchedQuickSceneId(historyQuery))
    setError("")
    void handleSearch(historyQuery)
  }

  const handleSampleQueryClick = (sampleQuery: string) => {
    setQuery(sampleQuery)
    setSelectedQuickScene(getMatchedQuickSceneId(sampleQuery))
    setError("")
    void handleSearch(sampleQuery)
  }

  const handleClearHistory = () => {
    setHistory([])
    setHistoryCollapsed(true)
    setHistoryPage(1)
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  }

  const handleDeleteHistoryItem = (target: SearchHistoryItem) => {
    setHistory((prev) => {
      const nextHistory = prev.filter(
        (item) =>
          !(item.query === target.query && item.timestamp === target.timestamp && (item.locale ?? "all") === (target.locale ?? "all")),
      )
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory))
      return nextHistory
    })
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

  const handlePreferencePricingChange = (pricing: UserPreferences["pricing"]) => {
    setPreferences((prev) => ({ ...prev, pricing }))
  }

  const handlePreferencePlatformToggle = (platform: keyof UserPreferences["platforms"]) => {
    setPreferences((prev) => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: !prev.platforms[platform],
      },
    }))
  }

  const handleResetPreferences = () => {
    setPreferences(DEFAULT_USER_PREFERENCES)
    localStorage.removeItem(PREFERENCES_STORAGE_KEY)
  }

  const handleFilterToggle = (filter: keyof typeof activeFilters) => {
    setActiveFilters((prev) => {
      if (filter === "free") {
        return { ...prev, free: true, paid: false }
      }
      if (filter === "paid") {
        return { ...prev, paid: true, free: false }
      }
      return { ...prev, [filter]: !prev[filter] }
    })
  }

  const handlePriceFilterToggle = (option: PriceFilterOption) => {
    if (option === "all") {
      setActiveFilters((prev) => ({ ...prev, free: false, paid: false }))
      return
    }
    handleFilterToggle(option)
  }

  const handlePriceFilterKeyDown = (option: PriceFilterOption, event: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return
    event.preventDefault()
    const currentIndex = PRICE_FILTER_OPTIONS.indexOf(option)
    if (currentIndex === -1) return
    const nextIndex =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (currentIndex + 1) % PRICE_FILTER_OPTIONS.length
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (currentIndex - 1 + PRICE_FILTER_OPTIONS.length) % PRICE_FILTER_OPTIONS.length
          : event.key === "Home"
            ? 0
            : PRICE_FILTER_OPTIONS.length - 1
    handlePriceFilterToggle(PRICE_FILTER_OPTIONS[nextIndex])
  }

  const selectedPriceFilter: PriceFilterOption = activeFilters.free ? "free" : activeFilters.paid ? "paid" : "all"

  const clearCompareLimitHint = () => setCompareLimitHint("")

  const isToolSelected = (toolName: string) => compareTools.some((tool) => tool.name === toolName)

  const handleCompareToggle = (item: DisplayRecommendItem) => {
    if (isToolSelected(item.name)) {
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
  const handleDetailOpen = (item: DisplayRecommendItem) => {
    setDetailTool(item)
    void track({
      action: "impression",
      toolId: item.name,
      metadata: {
        source: "detail_drawer",
        metric: "detail_view_rate",
        locale,
        query: recommendMeta?.query ?? lastSearchedQuery,
      },
    }).catch(() => {})
  }

  useEffect(() => {
    if (compareTools.length !== 2) return
    void track({
      action: "impression",
      toolId: compareTools.map((tool) => tool.name).join(" vs "),
      metadata: {
        source: "compare_panel",
        metric: "compare_start_rate",
        selectedCount: compareTools.length,
        locale,
        query: recommendMeta?.query ?? lastSearchedQuery,
      },
    }).catch(() => {})
  }, [compareTools, lastSearchedQuery, locale, recommendMeta])

  const handleRemoveCompareTool = (toolName: string) => {
    setCompareTools((prev) => prev.filter((tool) => tool.name !== toolName))
    clearCompareLimitHint()
  }

  const handleClearCompareTools = () => {
    setCompareTools([])
    clearCompareLimitHint()
  }

  const finishOnboarding = (prefillQuery: boolean) => {
    const highlightedExample = t("home.onboarding.highQualityExample")
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true")
    } catch {}
    setShowOnboarding(false)
    setPostOnboardingExample(highlightedExample)
    if (prefillQuery) {
      setQuery(highlightedExample)
      setSelectedQuickScene(getMatchedQuickSceneId(highlightedExample))
    }
    setTimeout(() => {
      setSearchInputFocusSignal((prev) => prev + 1)
    }, 50)
  }

  const handleOnboardingOpenChange = (open: boolean) => {
    if (open) return
    if (!showOnboarding) return
    finishOnboarding(false)
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

        <Dialog open={onboardingReady && showOnboarding} onOpenChange={handleOnboardingOpenChange}>
          <DialogContent
            showCloseButton={false}
            className="w-full max-w-xl rounded-2xl border border-border bg-card p-4 shadow-2xl sm:p-6"
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              onboardingPrimaryActionRef.current?.focus()
            }}
            onEscapeKeyDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              finishOnboarding(false)
            }}
            onPointerDownOutside={(event) => {
              event.preventDefault()
              finishOnboarding(false)
            }}
          >
            <div className="space-y-2">
              <DialogTitle className="text-lg text-foreground sm:text-xl">{t("home.onboarding.title")}</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">{t("home.onboarding.subtitle")}</DialogDescription>
            </div>
            <ul className="mt-4 space-y-3 rounded-xl border border-border/70 bg-muted/30 p-3 text-sm sm:text-base">
              <li className="rounded-lg bg-background px-3 py-2 text-foreground">{t("home.onboarding.inputWay")}</li>
              <li className="rounded-lg bg-background px-3 py-2 text-foreground">{t("home.onboarding.useCases")}</li>
              <li className="rounded-lg bg-background px-3 py-2 text-foreground">{t("home.onboarding.outputFormat")}</li>
            </ul>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => finishOnboarding(false)}
                className="w-full sm:w-auto"
              >
                {t("home.onboarding.skip")}
              </Button>
              <Button
                ref={onboardingPrimaryActionRef}
                type="button"
                onClick={() => finishOnboarding(true)}
                className="w-full sm:w-auto"
              >
                {t("home.onboarding.startNow")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
            {quickScenes.map((scene) => {
              const SceneIcon = QUICK_SCENE_ICON_MAP[scene.icon]
              return (
              <button
                key={scene.id}
                type="button"
                onClick={() => handleQuickSceneClick(scene.id)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  selectedQuickScene === scene.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <SceneIcon className="size-3.5" aria-hidden="true" />
                  <span>{scene.label}</span>
                </span>
              </button>
              )
            })}
          </div>

          <SearchInput
            query={query}
            onQueryChange={handleQueryChange}
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder={t("home.searchPlaceholder")}
            submitLabel={t("home.searchAction")}
            loadingLabel={t("common.thinking")}
            historySuggestions={historySuggestions}
            historyTitle={t("home.history.title")}
            onSuggestionClick={handleHistoryClick}
            helperText={t("home.searchHelper")}
            sampleTitle={t("home.sampleQueriesTitle")}
            sampleQueries={[
              t("home.sampleQueries.pitchDeck"),
              t("home.sampleQueries.chinesePolish"),
            ]}
            onSampleQueryClick={handleSampleQueryClick}
            focusSignal={searchInputFocusSignal}
          />
          {postOnboardingExample && results.length === 0 && (
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs leading-relaxed text-foreground sm:text-sm">
              {t("home.onboarding.exampleLabel", { example: postOnboardingExample })}
            </p>
          )}
          {results.length === 0 && (
            <p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {t("home.examples")}
            </p>
          )}

          <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{t("preferences.title")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("preferences.subtitle")}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleResetPreferences}>
                {t("preferences.reset")}
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["any", "free", "paid"] as const).map((pricing) => (
                <button
                  key={`pricing-${pricing}`}
                  type="button"
                  onClick={() => handlePreferencePricingChange(pricing)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    preferences.pricing === pricing
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                >
                  {t(`preferences.pricing.${pricing}`)}
                </button>
              ))}
            </div>
            <label className="mt-3 inline-flex items-center gap-2 text-xs text-foreground">
              <Checkbox
                checked={preferences.chineseFirst}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, chineseFirst: checked === true }))
                }
                aria-label={t("preferences.chineseFirst")}
              />
              {t("preferences.chineseFirst")}
            </label>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">{t("preferences.platformTitle")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["web", "mobile", "desktop"] as const).map((platform) => (
                  <button
                    key={`platform-${platform}`}
                    type="button"
                    onClick={() => handlePreferencePlatformToggle(platform)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      preferences.platforms[platform]
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    {t(`preferences.platforms.${platform}`)}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-3 rounded-md border border-dashed border-border/70 bg-background/80 px-2.5 py-2 text-xs text-muted-foreground">
              {isLoggedIn ? t("preferences.privacy.account") : t("preferences.privacy.local")}
            </p>
          </div>

          {(isLoadingPersonalized || personalizedPicks.length > 0) && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 sm:p-4">
              <p className="text-sm font-semibold text-foreground">{t("preferences.recommendationsTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("preferences.recommendationsSubtitle")}</p>
              {isLoadingPersonalized ? (
                <p className="mt-3 text-xs text-muted-foreground">{t("home.loading")}</p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {personalizedPicks.slice(0, 3).map((item) => (
                    <div key={`pref-${item.name}`} className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                    onClick={() => {
                      setHistoryCollapsed((prev) => {
                        const nextCollapsed = !prev
                        if (!nextCollapsed) {
                          setHistoryPage(1)
                        }
                        return nextCollapsed
                      })
                    }}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    aria-expanded={!historyCollapsed}
                    aria-controls="history-panel"
                  >
                    {historyCollapsed ? t("common.expand") : t("common.collapse")}
                  </button>
                </div>
              </div>
              <div id="history-panel" className="mt-2 space-y-2">
                {localizedHistory.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                    {t("home.history.empty")}
                  </p>
                ) : (
                  paginatedHistory.map((item) => (
                    <div
                      key={`${item.query}-${item.timestamp}-${item.locale ?? "all"}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-background px-2.5 py-1.5 text-xs"
                    >
                      <p className="truncate text-foreground">{item.query}</p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleHistoryClick(item.query)}
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <RotateCcw className="size-3" aria-hidden="true" />
                          {t("home.history.reuse")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHistoryItem(item)}
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                          aria-label={t("home.history.deleteOne", { query: item.query })}
                        >
                          <Trash2 className="size-3" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {!historyCollapsed && localizedHistory.length > 0 && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                      disabled={historyPage <= 1}
                      className="rounded border border-border/70 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t("home.history.pagination.prev")}
                    </button>
                    <p className="text-[11px] text-muted-foreground">
                      {t("home.history.pagination.page", { current: historyPage, total: historyTotalPages })}
                    </p>
                    <button
                      type="button"
                      onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                      disabled={historyPage >= historyTotalPages}
                      className="rounded border border-border/70 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t("home.history.pagination.next")}
                    </button>
                  </div>
                )}
              </div>
            </div>

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
               <div className="flex flex-col gap-2" role="group" aria-label={t("filters.title")}>
                 <p id="result-filters-heading" className="text-xs text-muted-foreground">{t("filters.title")}</p>
                 <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-labelledby="result-filters-heading">
                   {PRICE_FILTER_OPTIONS.map((option) => {
                     const selected = selectedPriceFilter === option
                     return (
                       <button
                         key={option}
                         type="button"
                         onClick={() => handlePriceFilterToggle(option)}
                         onKeyDown={(event) => handlePriceFilterKeyDown(option, event)}
                         className={cn(
                           "rounded-full border px-3 py-1 text-xs transition-colors",
                           selected
                             ? "border-foreground bg-foreground text-background"
                             : "border-border bg-background text-foreground hover:bg-muted",
                         )}
                         role="radio"
                         aria-checked={selected}
                         tabIndex={selected ? 0 : -1}
                       >
                         {t(`filters.options.${option}`)}
                       </button>
                     )
                   })}
                 </div>
                 <div className="flex flex-wrap items-center gap-2" aria-labelledby="result-filters-heading">
                 {FILTER_OPTIONS.map((filter) => {
                   const selected = activeFilters[filter]
                   return (
                     <button
                       key={filter}
                       type="button"
                       onClick={() => handleFilterToggle(filter)}
                       className={cn(
                         "rounded-full border px-3 py-1 text-xs transition-colors",
                         selected
                           ? "border-foreground bg-foreground text-background"
                           : "border-border bg-background text-foreground hover:bg-muted",
                       )}
                       aria-pressed={selected}
                     >
                       {t(`filters.options.${filter}`)}
                     </button>
                   )
                 })}
                 </div>
               </div>
               {compareLimitHint && (
                 <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                   {compareLimitHint}
                 </div>
              )}
              {paginatedResults.map((item) => (
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
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleFavoriteToggle(item)}
                          className={cn(
                            "text-muted-foreground transition-transform duration-150 active:scale-95",
                            isToolFavorited(item.name) ? "text-rose-500" : "hover:text-foreground",
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
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleCompareToggle(item)}
                          aria-pressed={isToolSelected(item.name)}
                          aria-label={t("compare.addOne", { name: item.name })}
                          title={isToolSelected(item.name) ? t("compare.added") : t("compare.add")}
                          className={cn(
                            "text-muted-foreground hover:text-foreground",
                            isToolSelected(item.name) ? "bg-primary/10 text-primary hover:text-primary" : "",
                          )}
                        >
                          <Scale className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-2">
                      {Array.isArray(item.tags) && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
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
                      <p className="text-sm text-muted-foreground" title={item.desc}>
                       {item.desc}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-1 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-foreground sm:grid-cols-2">
                       <p><span className="text-muted-foreground">{t("details.fields.priceRange")}：</span>{item.priceRange}</p>
                       <p><span className="text-muted-foreground">{t("details.fields.platform")}：</span>{item.platform}</p>
                       <p className="sm:col-span-2"><span className="text-muted-foreground">{t("details.fields.languageSupport")}：</span>{item.languageSupport}</p>
                    </div>
                    <p className="mt-3 text-sm text-foreground">{item.reason}</p>
                    <div className="mt-5 flex flex-col gap-2">
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
                      <Button type="button" size="sm" variant="ghost" className="w-full justify-start sm:w-auto" onClick={() => handleDetailOpen(item)}>
                        {t("details.view")}
                      </Button>
                    </div>
                </div>
              </Card>
            ))}
              {displayResults.length > 0 && (
                <Pagination aria-label={t("home.pagination.navAria")}>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        ariaLabel={t("home.pagination.previousAria")}
                        label={t("home.pagination.previous")}
                        onClick={(event) => {
                          event.preventDefault()
                          if (currentPage <= 1) return
                          setCurrentPage((prev) => prev - 1)
                        }}
                        className={cn(currentPage <= 1 ? "pointer-events-none opacity-50" : "")}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <PaginationItem key={`page-${page}`}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          aria-label={t("home.pagination.pageAria", { page })}
                          onClick={(event) => {
                            event.preventDefault()
                            setCurrentPage(page)
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        ariaLabel={t("home.pagination.nextAria")}
                        label={t("home.pagination.next")}
                        onClick={(event) => {
                          event.preventDefault()
                          if (currentPage >= totalPages) return
                          setCurrentPage((prev) => prev + 1)
                        }}
                        className={cn(currentPage >= totalPages ? "pointer-events-none opacity-50" : "")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
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
      <Drawer open={!!detailTool} onOpenChange={(open) => !open && setDetailTool(null)}>
        <DrawerContent>
          {detailTool && (
            <>
              <DrawerHeader>
                <DrawerTitle>{detailTool.name}</DrawerTitle>
                <DrawerDescription>{detailTool.desc}</DrawerDescription>
              </DrawerHeader>
              <div className="space-y-3 px-4 pb-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p><span className="text-muted-foreground">{t("details.fields.priceRange")}：</span>{detailTool.priceRange}</p>
                  <p><span className="text-muted-foreground">{t("details.fields.platform")}：</span>{detailTool.platform}</p>
                  <p><span className="text-muted-foreground">{t("details.fields.languageSupport")}：</span>{detailTool.languageSupport}</p>
                </div>
                <div className="rounded-lg border border-dashed border-border p-3">
                  <p className="font-medium">{t("details.placeholder.favoriteTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("details.placeholder.favoriteDesc")}</p>
                </div>
                <div className="rounded-lg border border-dashed border-border p-3">
                  <p className="font-medium">{t("details.placeholder.reviewTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("details.placeholder.reviewDesc")}</p>
                </div>
              </div>
              <DrawerFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void track({
                      action: "favorite",
                      toolId: detailTool.name,
                      operation: isToolFavorited(detailTool.name) ? "remove" : "add",
                      metadata: {
                        source: "detail_drawer",
                        metric: "favorite_rate",
                      },
                    }).catch(() => {})
                    handleFavoriteToggle(detailTool)
                  }}
                >
                  {isToolFavorited(detailTool.name) ? t("favorites.remove") : t("favorites.add")}
                </Button>
                <Button asChild>
                  <a href={detailTool.link} target="_blank" rel="noopener noreferrer">
                    {t("common.visitWebsite")}
                  </a>
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </main>
  )
}
