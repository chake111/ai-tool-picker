#!/usr/bin/env node
import crypto from "node:crypto"
import { PrismaClient, ToolStatus } from "@prisma/client"

const prisma = new PrismaClient()
const ZHIPU_EMBEDDING_API_URL = "https://open.bigmodel.cn/api/paas/v4/embeddings"
const OPENAI_EMBEDDING_API_URL = "https://api.openai.com/v1/embeddings"
const ZHIPU_EMBEDDING_MODEL = "embedding-3"
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"
const MODEL = process.env.EMBEDDING_MODEL || OPENAI_EMBEDDING_MODEL

function buildToolEmbeddingText(tool) {
  return [
    tool.desc,
    `tags: ${tool.tags.join(", ")}`,
    `use_cases: ${tool.useCases.join(", ")}`,
    `target_users: ${tool.targetUsers.join(", ")}`,
  ].join("\n")
}

function sourceHash(input) {
  return crypto.createHash("sha256").update(input).digest("hex")
}

async function createEmbedding(input) {
  if (MODEL === ZHIPU_EMBEDDING_MODEL) {
    const zhipuApiKey = process.env.ZHIPU_API_KEY
    if (!zhipuApiKey) {
      throw new Error("ZHIPU_API_KEY is required when EMBEDDING_MODEL=embedding-3")
    }
    const response = await fetch(ZHIPU_EMBEDDING_API_URL, {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${zhipuApiKey}`,
      },
      body: JSON.stringify({ model: ZHIPU_EMBEDDING_MODEL, input }),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Zhipu embedding request failed: ${response.status} ${errorText}`)
    }
    const data = await response.json()
    const embedding = data.data?.[0]?.embedding
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error("Empty embedding from Zhipu")
    }
    return embedding
  }

  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is required for text-embedding-3-small")
  }
  const response = await fetch(OPENAI_EMBEDDING_API_URL, {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({ model: OPENAI_EMBEDDING_MODEL, input }),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI embedding request failed: ${response.status} ${errorText}`)
  }
  const data = await response.json()
  const embedding = data.data?.[0]?.embedding
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Empty embedding from OpenAI")
  }
  return embedding
}

async function main() {
  const tools = await prisma.tool.findMany({ where: { status: ToolStatus.active } })
  let updated = 0

  for (const tool of tools) {
    const input = buildToolEmbeddingText(tool)
    const hash = sourceHash(input)
    const existing = await prisma.toolEmbedding.findUnique({
      where: { toolId_model: { toolId: tool.id, model: MODEL } },
    })

    if (existing?.sourceHash === hash && existing.vector.length > 0) {
      continue
    }

    const vector = await createEmbedding(input)
    await prisma.toolEmbedding.upsert({
      where: { toolId_model: { toolId: tool.id, model: MODEL } },
      update: { vector, sourceHash: hash },
      create: {
        toolId: tool.id,
        model: MODEL,
        vector,
        sourceHash: hash,
      },
    })
    updated += 1
    console.log(`Embedded: ${tool.name}`)
  }

  console.log(`Embedding rebuild finished. updated=${updated}, total=${tools.length}, model=${MODEL}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
