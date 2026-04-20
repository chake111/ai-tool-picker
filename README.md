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


## Google 登录配置 / Google Sign-In setup

如果你启用了 NextAuth 的 Google 登录，请先在 `ui/.env.example` 对应的环境变量中完成配置（实际部署请在 `.env.local`、Vercel 或 CI Secret 中填写真实值，不要提交真实密钥）。

### 必填环境变量

- `GOOGLE_CLIENT_ID=`
- `GOOGLE_CLIENT_SECRET=`
- `NEXTAUTH_URL=`（生产环境必须是完整可访问域名，例如 `https://your-domain.com`）
- `NEXTAUTH_SECRET=`

### Google 回调地址（NextAuth）

Google OAuth 的回调路径固定为：

- `{NEXTAUTH_URL}/api/auth/callback/google`

示例：

- 本地开发：`http://localhost:3000/api/auth/callback/google`
- 生产环境：`https://xxx.vercel.app/api/auth/callback/google`

> 重要：Google Cloud Console 中 **Authorized redirect URIs** 必须与上面实际使用的回调地址逐字符一致（包括协议 `http/https`、端口、路径，以及是否带尾部斜杠）。任意一个字符不同都可能导致登录失败。

### 常见错误排查

1. `redirect_uri_mismatch`
   - 第一步：在浏览器地址栏（或开发者工具 Network）查看请求里实际发送的 `redirect_uri`。
   - 第二步：逐字符对照 Google Cloud Console 的 **Authorized redirect URIs**。
   - 第三步：确认 `NEXTAUTH_URL` 是否与当前访问域名一致（本地/预览/生产不要混用）。
   - 第四步：确认是否误加或漏掉尾部斜杠、端口号或协议。

## 推荐实验参数 / Recommendation experiment controls

`/api/recommend` 支持通过请求体传入 `ranker` 参数做灰度与 A/B：

```json
{
  "query": "我要做融资路演PPT",
  "locale": "zh",
  "ranker": "v1"
}
```

- `ranker=v1`：基线排序（语义 + 用户行为 + 业务规则）
- `ranker=v2`：在基线上增加场景感知加权（如 coding / presentation / design / writing）

接口响应会返回实验透传头，便于前端打点和看板归因：

- `x-recommend-ranker`
- `x-recommend-scenario`
- `x-recommend-request-id`

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

## 推荐质量运维说明 / How to monitor recommendation quality

### 1) 漏斗与核心指标（按 locale / scenario 分桶）

当前打点链路：**impression → click → favorite**。  
每条事件会附带 `locale`、`scenario`、`ranker`、`requestId` 元信息。

建议在看板按 `locale + scenario + ranker` 维度展示以下指标：

- **CTR** = `click / impression`
- **收藏率（Favorite Rate）** = `favorite / click`
- **首位点击率（First-position Click Rate）** = `rank=1 click / click`
- **工具覆盖率（Tool Coverage）** = `unique(tool_id) / search`
- **多样性指数（Diversity Index）** = `unique(tool_id) / impression`

可通过调试接口 `/api/track/debug` 查看聚合后的 `metricsByBucket`（仅在 `TRACK_DEBUG_API_ENABLED=true` 且登录态时可访问）。

### 2) 离线回归集与 CI 守门

- 样本集：`ui/evals/recommendation-samples.json`
  - 字段包含：`query` + `expectedTools` + `expectedTags`
- 回归脚本：`npm run eval:recommend`
- CI：`.github/workflows/quality-gate.yml` 已接入 `Recommendation regression` 步骤

目标：在规则和排序逻辑变更时，快速发现“预期工具不进 top3”或“标签偏移”问题。

### 3) 回滚策略

当质量指标在某个 bucket 明显退化（例如 CTR 下滑 > 15%）时，按如下顺序处理：

1. 将实验流量切回 `ranker=v1`（停止 `v2` 灰度）。
2. 对异常 `locale/scenario` 单独降级（仅保留基线排序）。
3. 保留事件与 requestId，复盘具体 query 样本，修正规则后重新灰度。
