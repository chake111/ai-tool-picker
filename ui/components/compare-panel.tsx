"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Minus, X } from "lucide-react"
import { useTranslations } from "next-intl"
import type { RecommendItem } from "@/lib/recommend"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ComparePanelProps = {
  tools: Array<
    RecommendItem & {
      recommendationRank: number
      priceRange: string
      platform: string
      languageSupport: string
    }
  >
  onRemove: (toolName: string) => void
  onClear: () => void
}

type SortMode = "recommendation" | "name"
type ViewMode = "table" | "list"

export function ComparePanel({ tools, onRemove, onClear }: ComparePanelProps) {
  const t = useTranslations("compare")
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

  const sortedTools = useMemo(() => {
    const next = [...tools]
    next.sort((a, b) => {
      if (sortMode === "name") {
        return a.name.localeCompare(b.name, "zh-Hans-CN")
      }
      return a.recommendationRank - b.recommendationRank
    })
    return next
  }, [sortMode, tools])

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
          {t("open", { count: tools.length })}
        </Button>
      </div>
    )
  }

  return (
    <aside
      className={`fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 ${
        hasEnoughTools ? "border-primary/50 shadow-[0_-8px_24px_rgba(14,165,233,0.18)]" : "border-border"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {t("title", { current: tools.length, max: 3 })}
            </h3>
            {tools.length === 1 && (
              <span className="text-xs text-primary">{t("selectedOne")}</span>
            )}
            {!hasEnoughTools && tools.length !== 1 && (
              <span className="text-xs text-muted-foreground">{t("needMore")}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
              aria-label={t("sortAria")}
            >
              <option value="recommendation">{t("sort.recommendation")}</option>
              <option value="name">{t("sort.name")}</option>
            </select>
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              {t("view.table")}
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              {t("view.list")}
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsMinimized((prev) => !prev)}>
              <Minus className="size-4" />
              <span className="sr-only">{isMinimized ? t("actions.expand") : t("actions.minimize")}</span>
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsClosed(true)}>
              <X className="size-4" />
              <span className="sr-only">{t("actions.close")}</span>
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {viewMode === "table" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.name")}</TableHead>
                    <TableHead>{t("table.desc")}</TableHead>
                    <TableHead>{t("table.priceRange")}</TableHead>
                    <TableHead>{t("table.platform")}</TableHead>
                    <TableHead>{t("table.languageSupport")}</TableHead>
                    <TableHead className="text-right">{t("table.site")}</TableHead>
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
                      <TableCell>{tool.priceRange}</TableCell>
                      <TableCell>{tool.platform}</TableCell>
                      <TableCell>{tool.languageSupport}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild size="sm">
                            <a href={tool.link} target="_blank" rel="noopener noreferrer">
                              {t("actions.visit")} <ExternalLink className="size-3.5" />
                            </a>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(tool.name)}
                          >
                            {t("actions.remove")}
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
                        {t("actions.remove")}
                      </Button>
                    </div>
                    <p
                      className="mt-2 truncate text-xs text-muted-foreground"
                      title={tool.desc}
                    >
                      {tool.desc}
                    </p>
                    <p className="mt-2 text-xs text-foreground">{tool.reason}</p>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p>{t("table.priceRange")}: {tool.priceRange}</p>
                      <p>{t("table.platform")}: {tool.platform}</p>
                      <p>{t("table.languageSupport")}: {tool.languageSupport}</p>
                    </div>
                    <Button asChild className="mt-3 w-full" size="sm">
                      <a href={tool.link} target="_blank" rel="noopener noreferrer">
                        {t("actions.visitSite")} <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={onClear}>
                {t("actions.clear")}
              </Button>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
