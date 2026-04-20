# AI Tool Picker

在几秒内找到最合适的 AI 工具  
Find the right AI tool in seconds

AI Tool Picker 可以根据你的具体任务，快速推荐最适合的 AI 工具——无论是写代码、做 PPT、写作，还是数据分析。  
AI Tool Picker helps you quickly choose the best AI tool for your task — whether it's coding, making PPTs, writing, or data analysis.

## 功能 / What it does

- 输入你的需求 → 即可获得 AI 工具推荐  
  Input your goal → get recommended AI tools instantly  

- 每个推荐都会附带清晰的理由说明  
  Each recommendation includes a clear reason  

- 支持多个工具对比，辅助决策  
  Compare tools before deciding  

- 支持收藏与历史记录，方便回看  
  Save favorites and track history  

## 使用场景 / Example use cases

- “做 PPT” → Gamma, Tome, Beautiful.ai  
- “写代码” → ChatGPT, GitHub Copilot, Tabnine  
- “数据分析” → ChatGPT + Python  

## 技术栈 / Tech Stack

Next.js · TypeScript · Tailwind CSS · NextAuth · PostgreSQL · GLM-4-Flash

## 工具库维护流程 / Tool library maintenance

以下步骤用于新增工具、更新标签与重建向量（离线 embedding）：

1. 编辑 `ui/data/tools.json`：
   - 新增工具（name/desc/tags/use_cases/target_users/link/status）
   - 或更新已有工具标签与描述
2. 同步到数据库：
   ```bash
   cd ui
   npm run tools:sync
   ```
3. 重建工具向量（建议由 CI/定时任务触发，也可手动执行）：
   ```bash
   cd ui
   npm run tools:embed
   ```
4. 推荐接口会直接读取 `tool_embeddings` 的持久化向量，并在外部 embedding API 超时/失败时，回退到本地缓存的查询向量。

> 说明：`tools:embed` 默认使用 `text-embedding-3-small`。可通过环境变量 `EMBEDDING_MODEL=embedding-3` 切换到智谱向量模型。

## 规划 / Roadmap

- 增加更多工具分类 / More tool categories  
- 提供更细化的场景推荐 / Scenario-based recommendations  
- 优化整体 UI 体验 / Better UI experience  
