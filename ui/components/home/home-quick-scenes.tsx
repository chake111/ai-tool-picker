import { Button } from "@/components/ui/button"

type HomeQuickScene = {
  id: string
  presetQuery: string
  label: string
}

type HomeQuickScenesProps = {
  scenes: HomeQuickScene[]
  query: string
  onSelect: (presetQuery: string) => void
}

export function HomeQuickScenes({ scenes, query, onSelect }: HomeQuickScenesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {scenes.map((scene) => (
        <Button
          key={scene.id}
          type="button"
          variant={query === scene.presetQuery ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(scene.presetQuery)}
        >
          {scene.label}
        </Button>
      ))}
    </div>
  )
}
