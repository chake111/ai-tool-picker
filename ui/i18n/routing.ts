export const routing = {
  locales: ["en", "zh"] as const,
  defaultLocale: "en",
}

export type AppLocale = (typeof routing.locales)[number]
