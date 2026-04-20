"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

const PREFERENCES_STORAGE_KEY = "ai_tool_picker_preferences"

type UserPreferences = {
  pricing: "any" | "free" | "paid"
  chineseFirst: boolean
  platforms: {
    web: boolean
    mobile: boolean
    desktop: boolean
  }
}

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  pricing: "any",
  chineseFirst: false,
  platforms: {
    web: false,
    mobile: false,
    desktop: false,
  },
}

export default function PreferencesPage() {
  const t = useTranslations()
  const locale = useLocale()
  const { status } = useSession()
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES)

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? "null")
      if (!parsed || typeof parsed !== "object") return
      setPreferences({
        pricing: parsed.pricing === "free" || parsed.pricing === "paid" ? parsed.pricing : "any",
        chineseFirst: Boolean(parsed.chineseFirst),
        platforms: {
          web: Boolean(parsed.platforms?.web),
          mobile: Boolean(parsed.platforms?.mobile),
          desktop: Boolean(parsed.platforms?.desktop),
        },
      })
    } catch {
      setPreferences(DEFAULT_USER_PREFERENCES)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  const hasAnyPreference = useMemo(
    () =>
      preferences.pricing !== "any" ||
      preferences.chineseFirst ||
      preferences.platforms.web ||
      preferences.platforms.mobile ||
      preferences.platforms.desktop,
    [preferences],
  )

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("preferences.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("preferences.subtitle")}</p>
      </section>

      <Card className="space-y-4 p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">{locale === "zh" ? "价格偏好" : "Pricing preference"}</p>
          <div className="flex flex-wrap gap-2">
            {(["any", "free", "paid"] as const).map((pricing) => (
              <Button
                key={pricing}
                variant={preferences.pricing === pricing ? "default" : "outline"}
                size="sm"
                onClick={() => setPreferences((prev) => ({ ...prev, pricing }))}
              >
                {t(`preferences.pricing.${pricing}`)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t("preferences.platformTitle")}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(["web", "mobile", "desktop"] as const).map((platformKey) => (
              <label key={platformKey} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <Checkbox
                  checked={preferences.platforms[platformKey]}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      platforms: {
                        ...prev.platforms,
                        [platformKey]: Boolean(checked),
                      },
                    }))
                  }
                />
                {t(`preferences.platforms.${platformKey}`)}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
          <Checkbox
            checked={preferences.chineseFirst}
            onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, chineseFirst: Boolean(checked) }))}
          />
          {t("preferences.chineseFirst")}
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {status === "authenticated" ? t("preferences.privacy.account") : t("preferences.privacy.local")}
          </p>
          <Button variant="outline" size="sm" onClick={() => setPreferences(DEFAULT_USER_PREFERENCES)} disabled={!hasAnyPreference}>
            {t("preferences.reset")}
          </Button>
        </div>
      </Card>
    </main>
  )
}
