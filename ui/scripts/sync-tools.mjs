#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import { PrismaClient, ToolStatus } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const filePath = path.resolve(process.cwd(), "data/tools.json")
  const raw = await fs.readFile(filePath, "utf-8")
  const tools = JSON.parse(raw)

  if (!Array.isArray(tools)) {
    throw new Error("data/tools.json must be an array")
  }

  for (const item of tools) {
    const status = item.status === "inactive" ? ToolStatus.inactive : ToolStatus.active
    await prisma.tool.upsert({
      where: { name: item.name },
      update: {
        desc: item.desc,
        tags: item.tags,
        useCases: item.use_cases,
        targetUsers: item.target_users,
        link: item.link,
        status,
      },
      create: {
        name: item.name,
        desc: item.desc,
        tags: item.tags,
        useCases: item.use_cases,
        targetUsers: item.target_users,
        link: item.link,
        status,
      },
    })
  }

  console.log(`Synced ${tools.length} tools from data/tools.json`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
