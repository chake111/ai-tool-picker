export type FavoriteItem = {
  toolId?: string
  name: string
  desc: string
  reason: string
  link?: string
  tags?: string[]
}

const FAVORITES_LIMIT = 30

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
    toolId: typeof candidate.toolId === "string" && candidate.toolId.trim().length > 0 ? candidate.toolId.trim() : undefined,
    name: candidate.name,
    desc: candidate.desc,
    reason: candidate.reason,
    link: typeof candidate.link === "string" && candidate.link.trim().length > 0 ? candidate.link : undefined,
    tags: sanitizedTags && sanitizedTags.length > 0 ? sanitizedTags : undefined,
  }
}

export const FAVORITES_MAX_COUNT = FAVORITES_LIMIT
