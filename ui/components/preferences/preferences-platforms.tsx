import { Checkbox } from "@/components/ui/checkbox"

type PlatformKey = "web" | "mobile" | "desktop"

type PreferencesPlatformsProps = {
  title: string
  values: Record<PlatformKey, boolean>
  getLabel: (key: PlatformKey) => string
  onChange: (key: PlatformKey, checked: boolean) => void
}

export function PreferencesPlatforms({ title, values, getLabel, onChange }: PreferencesPlatformsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {(["web", "mobile", "desktop"] as const).map((platformKey) => (
          <label key={platformKey} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
            <Checkbox checked={values[platformKey]} onCheckedChange={(checked) => onChange(platformKey, Boolean(checked))} />
            {getLabel(platformKey)}
          </label>
        ))}
      </div>
    </div>
  )
}
