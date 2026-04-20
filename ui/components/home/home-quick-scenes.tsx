import { AudioLines, ChartNoAxesColumn, Code2, FileText, Image, Languages, Presentation, Video } from "lucide-react"

type HomeQuickScene = {
  id: string
  icon?: string
  presetQuery: string
  label: string
}

type HomeQuickScenesProps = {
  scenes: HomeQuickScene[]
  query: string
  onSelect: (presetQuery: string) => void
}

const iconMap: Record<string, typeof Code2> = {
  code: Code2,
  presentation: Presentation,
  image: Image,
  pen: FileText,
  video: Video,
  chart: ChartNoAxesColumn,
  audio: AudioLines,
  languages: Languages,
}

export function HomeQuickScenes({ scenes, query, onSelect }: HomeQuickScenesProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {scenes.map((scene) => {
        const Icon = iconMap[scene.icon ?? ""] ?? FileText
        const active = query === scene.presetQuery
        return (
          <button
            key={scene.id}
            type="button"
            aria-label={`选择场景：${scene.label}`}
            data-active={active}
            onClick={() => onSelect(scene.presetQuery)}
            className="app-chip app-interactive group inline-flex items-center justify-start gap-2.5 rounded-xl px-3.5 py-3 text-left text-sm"
          >
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:scale-110 group-data-[active=true]:text-primary" />
            <span className="truncate">{scene.label}</span>
          </button>
        )
      })}
    </div>
  )
}
