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
    bestFor: "适合新手快速启动内容生产",
    nextStep: "先用 1 个真实任务试跑 20 分钟",
    tags: ["新手友好", "中文", "多场景"],
  },
  {
    name: "Gamma",
    role: "演示文稿自动生成",
    reason: "适合从提纲到成稿快速产出，尤其适合学生和运营提案。",
    bestFor: "适合需要快速交付汇报材料",
    nextStep: "导入提纲后优先调结构页",
    tags: ["PPT", "效率", "可导出"],
  },
  {
    name: "Midjourney",
    role: "高质量视觉生成",
    reason: "需要更高视觉风格一致性时，生成质量和可控性更好。",
    bestFor: "适合品牌视觉和创意探索",
    nextStep: "先定义风格词和品牌色范围",
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
          <p className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            先理解需求和约束
          </p>
          <p className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            再给出可解释推荐
          </p>
          <p className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            最后支持继续对比
          </p>
        </div>

        <p className="text-sm text-muted-foreground">{emptyHint}</p>

        <div className="grid gap-3 md:grid-cols-3">
          {sampleCards.map((sample) => (
            <div key={sample.name} className="app-panel-muted space-y-3 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{sample.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{sample.role}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs leading-relaxed text-foreground/90">{sample.reason}</p>
              <p className="rounded-lg bg-background px-2.5 py-2 text-xs text-muted-foreground">更适合：{sample.bestFor}</p>
              <p className="rounded-lg bg-primary/8 px-2.5 py-2 text-xs text-foreground">下一步：{sample.nextStep}</p>
              <div className="flex flex-wrap gap-1.5">
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
