"use client"

import { useCallback, useMemo, useState } from "react"
import type { RecommendItem } from "@/lib/recommend"

export const FILTER_OPTIONS = ["all", "free", "paid", "beginner", "pro", "chinese"] as const
export type FilterOption = (typeof FILTER_OPTIONS)[number]

const RESULTS_PER_PAGE = 6

type DisplayItem = RecommendItem & {
  priceRange: string
  platform: string
  languageSupport: string
}

type UseSearchFlowOptions = {
  locale: string
  onSearchSuccess?: (query: string) => void
}

const includesAny = (item: DisplayItem, candidates: string[]) => {
  const text = `${item.priceRange} ${item.platform} ${item.languageSupport} ${(item.tags ?? []).join(" ")}`.toLowerCase()
  return candidates.some((candidate) => text.includes(candidate))
}

export function useSearchFlow({ locale, onSearchSuccess }: UseSearchFlowOptions) {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState<DisplayItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterOption>("all")

  const setFilterAndResetPage = useCallback((option: FilterOption) => {
    setFilters(option)
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
        const normalized = (data.recommendations ?? []).map((item) => ({
          ...item,
          priceRange: item.priceRange?.trim() || (locale === "zh" ? "未知" : "Unknown"),
          platform: item.platform?.trim() || (locale === "zh" ? "未知" : "Unknown"),
          languageSupport: item.languageSupport?.trim() || (locale === "zh" ? "未知" : "Unknown"),
        }))
        setResults(normalized)
        setCurrentPage(1)
        onSearchSuccess?.(trimmed)
      } catch {
        setError(recommendationFailed)
      } finally {
        setIsLoading(false)
      }
    },
    [locale, onSearchSuccess],
  )

  const filteredResults = useMemo(() => {
    if (filters === "all") return results
    return results.filter((item) => {
      if (filters === "free") return includesAny(item, ["free", "免费"])
      if (filters === "paid") return includesAny(item, ["paid", "付费", "订阅", "pro"])
      if (filters === "beginner") return includesAny(item, ["beginner", "新手", "easy", "入门"])
      if (filters === "pro") return includesAny(item, ["pro", "advanced", "专业"])
      return includesAny(item, ["chinese", "中文", "zh"])
    })
  }, [filters, results])

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / RESULTS_PER_PAGE))
  const pagedResults = useMemo(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE
    return filteredResults.slice(start, start + RESULTS_PER_PAGE)
  }, [currentPage, filteredResults])

  const previousPage = useCallback(() => setCurrentPage((prev) => Math.max(1, prev - 1)), [])
  const nextPage = useCallback(() => setCurrentPage((prev) => Math.min(totalPages, prev + 1)), [totalPages])

  return {
    query,
    setQuery,
    search,
    isLoading,
    error,
    results,
    filters,
    setFilterAndResetPage,
    pagedResults,
    filteredResults,
    currentPage,
    totalPages,
    previousPage,
    nextPage,
  }
}
