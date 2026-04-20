import type { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { LoaderCircle } from "lucide-react"

type StatePanelTone = "default" | "dashed"

type StatePanelProps = {
  hint: string
  icon?: ReactNode
  tone?: StatePanelTone
}

export function StatePanel({ hint, icon, tone = "default" }: StatePanelProps) {
  return (
    <Card className={`app-panel p-5 text-sm text-muted-foreground ${tone === "dashed" ? "border-dashed" : ""}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span>{hint}</span>
      </div>
    </Card>
  )
}

export function LoadingStatePanel({ hint }: { hint: string }) {
  return <StatePanel hint={hint} icon={<LoaderCircle className="h-4 w-4 animate-spin" />} />
}
