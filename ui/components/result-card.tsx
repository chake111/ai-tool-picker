import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"

export interface ToolRecommendation {
  name: string
  reason: string
  notSuitableFor: string
}

interface ResultCardProps {
  tool: ToolRecommendation
}

export function ResultCard({ tool }: ResultCardProps) {
  return (
    <Card className="w-full max-w-2xl p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-5">
        {/* 工具名称 */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">
              {tool.name.charAt(0)}
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">
            {tool.name}
          </h2>
        </div>

        {/* 推荐理由 */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50">
          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-foreground leading-relaxed">{tool.reason}</p>
        </div>

        {/* 不适用场景 */}
        <div className="flex items-start gap-3 text-muted-foreground">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed">{tool.notSuitableFor}</p>
        </div>
      </div>
    </Card>
  )
}
