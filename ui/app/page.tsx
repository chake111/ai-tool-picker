"use client"

import { useEffect, useState } from "react"
import { SearchInput } from "@/components/search-input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { RecommendItem } from "@/lib/recommend"

type SearchHistoryItem = {
  query: string
  timestamp: number
}

const HISTORY_STORAGE_KEY = "ai_tool_picker_history"
const HISTORY_LIMIT = 10

export default function Home() {
  const categories = ["写代码", "做PPT", "画图", "写作"] as const
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number] | null>(null)
  const [results, setResults] = useState<RecommendItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<SearchHistoryItem[]>([])

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

  const saveHistory = (inputQuery: string) => {
    const normalizedQuery = inputQuery.trim()
    if (!normalizedQuery) return

    setHistory((prev) => {
      const nextHistory = [{ query: normalizedQuery, timestamp: Date.now() }, ...prev.filter((item) => item.query !== normalizedQuery)].slice(
        0,
        HISTORY_LIMIT,
      )
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
    const matchedCategory = categories.find((category) => category === historyQuery) ?? null
    setSelectedCategory(matchedCategory)
    void handleSearch(historyQuery)
  }

  const handleClearHistory = () => {
    setHistory([])
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
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
            {results.map((item) => (
                <Card key={item.name} className="p-5 rounded-xl border border-border">
                  <div className="flex h-full flex-col">
                    <h2 className="text-lg font-semibold text-foreground">{item.name}</h2>
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
                    <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
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
    </main>
  )
}
