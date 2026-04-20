# 组件视觉对照表（Baseline）

## 1) Design Tokens

| Token 分类 | Token | 值 / 语义 | 用途 |
|---|---|---|---|
| Spacing | `--space-1..8` | `4px` 到 `32px` | 页面/模块/按钮间距基线 |
| Radius | `--radius-xs/sm-token/md-token/lg-token` | `8/12/16/24px` | 卡片、胶囊、面板圆角 |
| Surface | `--surface-canvas/subtle/elevated/muted` | 画布、弱强调、浮层、浅灰底 | 页面背景与层级区分 |
| Border | `--border-default/strong/emphasis` | 默认、强分割、主色强调 | 交互边框与选中态 |
| Shadow | `--shadow-sm-token/md-token` | 轻微/中等阴影 | hover/elevated 状态 |
| Typography | `--font-title-xl/lg` `--font-body-md/sm` `--line-height-*` | 标题/正文尺寸与行高 | Hero、Section title、正文文本 |

## 2) 统一容器规范（home / compare / results）

| 组件域 | 容器规范 | 说明 |
|---|---|---|
| 页面级（全部） | `.app-page-container` | 统一宽度、左右留白、底部安全区（含底部 compare entry） |
| 面板级（全部） | `.app-panel` | 统一边框、圆角、阴影、surface |
| 弱强调面板 | `.app-panel-subtle` | Hero 区背景与弱强调边界 |
| 工具栏（compare/results） | `.app-toolbar` | 统一对齐策略与间距 |
| 列表交互项 | `.app-interactive` | hover 上浮 + 统一 focus-visible |

## 3) 交互状态规范

| 状态 | 规范 |
|---|---|
| 默认态 | `border-default + surface-elevated` |
| Hover | `translateY(-1px) + shadow-sm-token` |
| Focus | `2px ring + offset 2px` |
| Active/Selected | `border-emphasis + primary tint`（通过 `data-active=true`） |

## 4) CTA 层级规范

| 层级 | 组件策略 | 规则 |
|---|---|---|
| Primary（唯一主按钮） | 推荐主动作（如结果卡“加入对比”、底部“去对比”） | 只使用 `default` |
| Secondary | 辅助动作（访问官网、筛选 chip、清空等） | 统一 `outline` |
| Tertiary | 低优先级动作（移除、重置、收藏 icon quick action） | 统一 `ghost` |

## 5) 页面组件对照（后续开发基线）

| 页面 | 组件 | 容器 | 交互 | CTA |
|---|---|---|---|---|
| Home | `home-hero` | `.app-panel-subtle` | 标题/正文字号来自 typography token | 搜索主提交=Primary |
| Home | `home-quick-scenes` | `.app-chip` | `data-active` 选中态 + hover/focus 统一 | 场景切换=Secondary（chip） |
| Home | `home-results-preview` | `.app-panel` + 子卡 `.app-panel` | 卡片 hover 统一可复用 | 无主 CTA |
| Compare | `compare-toolbar` / `compare-table` / `compare-list` | `.app-toolbar` / `.app-panel` | 表格与列表卡状态统一 | 当前视图按钮=Primary；清空/移除=Secondary/Tertiary |
| Results | `results-toolbar` / `results-list` | `.app-toolbar` / `.app-panel` | 筛选 chip、结果卡 hover/focus 统一 | 每卡“加入对比”=Primary；官网/收藏=Secondary/Tertiary |

---

> 该文档作为 UI 视觉回归与新组件接入的默认标准。新增页面优先复用上述 token 与语义类，而不是再定义局部样式。
