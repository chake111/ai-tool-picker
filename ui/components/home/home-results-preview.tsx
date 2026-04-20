import { ArrowUpRight, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"

type HomeResultsPreviewProps = {
  title: string
  emptyHint: string
  subtitle: string
}

const sampleCards = [
  {
    name: "ChatGPT",
    role: "通用写作与研究助手",
    reason: "需要兼顾检索、写作、结构化输出时，稳定且上手成本低。",
    tags: ["新手友好", "中文", "多场景"],
  },
  {
    name: "Gamma",
    role: "演示文稿自动生成",
    reason: "适合从提纲到成稿快速产出，尤其适合学生和运营提案。",
    tags: ["PPT", "效率", "可导出"],
  },
  {
    name: "Midjourney",
    role: "高质量视觉生成",
    reason: "需要更高视觉风格一致性时，生成质量和可控性更好。",
    tags: ["品牌视觉", "创意", "进阶"],
  },
]

export function HomeResultsPreview({ title, emptyHint, subtitle }: HomeResultsPreviewProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="app-section-title">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <Card className="app-panel space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground sm:grid-cols-3">
          <p className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />理解需求语境</p>
          <p className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />给出可执行推荐理由</p>
          <p className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />支持继续筛选与对比</p>
        </div>

        <p className="text-sm text-muted-foreground">{emptyHint}</p>

        <div className="grid gap-3 md:grid-cols-3">
          {sampleCards.map((sample) => (
            <div key={sample.name} className="app-panel-muted rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{sample.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{sample.role}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-foreground/90">{sample.reason}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {sample.tags.map((tag) => (
                  <span key={`${sample.name}-${tag}`} className="rounded-full border border-border/70 bg-background px-2 py-1 text-[11px] text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
