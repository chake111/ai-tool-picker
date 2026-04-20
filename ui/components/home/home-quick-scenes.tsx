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
    <div className="flex gap-3 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
      {scenes.map((scene) => {
        const Icon = iconMap[scene.icon ?? ""] ?? FileText
        const active = query === scene.presetQuery
        return (
          <button
            key={scene.id}
            type="button"
            role="button"
            aria-label={`选择场景：${scene.label}`}
            onClick={() => onSelect(scene.presetQuery)}
            className={`group inline-flex min-w-max items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/70 focus-visible:outline-offset-2 ${
              active
                ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
            }`}
          >
            <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>{scene.label}</span>
          </button>
        )
      })}
    </div>
  )
}
