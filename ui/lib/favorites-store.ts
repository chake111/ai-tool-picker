export type FavoriteItem = {
  name: string
  desc: string
  reason: string
  link?: string
  tags?: string[]
}

const FAVORITES_LIMIT = 30
const userFavorites = new Map<string, FavoriteItem[]>()

export const sanitizeFavoriteItem = (input: unknown): FavoriteItem | null => {
  if (!input || typeof input !== "object") return null
  const candidate = input as Partial<FavoriteItem>
  if (typeof candidate.name !== "string" || !candidate.name.trim()) return null
  if (typeof candidate.desc !== "string" || !candidate.desc.trim()) return null
  if (typeof candidate.reason !== "string" || !candidate.reason.trim()) return null

  const sanitizedTags = Array.isArray(candidate.tags)
    ? candidate.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    : undefined

  return {
    name: candidate.name,
    desc: candidate.desc,
    reason: candidate.reason,
    link: typeof candidate.link === "string" && candidate.link.trim().length > 0 ? candidate.link : undefined,
    tags: sanitizedTags && sanitizedTags.length > 0 ? sanitizedTags : undefined,
  }
}

export const getUserFavorites = (userKey: string) => userFavorites.get(userKey) ?? []

export const setUserFavorites = (userKey: string, favorites: FavoriteItem[]) => {
  const sanitized = favorites
    .map((item) => sanitizeFavoriteItem(item))
    .filter((item): item is FavoriteItem => !!item)
    .slice(0, FAVORITES_LIMIT)
  userFavorites.set(userKey, sanitized)
  return sanitized
}

export const FAVORITES_MAX_COUNT = FAVORITES_LIMIT
