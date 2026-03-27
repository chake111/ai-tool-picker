import { NextResponse } from "next/server"

type RecommendRequest = {
  query: string
}

type RecommendItem = {
  name: string
  desc: string
  reason: string
}

type ZhipuChatResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

function extractJsonArray(text: string): RecommendItem[] {
  const parsed = JSON.parse(text)
  if (!Array.isArray(parsed)) {
    throw new Error("Model response is not an array")
  }
  return parsed.map((item) => ({
    name: String(item?.name ?? ""),
    desc: String(item?.desc ?? ""),
    reason: String(item?.reason ?? ""),
  }))
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendRequest
    const query = body?.query?.trim()

    if (!query) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 })
    }

    const apiKey = process.env.ZHIPU_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "ZHIPU_API_KEY is not configured" }, { status: 500 })
    }

    const zhipuResponse = await fetch(ZHIPU_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "你是一个 AI 工具推荐助手。请严格返回 JSON 数组，不要包含 markdown 或额外说明。每个元素字段为 name、desc、reason。",
          },
          {
            role: "user",
            content: `用户需求：${query}\n请推荐 3 个工具，并返回如下格式的 JSON 数组：[{\"name\":\"工具名\",\"desc\":\"一句话介绍\",\"reason\":\"推荐理由\"}]`,
          },
        ],
      }),
    })

    if (!zhipuResponse.ok) {
      const errorText = await zhipuResponse.text()
      throw new Error(`Zhipu API request failed: ${zhipuResponse.status} ${errorText}`)
    }

    const completion = (await zhipuResponse.json()) as ZhipuChatResponse
    const content = completion.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw new Error("Empty model response")
    }

    let recommendations: RecommendItem[]
    try {
      recommendations = extractJsonArray(content)
    } catch {
      const start = content.indexOf("[")
      const end = content.lastIndexOf("]")
      if (start === -1 || end === -1 || end <= start) {
        throw new Error("Model response is not valid JSON array")
      }
      recommendations = extractJsonArray(content.slice(start, end + 1))
    }

    return NextResponse.json(recommendations)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
