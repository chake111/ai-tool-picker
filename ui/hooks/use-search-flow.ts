"use client"

import { useCallback, useMemo, useState } from "react"
import type { RecommendItem } from "@/lib/recommend"

export const FILTER_OPTIONS = ["all", "free", "paid", "beginner", "pro", "chinese"] as const
export type FilterOption = (typeof FILTER_OPTIONS)[number]

export const SORT_OPTIONS = ["confidence", "name"] as const
export type SortOption = (typeof SORT_OPTIONS)[number]

const RESULTS_PER_PAGE = 6

type PricingType = "free" | "paid" | "unknown"
type SkillLevel = "beginner" | "pro" | "unknown"

export type DisplayItem = RecommendItem & {
  priceRange: string
  platform: string
  languageSupport: string
  pricingType: PricingType
  skillLevel: SkillLevel
  chineseSupport: boolean
  confidenceScore: number
  fitReasons: string[]
  bestFor: string[]
  limitations: string[]
}

type SearchContext = {
  query: string
  requestId: string
}

type UseSearchFlowOptions = {
  locale: string
  onSearchSuccess?: (context: SearchContext) => void
}

const inferPricingType = (item: RecommendItem): PricingType => {
  const text = `${item.priceRange ?? ""} ${(item.tags ?? []).join(" ")}`.toLowerCase()
  if (/(free|免费)/.test(text)) return "free"
  if (/(paid|付费|订阅|pro)/.test(text)) return "paid"
  return "unknown"
}

const inferSkillLevel = (item: RecommendItem): SkillLevel => {
  const text = `${(item.bestFor ?? []).join(" ")} ${(item.tags ?? []).join(" ")}`.toLowerCase()
  if (/(beginner|新手|入门|easy)/.test(text)) return "beginner"
  if (/(pro|advanced|专业|开发者|设计师)/.test(text)) return "pro"
  return "unknown"
}

const inferChineseSupport = (item: RecommendItem) => {
  const text = `${item.languageSupport ?? ""} ${(item.tags ?? []).join(" ")}`.toLowerCase()
  return /(chinese|中文|zh)/.test(text)
}

const normalizeConfidenceScore = (item: RecommendItem) => {
  if (typeof item.confidenceScore === "number" && Number.isFinite(item.confidenceScore)) {
    return Math.max(0, Math.min(1, item.confidenceScore))
  }
  return 0.72
}

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function filterItems(items: DisplayItem[], filter: FilterOption) {
  return items.filter((item) => {
    if (filter === "all") return true
    if (filter === "free") return item.pricingType === "free"
    if (filter === "paid") return item.pricingType === "paid"
    if (filter === "beginner") return item.skillLevel === "beginner"
    if (filter === "pro") return item.skillLevel === "pro"
    return item.chineseSupport
  })
}

export function useSearchFlow({ locale, onSearchSuccess }: UseSearchFlowOptions) {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState<DisplayItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterOption>("all")
  const [sortBy, setSortBy] = useState<SortOption>("confidence")
  const [requestId, setRequestId] = useState("")

  const setFilterAndResetPage = useCallback((option: FilterOption) => {
    setFilters(option)
    setCurrentPage(1)
  }, [])

  const setSortAndResetPage = useCallback((option: SortOption) => {
    setSortBy(option)
    setCurrentPage(1)
  }, [])

  const clearConditions = useCallback(() => {
    setFilters("all")
    setSortBy("confidence")
    setCurrentPage(1)
  }, [])

  const search = useCallback(
    async (nextQuery: string, emptyPrompt: string, recommendationFailed: string) => {
      const trimmed = nextQuery.trim()
      if (!trimmed) {
        setError(emptyPrompt)
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
        const normalized = (data.recommendations ?? []).map((item) => {
          const fitReasons = Array.isArray(item.fitReasons) && item.fitReasons.length ? item.fitReasons : [item.reason]
          return {
            ...item,
            priceRange: item.priceRange?.trim() || (locale === "zh" ? "未知" : "Unknown"),
            platform: item.platform?.trim() || (locale === "zh" ? "未知" : "Unknown"),
            languageSupport: item.languageSupport?.trim() || (locale === "zh" ? "未知" : "Unknown"),
            pricingType: inferPricingType(item),
            skillLevel: inferSkillLevel(item),
            chineseSupport: inferChineseSupport(item),
            confidenceScore: normalizeConfidenceScore(item),
            fitReasons,
            bestFor: Array.isArray(item.bestFor) ? item.bestFor : [],
            limitations: Array.isArray(item.limitations) ? item.limitations : [],
          }
        })
        const nextRequestId = createRequestId()
        setQuery(trimmed)
        setRequestId(nextRequestId)
        setResults(normalized)
        setCurrentPage(1)
        onSearchSuccess?.({ query: trimmed, requestId: nextRequestId })
      } catch {
        setError(recommendationFailed)
      } finally {
        setIsLoading(false)
      }
    },
    [locale, onSearchSuccess],
  )

  const filteredResults = useMemo(() => filterItems(results, filters), [filters, results])

  const sortedResults = useMemo(() => {
    const copy = [...filteredResults]
    if (sortBy === "name") {
      return copy.sort((a, b) => a.name.localeCompare(b.name))
    }
    return copy.sort((a, b) => b.confidenceScore - a.confidenceScore)
  }, [filteredResults, sortBy])

  const totalPages = Math.max(1, Math.ceil(sortedResults.length / RESULTS_PER_PAGE))
  const pagedResults = useMemo(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE
    return sortedResults.slice(start, start + RESULTS_PER_PAGE)
  }, [currentPage, sortedResults])

  const previousPage = useCallback(() => setCurrentPage((prev) => Math.max(1, prev - 1)), [])
  const nextPage = useCallback(() => setCurrentPage((prev) => Math.min(totalPages, prev + 1)), [totalPages])

  return {
    query,
    setQuery,
    search,
    isLoading,
    error,
    results,
    requestId,
    filters,
    setFilterAndResetPage,
    sortBy,
    setSortAndResetPage,
    clearConditions,
    pagedResults,
    filteredResults: sortedResults,
    currentPage,
    totalPages,
    previousPage,
    nextPage,
  }
}
