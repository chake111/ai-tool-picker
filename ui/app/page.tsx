"use client"

import { useEffect, useMemo, useState } from "react"
import { Heart } from "lucide-react"
import { SearchInput } from "@/components/search-input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ComparePanel } from "@/components/compare-panel"
import type { RecommendItem } from "@/lib/recommend"
import { cn } from "@/lib/utils"

type SearchHistoryItem = {
  query: string
  timestamp: number
}

type FavoriteItem = {
  name: string
  desc: string
  reason: string
  link?: string
  tags?: string[]
}

const HISTORY_STORAGE_KEY = "ai_tool_picker_history"
const FAVORITES_STORAGE_KEY = "ai_tool_picker_favorites"
const HISTORY_LIMIT = 10
const FAVORITES_LIMIT = 30
const MAX_COMPARE_TOOLS = 3
const AI_KEYWORD_REGEX = /(?:\bai\b|人工智能|大模型|生成式|llm|gpt|copilot|智能)/i

const buildNextHistory = (currentHistory: SearchHistoryItem[], query: string): SearchHistoryItem[] => {
  const deduplicatedHistory = currentHistory.filter((item) => item.query !== query)
  return [{ query, timestamp: Date.now() }, ...deduplicatedHistory].slice(0, HISTORY_LIMIT)
}

const sanitizeFavoriteItem = (input: unknown): FavoriteItem | null => {
  if (!input || typeof input !== "object") return null
  const candidate = input as Partial<FavoriteItem>
  if (typeof candidate.name !== "string" || !candidate.name.trim()) return null
  if (typeof candidate.desc !== "string" || !candidate.desc.trim()) return null
  if (typeof candidate.reason !== "string" || !candidate.reason.trim()) return null

  const sanitizedTags = Array.isArray(candidate.tags)
    ? candidate.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    : undefined

  return {
    name: candidate.name,
    desc: candidate.desc,
    reason: candidate.reason,
    link: typeof candidate.link === "string" && candidate.link.trim().length > 0 ? candidate.link : undefined,
    tags: sanitizedTags && sanitizedTags.length > 0 ? sanitizedTags : undefined,
  }
}

const getFavoriteAiScore = (tool: FavoriteItem) => {
  const source = `${tool.desc} ${tool.reason} ${(tool.tags ?? []).join(" ")}`
  const matches = source.match(AI_KEYWORD_REGEX)
  return matches?.length ?? 0
}

export default function Home() {
  const categories = ["写代码", "做PPT", "画图", "写作"] as const
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
      return a.name.localeCompare(b.name, "zh-Hans-CN", { numeric: true, sensitivity: "base" })
    })
    return next
  }, [favoriteSortMode, favorites])
  const getMatchedCategory = (value: string) => categories.find((category) => category === value) ?? null

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
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (!stored) return

      const parsed = JSON.parse(stored) as unknown[]
      if (!Array.isArray(parsed)) return

      const sanitized = parsed.map((item) => sanitizeFavoriteItem(item)).filter((item): item is FavoriteItem => !!item)
      setFavorites(sanitized.slice(0, FAVORITES_LIMIT))
    } catch {
      setFavorites([])
    } finally {
      setFavoritesHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!favoritesHydrated) return
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites, favoritesHydrated])

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
    if (!normalizedQuery) return

    saveHistory(normalizedQuery)
    setIsLoading(true)
    setError("")
    setResults([])
    setCompareLimitHint("")

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: normalizedQuery }),
      })

      if (!response.ok) {
        throw new Error("请求失败，请稍后再试")
      }

      const data = (await response.json()) as RecommendItem[]
      setResults(data)
    } catch {
      setError("推荐生成失败，请稍后重试。")
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
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  }

  const isToolFavorited = (toolName: string) => favorites.some((tool) => tool.name === toolName)

  const handleFavoriteToggle = (item: RecommendItem) => {
    setFavorites((prev) => {
      const exists = prev.some((tool) => tool.name === item.name)
      if (exists) {
        setFavoriteLimitHint("")
        return prev.filter((tool) => tool.name !== item.name)
      }
      if (prev.length >= FAVORITES_LIMIT) {
        setFavoriteLimitHint(`收藏上限为 ${FAVORITES_LIMIT} 个工具`)
        return prev
      }
      setFavoriteLimitHint("")
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
        setCompareLimitHint(`最多只能对比 ${MAX_COMPARE_TOOLS} 个工具`)
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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 pb-64">
      <div className="w-full max-w-3xl flex flex-col items-center gap-12">
        {/* 标题区域 */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight text-balance">
            帮你选 AI
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            告诉我你想做什么，我来推荐最合适的 AI 工具
          </p>
        </div>

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
          />

          {history.length > 0 && (
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">历史搜索</p>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  清空历史
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
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

          <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    我的工具库（<span aria-label={`${favorites.length} 个工具`}>{favorites.length}</span>）
                  </p>
                  <p className="text-xs text-muted-foreground">收藏列表与搜索和对比功能独立，可随时取消收藏</p>
                </div>
                <select
                  value={favoriteSortMode}
                  onChange={(event) => setFavoriteSortMode(event.target.value as "name" | "ai" | "scenario")}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                  aria-label="收藏排序"
                >
                  <option value="name">按名称</option>
                  <option value="ai">按 AI 类型</option>
                  <option value="scenario">按使用场景</option>
                </select>
              </div>

              {favorites.length === 0 ? (
                <p className="text-xs text-muted-foreground">你还没有收藏工具，点击推荐卡片上的心形“收藏”按钮即可加入这里。</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {sortedFavorites.map((favorite) => (
                    <Card key={`favorite-${favorite.name}`} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{favorite.name}</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(favorite.name)}
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                          title="取消收藏"
                          aria-label={`取消收藏 ${favorite.name}`}
                        >
                          取消收藏
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
                            <a href={favorite.link} target="_blank" rel="noopener noreferrer">
                              访问官网
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">暂无官网链接</span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
            <span>正在为你寻找最佳工具...</span>
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
           <div className="w-full max-w-2xl flex flex-col gap-4">
             {compareLimitHint && (
               <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                 {compareLimitHint}
               </div>
             )}
             {results.map((item) => (
                <Card
                  key={item.name}
                  className={cn(
                    "p-5 rounded-xl border",
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
                             "inline-flex items-center gap-1 text-xs transition-colors duration-150",
                             isToolFavorited(item.name)
                               ? "text-rose-500"
                               : "text-muted-foreground hover:text-foreground",
                           )}
                           title={isToolFavorited(item.name) ? "取消收藏" : "收藏"}
                           aria-label={isToolFavorited(item.name) ? `取消收藏 ${item.name}` : `收藏 ${item.name}`}
                         >
                           <Heart className={cn("size-4", isToolFavorited(item.name) ? "fill-current" : "")} />
                           <span>{isToolFavorited(item.name) ? "已收藏" : "收藏"}</span>
                         </button>
                         <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                           <Checkbox
                             checked={isToolSelected(item.name)}
                             onCheckedChange={(checked) => handleCompareToggle(item, checked)}
                             aria-label={`将 ${item.name} 加入对比`}
                           />
                           对比
                         </label>
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
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        访问官网
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
            <p>试试输入：做PPT、写文案、画图、写代码...</p>
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
