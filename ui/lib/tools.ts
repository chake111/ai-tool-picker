import { ToolStatus, type Tool } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export type ToolDatasetItem = {
  id: string
  name: string
  description: string
  tags: string[]
  use_cases: string[]
  target_users: string[]
  link: string
  status: ToolStatus
  updated_at: string
}

export function normalizeTool(tool: Tool): ToolDatasetItem {
  return {
    id: tool.id,
    name: tool.name,
    description: tool.desc,
    tags: tool.tags,
    use_cases: tool.useCases,
    target_users: tool.targetUsers,
    link: tool.link,
    status: tool.status,
    updated_at: tool.updatedAt.toISOString(),
  }
}

export async function getActiveTools(): Promise<ToolDatasetItem[]> {
  const tools = await prisma.tool.findMany({
    where: { status: ToolStatus.active },
    orderBy: { updatedAt: "desc" },
  })
  return tools.map(normalizeTool)
}
