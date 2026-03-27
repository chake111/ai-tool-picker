"use client"

import { useState } from "react"
import { SearchInput } from "@/components/search-input"
import { ResultCard, type ToolRecommendation } from "@/components/result-card"

// 模拟AI工具数据库
const aiToolsDatabase: Record<string, ToolRecommendation> = {
  ppt: {
    name: "Gamma",
    reason: "Gamma 能根据你的提纲自动生成精美的 PPT，支持一键换风格，特别适合快速制作演示文稿。",
    notSuitableFor: "不适用于需要复杂动画效果或高度定制化设计的场景。",
  },
  文案: {
    name: "Claude",
    reason: "Claude 在长文写作和逻辑推理方面表现出色，能帮你撰写结构清晰、内容详实的文案。",
    notSuitableFor: "不适用于需要实时数据或最新新闻资讯的内容创作。",
  },
  图片: {
    name: "Midjourney",
    reason: "Midjourney 是目前最强大的 AI 绘图工具之一，能生成高质量的艺术风格图片。",
    notSuitableFor: "不适用于需要精确控制图片细节或生成真实照片的场景。",
  },
  代码: {
    name: "GitHub Copilot",
    reason: "GitHub Copilot 能根据上下文智能补全代码，支持多种编程语言，极大提升编码效率。",
    notSuitableFor: "不适用于复杂的系统架构设计或安全关键型代码的编写。",
  },
  视频: {
    name: "Runway",
    reason: "Runway 提供强大的 AI 视频生成和编辑功能，支持文字生成视频、视频风格转换等。",
    notSuitableFor: "不适用于需要长时长视频或高精度剪辑的专业级后期制作。",
  },
  翻译: {
    name: "DeepL",
    reason: "DeepL 的翻译质量在多项评测中领先，尤其擅长欧洲语言和专业文档翻译。",
    notSuitableFor: "不适用于口语化对话翻译或小语种翻译。",
  },
  音乐: {
    name: "Suno",
    reason: "Suno 能根据文字描述生成完整的音乐作品，包括歌词和旋律，操作简单易上手。",
    notSuitableFor: "不适用于需要精确控制乐器编排或专业级音乐制作。",
  },
}

// 简单的关键词匹配函数
function findBestTool(query: string): ToolRecommendation {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes("ppt") || lowerQuery.includes("演示") || lowerQuery.includes("幻灯片")) {
    return aiToolsDatabase.ppt
  }
  if (lowerQuery.includes("文案") || lowerQuery.includes("写作") || lowerQuery.includes("文章") || lowerQuery.includes("写")) {
    return aiToolsDatabase.文案
  }
  if (lowerQuery.includes("图") || lowerQuery.includes("画") || lowerQuery.includes("设计") || lowerQuery.includes("海报")) {
    return aiToolsDatabase.图片
  }
  if (lowerQuery.includes("代码") || lowerQuery.includes("编程") || lowerQuery.includes("开发") || lowerQuery.includes("程序")) {
    return aiToolsDatabase.代码
  }
  if (lowerQuery.includes("视频") || lowerQuery.includes("动画") || lowerQuery.includes("剪辑")) {
    return aiToolsDatabase.视频
  }
  if (lowerQuery.includes("翻译") || lowerQuery.includes("英语") || lowerQuery.includes("外语")) {
    return aiToolsDatabase.翻译
  }
  if (lowerQuery.includes("音乐") || lowerQuery.includes("歌") || lowerQuery.includes("旋律")) {
    return aiToolsDatabase.音乐
  }
  
  // 默认推荐
  return {
    name: "ChatGPT",
    reason: "ChatGPT 是一个通用型 AI 助手，能处理各种文字相关任务，是入门 AI 工具的最佳选择。",
    notSuitableFor: "不适用于需要实时信息或专业领域深度知识的任务。",
  }
}

export default function Home() {
  const [result, setResult] = useState<ToolRecommendation | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setResult(null)
    
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    const tool = findBestTool(query)
    setResult(tool)
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl flex flex-col items-center gap-12">
        {/* 标题区域 */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight text-balance">
            帮你选 AI
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            告诉我你想做什么，我来推荐最合适的 AI 工具
          </p>
        </div>

        {/* 搜索输入 */}
        <SearchInput onSearch={handleSearch} isLoading={isLoading} />

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
            <span>正在为你寻找最佳工具...</span>
          </div>
        )}

        {/* 结果卡片 */}
        {result && !isLoading && <ResultCard tool={result} />}

        {/* 底部提示 */}
        {!result && !isLoading && (
          <div className="text-center text-sm text-muted-foreground">
            <p>试试输入：做PPT、写文案、画图、写代码...</p>
          </div>
        )}
      </div>
    </main>
  )
}
