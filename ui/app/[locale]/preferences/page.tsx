"use client"

import { useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { PreferencesForm } from "@/components/preferences/preferences-form"
import { usePreferences } from "@/hooks/use-preferences"

export default function PreferencesPage() {
  const t = useTranslations()
  const locale = useLocale()
  const { status } = useSession()
  const { preferences, setPreferences, resetPreferences, hasAnyPreference } = usePreferences()

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
        onReset={resetPreferences}
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
