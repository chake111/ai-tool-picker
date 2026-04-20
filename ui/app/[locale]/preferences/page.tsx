"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { PreferencesForm } from "@/components/preferences/preferences-form"

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

      <PreferencesForm
        locale={locale}
        preferences={preferences}
        onChange={setPreferences}
        onReset={() => setPreferences(DEFAULT_USER_PREFERENCES)}
        canReset={hasAnyPreference}
        pricingTitle={locale === "zh" ? "价格偏好" : "Pricing preference"}
        platformTitle={t("preferences.platformTitle")}
        chineseFirstLabel={t("preferences.chineseFirst")}
        resetLabel={t("preferences.reset")}
        privacyNote={status === "authenticated" ? t("preferences.privacy.account") : t("preferences.privacy.local")}
        getPricingLabel={(value) => t(`preferences.pricing.${value}`)}
        getPlatformLabel={(value) => t(`preferences.platforms.${value}`)}
      />
    </main>
  )
}
