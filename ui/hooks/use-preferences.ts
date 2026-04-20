"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

export const PREFERENCES_STORAGE_KEY = "ai_tool_picker_preferences"

export type UserPreferences = {
  pricing: "any" | "free" | "paid"
  chineseFirst: boolean
  platforms: {
    web: boolean
    mobile: boolean
    desktop: boolean
  }
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  pricing: "any",
  chineseFirst: false,
  platforms: {
    web: false,
    mobile: false,
    desktop: false,
  },
}

const sanitizePreferences = (input: unknown): UserPreferences => {
  if (!input || typeof input !== "object") return DEFAULT_USER_PREFERENCES
  const parsed = input as Partial<UserPreferences>

  return {
    pricing: parsed.pricing === "free" || parsed.pricing === "paid" ? parsed.pricing : "any",
    chineseFirst: Boolean(parsed.chineseFirst),
    platforms: {
      web: Boolean(parsed.platforms?.web),
      mobile: Boolean(parsed.platforms?.mobile),
      desktop: Boolean(parsed.platforms?.desktop),
    },
  }
}

export function serializePreferences(preferences: UserPreferences): string {
  return JSON.stringify(preferences)
}

export function usePreferences(storageKey = PREFERENCES_STORAGE_KEY) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES)

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "null")
      setPreferences(sanitizePreferences(parsed))
    } catch {
      setPreferences(DEFAULT_USER_PREFERENCES)
    }
  }, [storageKey])

  useEffect(() => {
    window.localStorage.setItem(storageKey, serializePreferences(preferences))
  }, [preferences, storageKey])

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_USER_PREFERENCES)
  }, [])

  const hasAnyPreference = useMemo(
    () => preferences.pricing !== "any" || preferences.chineseFirst || Object.values(preferences.platforms).some(Boolean),
    [preferences],
  )

  return {
    preferences,
    setPreferences,
    resetPreferences,
    hasAnyPreference,
  }
}
