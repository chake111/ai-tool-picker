import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { PreferencesPlatforms } from "@/components/preferences/preferences-platforms"
import { PreferencesPricing } from "@/components/preferences/preferences-pricing"
import { PreferencesPrivacyNote } from "@/components/preferences/preferences-privacy-note"

type UserPreferences = {
  pricing: "any" | "free" | "paid"
  chineseFirst: boolean
  platforms: {
    web: boolean
    mobile: boolean
    desktop: boolean
  }
}

type PreferencesFormProps = {
  locale: string
  preferences: UserPreferences
  onChange: (next: UserPreferences) => void
  onReset: () => void
  canReset: boolean
  pricingTitle: string
  platformTitle: string
  chineseFirstLabel: string
  resetLabel: string
  privacyNote: string
  getPricingLabel: (value: "any" | "free" | "paid") => string
  getPlatformLabel: (value: "web" | "mobile" | "desktop") => string
}

export function PreferencesForm({
  locale,
  preferences,
  onChange,
  onReset,
  canReset,
  pricingTitle,
  platformTitle,
  chineseFirstLabel,
  resetLabel,
  privacyNote,
  getPricingLabel,
  getPlatformLabel,
}: PreferencesFormProps) {
  return (
    <Card className="space-y-4 p-4">
      <PreferencesPricing
        title={pricingTitle || (locale === "zh" ? "价格偏好" : "Pricing preference")}
        pricing={preferences.pricing}
        getLabel={getPricingLabel}
        onChange={(pricing) => onChange({ ...preferences, pricing })}
      />

      <PreferencesPlatforms
        title={platformTitle}
        values={preferences.platforms}
        getLabel={getPlatformLabel}
        onChange={(platformKey, checked) =>
          onChange({
            ...preferences,
            platforms: {
              ...preferences.platforms,
              [platformKey]: checked,
            },
          })
        }
      />

      <label className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
        <Checkbox checked={preferences.chineseFirst} onCheckedChange={(checked) => onChange({ ...preferences, chineseFirst: Boolean(checked) })} />
        {chineseFirstLabel}
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PreferencesPrivacyNote text={privacyNote} />
        <Button variant="outline" size="sm" onClick={onReset} disabled={!canReset}>
          {resetLabel}
        </Button>
      </div>
    </Card>
  )
}
