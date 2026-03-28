export const routing = {
  locales: ["en", "zh"] as const,
  defaultLocale: "en",
} as const

export type AppLocale = (typeof routing.locales)[number]
