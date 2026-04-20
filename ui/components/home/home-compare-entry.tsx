import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type HomeCompareEntryProps = {
  locale: string
  selectedCount: number
  maxCount: number
  compareQuery: string
}

export function HomeCompareEntry({ locale, selectedCount, maxCount, compareQuery }: HomeCompareEntryProps) {
  return (
    <section>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          {locale === "zh" ? `已选 ${selectedCount}/${maxCount} 个工具` : `${selectedCount}/${maxCount} tools selected`}
        </p>
        <Button asChild variant="outline" size="sm" disabled={selectedCount < 2}>
          <Link href={`/${locale}/compare?tools=${compareQuery}`}>{locale === "zh" ? "去对比" : "Go compare"}</Link>
        </Button>
      </Card>
    </section>
  )
}
