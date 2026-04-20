export type RecommendItem = {
  name: string
  desc: string
  reason: string
  link: string
  tags: string[]
  priceRange?: string
  platform?: string
  languageSupport?: string
}

export type ToolEmbeddingRecord = {
  toolId: string
  title: string
  description: string
  embedding: number[]
  tags?: string[]
}

export type UserBehaviorEvent = {
  type: "search" | "favorite" | "click"
  timestamp: number
  keyword?: string
  toolId?: string
}

export type UserBehaviorPayload = {
  events: UserBehaviorEvent[]
}

export type UserEmbeddingProfile = {
  userId: string
  embedding: number[]
  eventCount: number
  updatedAt: number
}

export type RankedTool = {
  toolId: string
  score: number
}

export const USER_BEHAVIOR_WEIGHTS: Record<UserBehaviorEvent["type"], number> = {
  search: 1,
  click: 2,
  favorite: 3,
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return Number.NaN

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return Number.NaN
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
