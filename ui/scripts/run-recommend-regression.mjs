import fs from "node:fs"
import path from "node:path"

const repoRoot = path.resolve(process.cwd())
const samplePath = path.join(repoRoot, "evals", "recommendation-samples.json")
const toolsPath = path.join(repoRoot, "data", "tools.json")

const samples = JSON.parse(fs.readFileSync(samplePath, "utf-8"))
const tools = JSON.parse(fs.readFileSync(toolsPath, "utf-8")).filter((tool) => tool.status === "active")

const scoreTool = (query, tool) => {
  const normalizedQuery = String(query).toLowerCase()
  const corpus = [tool.name, tool.desc, ...(tool.tags ?? []), ...(tool.use_cases ?? [])].join(" ").toLowerCase()
  let score = 0
  if (/(ppt|slides|演示|路演)/i.test(normalizedQuery) && /(gamma|tome|beautiful\.ai|演示)/i.test(corpus)) score += 5
  if (/(code|coding|编程|写代码|接口|test|测试)/i.test(normalizedQuery) && /(copilot|chatgpt|开发者|代码)/i.test(corpus)) score += 5
  if (/(design|image|海报|图像|插画)/i.test(normalizedQuery) && /(midjourney|设计师|图像)/i.test(corpus)) score += 5
  if (/(write|writing|总结|写作|邮件)/i.test(normalizedQuery) && /(notion ai|chatgpt|写作|办公)/i.test(corpus)) score += 5
  if (normalizedQuery.includes(tool.name.toLowerCase())) score += 3
  return score
}

let failed = 0
for (const sample of samples) {
  const ranked = tools
    .map((tool) => ({ tool: tool.name, score: scoreTool(sample.query, tool), tags: tool.tags ?? [] }))
    .sort((a, b) => b.score - a.score)

  const top3 = ranked.slice(0, 3)
  const hasExpectedTool = top3.some((item) => sample.expectedTools.some((expected) => expected.toLowerCase() === item.tool.toLowerCase()))
  const hasExpectedTag = top3.some((item) => item.tags.some((tag) => sample.expectedTags.includes(tag)))

  if (!hasExpectedTool || !hasExpectedTag) {
    failed += 1
    console.error(`[FAIL] ${sample.id}: top3=${top3.map((item) => `${item.tool}(${item.score})`).join(", ")}`)
  } else {
    console.log(`[PASS] ${sample.id}: top3=${top3.map((item) => item.tool).join(", ")}`)
  }
}

if (failed > 0) {
  console.error(`recommendation regression failed: ${failed} sample(s)`) 
  process.exit(1)
}

console.log(`recommendation regression passed: ${samples.length} sample(s)`)
