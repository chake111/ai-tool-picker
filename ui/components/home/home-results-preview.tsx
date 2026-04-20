import { Card } from "@/components/ui/card"

type HomeResultsPreviewProps = {
  title: string
  emptyHint: string
}

const sampleCards = [
  { name: "ChatGPT", desc: "对话与内容生成，一站式处理写作、总结和代码辅助。", tags: ["免费", "专业", "中文"] },
  { name: "Gamma", desc: "快速生成演示文稿，适合做 PPT 和提案演示。", tags: ["付费", "新手", "中文"] },
  { name: "Midjourney", desc: "图像生成质量高，适合品牌视觉与创意素材。", tags: ["付费", "专业"] },
]

export function HomeResultsPreview({ title, emptyHint }: HomeResultsPreviewProps) {
  return (
    <section className="space-y-4">
      <h2 className="app-section-title">{title}</h2>
      <Card className="app-panel space-y-4 border-dashed p-5">
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
        <div className="grid gap-3 md:grid-cols-3">
          {sampleCards.map((sample) => (
            <div key={sample.name} className="app-panel rounded-[var(--radius-md-token)] bg-[var(--surface-muted)] p-4">
              <p className="text-sm font-semibold">{sample.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{sample.desc}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sample.tags.map((tag) => (
                  <span key={`${sample.name}-${tag}`} className="rounded-full bg-background px-2 py-1 text-[11px] text-muted-foreground">
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
