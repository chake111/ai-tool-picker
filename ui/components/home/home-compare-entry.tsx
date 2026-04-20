import Link from "next/link"
import { Button } from "@/components/ui/button"

type CompareTool = {
  name: string
}

type HomeCompareEntryProps = {
  locale: string
  selectedCount: number
  maxCount: number
  compareQuery: string
  compareTools: CompareTool[]
}

const shortName = (name: string) => name.trim().slice(0, 2).toUpperCase()

export function HomeCompareEntry({ locale, selectedCount, maxCount, compareQuery, compareTools }: HomeCompareEntryProps) {
  const canCompare = selectedCount >= 2
  const helperText = locale === "zh" ? "选择 2–3 个工具开始对比" : "Pick 2-3 tools to start compare"

  return (
    <section className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-foreground text-background/95 backdrop-blur-sm">
      <div className="mx-auto hidden h-[72px] w-full max-w-6xl items-center justify-between gap-3 px-4 sm:flex sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <p className="text-sm text-background/80">{locale === "zh" ? `已选 ${selectedCount}/${maxCount} 个工具` : `${selectedCount}/${maxCount} tools selected`}</p>
          <div className="flex items-center gap-2">
            {Array.from({ length: maxCount }).map((_, index) => {
              const tool = compareTools[index]
              return tool ? (
                <span
                  key={`${tool.name}-${index}`}
                  className="inline-flex h-8 w-8 animate-in zoom-in-50 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold"
                  aria-label={`${tool.name} 已加入对比`}
                >
                  {shortName(tool.name)}
                </span>
              ) : (
                <span key={`placeholder-${index}`} className="h-8 w-8 rounded-full border border-dashed border-white/40" aria-hidden="true" />
              )
            })}
          </div>
        </div>
        <Button asChild size="sm" className="rounded-xl" variant={canCompare ? "default" : "secondary"} disabled={!canCompare}>
          <Link href={`/${locale}/compare?tools=${compareQuery}`}>{locale === "zh" ? "去对比" : "Go compare"}</Link>
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-6xl justify-end px-4 py-3 sm:hidden">
        <div className="rounded-full bg-foreground px-4 py-2 text-xs text-background shadow-lg">{helperText}</div>
      </div>
    </section>
  )
}
