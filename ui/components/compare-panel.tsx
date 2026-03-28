"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Minus, X } from "lucide-react"
import type { RecommendItem } from "@/lib/recommend"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ComparePanelProps = {
  tools: Array<RecommendItem & { recommendationRank: number }>
  onRemove: (toolName: string) => void
  onClear: () => void
}

type SortMode = "recommendation" | "ai" | "audience"
type ViewMode = "table" | "list"

const AI_KEYWORD_REGEX = /(?:\bai\b|人工智能|大模型|生成式|llm|gpt|copilot|智能)/gi

function getAiFeatureScore(tool: RecommendItem): number {
  const source = `${tool.desc} ${tool.reason} ${tool.tags.join(" ")}`
  const matches = source.match(AI_KEYWORD_REGEX)
  return matches?.length ?? 0
}

export function ComparePanel({ tools, onRemove, onClear }: ComparePanelProps) {
  const [isClosed, setIsClosed] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>("recommendation")
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  const hasEnoughTools = tools.length >= 2

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setIsClosed(true)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const aiScoreByTool = useMemo(() => {
    return new Map(tools.map((tool) => [tool.name, getAiFeatureScore(tool)]))
  }, [tools])

  const sortedTools = useMemo(() => {
    const next = [...tools]
    next.sort((a, b) => {
      if (sortMode === "ai") {
        return (aiScoreByTool.get(b.name) ?? 0) - (aiScoreByTool.get(a.name) ?? 0)
      }
      if (sortMode === "audience") {
        return b.tags.length - a.tags.length
      }
      return a.recommendationRank - b.recommendationRank
    })
    return next
  }, [aiScoreByTool, sortMode, tools])

  if (tools.length === 0) {
    return null
  }

  if (isClosed) {
    return (
      <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        <Button
          type="button"
          className="rounded-full shadow-lg"
          onClick={() => setIsClosed(false)}
        >
          打开工具对比（{tools.length}）
        </Button>
      </div>
    )
  }

  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              工具对比（{tools.length}/3）
            </h3>
            {!hasEnoughTools && (
              <span className="text-xs text-muted-foreground">再选择至少 1 个工具开始对比</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
              aria-label="对比排序"
            >
              <option value="recommendation">按推荐度</option>
              <option value="ai">按 AI 特性</option>
              <option value="audience">按适合人群</option>
            </select>
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              表格
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              列表
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsMinimized((prev) => !prev)}>
              <Minus className="size-4" />
              <span className="sr-only">{isMinimized ? "展开" : "最小化"}</span>
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsClosed(true)}>
              <X className="size-4" />
              <span className="sr-only">关闭</span>
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {viewMode === "table" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>功能描述</TableHead>
                    <TableHead>AI 特性</TableHead>
                    <TableHead>适合人群</TableHead>
                    <TableHead className="text-right">官网</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTools.map((tool) => (
                    <TableRow key={`compare-${tool.name}`}>
                      <TableCell className="font-medium">{tool.name}</TableCell>
                      <TableCell
                        className="max-w-[220px] truncate text-muted-foreground"
                        title={tool.desc}
                      >
                        {tool.desc}
                      </TableCell>
                      <TableCell className="max-w-[240px] whitespace-normal text-foreground">
                        {tool.reason}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tool.tags.map((tag) => (
                            <Badge key={`${tool.name}-${tag}`} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild size="sm">
                            <a href={tool.link} target="_blank" rel="noopener noreferrer">
                              访问 <ExternalLink className="size-3.5" />
                            </a>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(tool.name)}
                          >
                            移除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sortedTools.map((tool) => (
                  <div key={`compare-list-${tool.name}`} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(tool.name)}
                      >
                        移除
                      </Button>
                    </div>
                    <p
                      className="mt-2 truncate text-xs text-muted-foreground"
                      title={tool.desc}
                    >
                      {tool.desc}
                    </p>
                    <p className="mt-2 text-xs text-foreground">{tool.reason}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tool.tags.map((tag) => (
                        <Badge key={`${tool.name}-list-${tag}`} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button asChild className="mt-3 w-full" size="sm">
                      <a href={tool.link} target="_blank" rel="noopener noreferrer">
                        访问官网 <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={onClear}>
                清空对比
              </Button>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
