# 核心漏斗看板与一周追踪方案

## 1) 核心漏斗定义（结果页闭环）
- `search_submit`：用户发起搜索。
- `filter_apply`：结果页切换筛选条件。
- `refine_submit`：结果页通过 Refine 二次收敛。
- `compare_add`：把工具加入对比。
- `visit_official_site`：点击官网外链。

以上阶段已在前端通过 `metadata.action / metadata.entry / metadata.target` 做统一映射，并写入 `user_events`。

## 2) 一周看板接口
- 新增接口：`GET /api/track/funnel?days=7`
- 返回内容：
  - `stages`：每个漏斗阶段总量。
  - `daily`：过去 N 天按天分桶的各阶段计数。
  - `dropOff`：相邻阶段流失量与流失率。
  - `biggestDropOff`：最大 drop-off 节点。

> 说明：接口默认需要登录态（与现有 track debug 口径一致），用于内部看板与复盘。

## 3) 小步快改实验（按最大 drop-off 启动）
每周按 `biggestDropOff` 自动挑选 1-2 个实验，优先不改架构、可快速灰度：

### 实验 A：Search → Filter drop-off 过大
- 假设：用户不知道筛选能快速收敛。
- 改动：首屏结果上方增加“推荐筛选组合”chips（免费优先 / 新手友好 / 中文支持）。
- 指标：`filter_apply / search_submit` 周环比提升 ≥ 10%。

### 实验 B：Refine → Compare drop-off 过大
- 假设：用户 refine 后没有形成候选集合。
- 改动：refine 后首屏卡片增加“先加入 2 个对比”提示文案。
- 指标：`compare_add / refine_submit` 周环比提升 ≥ 8%。

## 4) 复盘节奏
- 每周一拉取最近 7 天数据。
- 若样本量不足（`search_submit < 100`），只观察趋势不下结论。
- 连续两周同节点为最大 drop-off，优先进入下一轮产品改造。
