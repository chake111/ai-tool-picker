"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import toolsData from "@/data/tools.json"
import { CompareEmptyState } from "@/components/compare/compare-empty-state"
import { CompareList } from "@/components/compare/compare-list"
import { CompareTable } from "@/components/compare/compare-table"
import { CompareToolbar } from "@/components/compare/compare-toolbar"
import { Button } from "@/components/ui/button"

type ToolDataItem = {
  name: string
  desc: string
  link: string
  tags?: string[]
}

type CompareTool = {
  name: string
  desc: string
  link: string
  priceRange: string
  platform: string
  languageSupport: string
}

type ViewMode = "table" | "list"

const NORMALIZED_TOOLS = toolsData as ToolDataItem[]

const unknownField = (locale: string) => (locale === "zh" ? "未知" : "Unknown")

export default function ComparePage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  const toolsFromQuery = searchParams.get("tools") ?? ""

  const comparedTools = useMemo<CompareTool[]>(() => {
    const requestedNames = toolsFromQuery
      .split(",")
      .map((name) => decodeURIComponent(name).trim())
      .filter(Boolean)

    const limitNames = requestedNames.slice(0, 3)
    return limitNames.map((name) => {
      const matched = NORMALIZED_TOOLS.find((item) => item.name.toLowerCase() === name.toLowerCase())
      return {
        name,
        desc: matched?.desc ?? (locale === "zh" ? "暂无描述" : "No description available"),
        link: matched?.link ?? "#",
        priceRange: unknownField(locale),
        platform: unknownField(locale),
        languageSupport: unknownField(locale),
      }
    })
  }, [locale, toolsFromQuery])

  const updateToolsInUrl = (nextNames: string[]) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nextNames.length === 0) {
      params.delete("tools")
    } else {
      params.set("tools", nextNames.join(","))
    }
    const query = params.toString()
    router.replace(`/${locale}/compare${query ? `?${query}` : ""}`)
  }

  const handleRemove = (toolName: string) => {
    const remaining = comparedTools.filter((tool) => tool.name !== toolName).map((tool) => tool.name)
    updateToolsInUrl(remaining)
  }

  const handleClear = () => {
    updateToolsInUrl([])
  }

  return (
    <main className="app-page-container max-w-5xl gap-4 pb-8">
      <CompareToolbar>
        <h1 className="text-2xl font-semibold">{t("compare.title", { current: comparedTools.length, max: 3 })}</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={viewMode === "table" ? "default" : "outline"} onClick={() => setViewMode("table")}>
            {t("compare.view.table")}
          </Button>
          <Button size="sm" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>
            {t("compare.view.list")}
          </Button>
          <Button size="sm" variant="outline" onClick={handleClear} disabled={comparedTools.length === 0}>
            {t("compare.actions.clear")}
          </Button>
        </div>
      </CompareToolbar>

      {comparedTools.length === 0 ? (
        <CompareEmptyState message={locale === "zh" ? "还没有选择工具，请先在结果页添加对比。" : "No tools selected yet. Add tools from results first."} />
      ) : viewMode === "table" ? (
        <CompareTable>
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-3 py-2">{t("compare.table.name")}</th>
                <th className="px-3 py-2">{t("compare.table.desc")}</th>
                <th className="px-3 py-2">{t("compare.table.priceRange")}</th>
                <th className="px-3 py-2">{t("compare.table.platform")}</th>
                <th className="px-3 py-2">{t("compare.table.languageSupport")}</th>
                <th className="px-3 py-2 text-right">{t("compare.actions.remove")}</th>
              </tr>
            </thead>
            <tbody>
              {comparedTools.map((tool) => (
                <tr key={tool.name} className="border-b align-top">
                  <td className="px-3 py-3 font-medium">{tool.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{tool.desc}</td>
                  <td className="px-3 py-3">{tool.priceRange}</td>
                  <td className="px-3 py-3">{tool.platform}</td>
                  <td className="px-3 py-3">{tool.languageSupport}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      {tool.link !== "#" && (
                        <Button asChild size="sm" variant="outline">
                          <a href={tool.link} target="_blank" rel="noopener noreferrer">
                            {t("common.visitWebsite")}
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleRemove(tool.name)}>
                        {t("compare.actions.remove")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CompareTable>
      ) : (
        <CompareList>
          {comparedTools.map((tool) => (
            <article key={tool.name} className="app-panel app-interactive rounded-[var(--radius-md-token)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">{tool.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{tool.desc}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleRemove(tool.name)}>
                  {t("compare.actions.remove")}
                </Button>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>{t("compare.table.priceRange")}: {tool.priceRange}</p>
                <p>{t("compare.table.platform")}: {tool.platform}</p>
                <p>{t("compare.table.languageSupport")}: {tool.languageSupport}</p>
              </div>
            </article>
          ))}
        </CompareList>
      )}

      <Link href={`/${locale}/results`} className="text-sm text-primary underline-offset-4 hover:underline">
        {locale === "zh" ? "返回结果页继续搜索" : "Back to results"}
      </Link>
    </main>
  )
}
