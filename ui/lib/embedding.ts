import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"

type ZhipuEmbeddingResponse = {
  data?: Array<{
    embedding?: number[]
  }>
}

type OpenAIEmbeddingResponse = {
  data?: Array<{
    embedding?: number[]
  }>
}

const ZHIPU_EMBEDDING_API_URL = "https://open.bigmodel.cn/api/paas/v4/embeddings"
const OPENAI_EMBEDDING_API_URL = "https://api.openai.com/v1/embeddings"
const EMBEDDING_TIMEOUT_MS = 15_000

export const ZHIPU_EMBEDDING_MODEL = "embedding-3"
export const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"
export const DEFAULT_EMBEDDING_MODEL = OPENAI_EMBEDDING_MODEL

function getCacheKey(input: string, model: string): string {
  return crypto.createHash("sha256").update(`${model}::${input}`).digest("hex")
}

async function saveQueryEmbeddingToCache(input: string, model: string, vector: number[]): Promise<void> {
  const key = getCacheKey(input, model)
  await prisma.queryEmbeddingCache.upsert({
    where: { key },
    update: { vector, model },
    create: { key, model, vector },
  })
}

export async function readCachedQueryEmbedding(input: string, model = DEFAULT_EMBEDDING_MODEL): Promise<number[] | null> {
  const key = getCacheKey(input, model)
  const cached = await prisma.queryEmbeddingCache.findUnique({ where: { key } })
  if (!cached || !Array.isArray(cached.vector) || cached.vector.length === 0) {
    return null
  }
  return cached.vector
}

export async function createEmbedding(input: string): Promise<number[]> {
  const zhipuApiKey = process.env.ZHIPU_API_KEY
  if (zhipuApiKey) {
    const response = await fetch(ZHIPU_EMBEDDING_API_URL, {
      method: "POST",
      signal: AbortSignal.timeout(EMBEDDING_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${zhipuApiKey}`,
      },
      body: JSON.stringify({
        model: ZHIPU_EMBEDDING_MODEL,
        input,
      }),
    })
    if (response.ok) {
      const data = (await response.json()) as ZhipuEmbeddingResponse
      const embedding = data.data?.[0]?.embedding
      if (Array.isArray(embedding) && embedding.length > 0) {
        await saveQueryEmbeddingToCache(input, ZHIPU_EMBEDDING_MODEL, embedding)
        return embedding
      }
    }
  }

  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    throw new Error("No embedding API key configured")
  }

  const openaiResponse = await fetch(OPENAI_EMBEDDING_API_URL, {
    method: "POST",
    signal: AbortSignal.timeout(EMBEDDING_TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input,
    }),
  })
  if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text()
    throw new Error(`OpenAI embedding request failed: ${openaiResponse.status} ${errorText}`)
  }
  const openaiData = (await openaiResponse.json()) as OpenAIEmbeddingResponse
  const openaiEmbedding = openaiData.data?.[0]?.embedding
  if (!Array.isArray(openaiEmbedding) || openaiEmbedding.length === 0) {
    throw new Error("Empty embedding from OpenAI")
  }
  await saveQueryEmbeddingToCache(input, OPENAI_EMBEDDING_MODEL, openaiEmbedding)
  return openaiEmbedding
}

export async function createEmbeddingWithDegrade(input: string): Promise<number[]> {
  try {
    return await createEmbedding(input)
  } catch (error) {
    console.warn("Embedding API unavailable, fallback to cached embedding:", error)
    const cached = (await readCachedQueryEmbedding(input, OPENAI_EMBEDDING_MODEL)) ??
      (await readCachedQueryEmbedding(input, ZHIPU_EMBEDDING_MODEL))
    if (cached) {
      return cached
    }
    throw error
  }
}

export function buildToolEmbeddingText(tool: {
  description: string
  tags: string[]
  use_cases: string[]
  target_users: string[]
}): string {
  return [
    tool.description,
    `tags: ${tool.tags.join(", ")}`,
    `use_cases: ${tool.use_cases.join(", ")}`,
    `target_users: ${tool.target_users.join(", ")}`,
  ].join("\n")
}
