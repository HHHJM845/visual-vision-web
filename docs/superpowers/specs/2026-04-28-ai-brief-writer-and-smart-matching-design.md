# AI 需求写手 + 智能匹配 设计文档

## Context

当前平台是纯撮合市场，AI 生成工作完全依赖 AIGCer 本地完成。两个最高价值的 AI 嵌入点：

1. **需求写手**：Client 往往无法清晰描述创意需求，导致沟通成本高、应征质量差。AI 帮 Client 把粗糙想法转化为结构化委托描述。
2. **智能匹配**：委托发布后，AIGCer 靠自己刷列表，效率低。AI 分析委托需求与 AIGCer 能力的匹配度，为 Client 推荐最合适的应征者。

使用 DeepSeek API（国内可访问、成本低）。新 UI 组件严格沿用现有 shadcn/ui 风格：青蓝主色、圆角按钮、白底卡片。

---

## 功能一：AI 需求写手

### 入口

`CommissionNew` 页面，"项目描述"Textarea 右上角新增「✨ AI 优化」按钮（`variant="outline"` + 青蓝色图标）。

### 交互流程

1. Client 点击「✨ AI 优化」
2. 弹出 shadcn `Dialog`，标题「AI 帮你写需求」
3. Dialog 内有一个 `Textarea`，placeholder：「用一句话说说你要什么？例如：我需要一个赛博朋克风格的品牌海报」
4. 点击「生成描述」按钮，调用 DeepSeek，loading 状态显示旋转图标
5. 返回结果展示在浅灰背景卡片中，包含结构化描述（项目背景、风格要求、用途、交付要求）
6. 底部两个按钮：「使用这个描述」（填入 Textarea 并关闭 Dialog）、「重新生成」（再调一次 API）

### DeepSeek Prompt 设计

```
你是一个创意委托平台的需求顾问。用户想发布一个 AI 生成内容的委托项目。

用户的粗略想法：{userInput}

请根据以下结构生成一段专业的项目描述（200字以内，中文）：
- 项目背景：这是什么项目，用于什么场景
- 风格要求：期望的视觉风格、色调、情绪
- 用途说明：商业/个人，如何使用
- 交付要求：格式、尺寸或其他具体要求

只输出描述正文，不要加任何标题或前缀。
```

---

## 功能二：智能匹配

### 入口

`CommissionDetail` 页面，应征者列表区域顶部新增 Tab 切换。

### 交互流程

1. 委托详情页应征者区域顶部，新增两个切换按钮（outline Button 组合）：「全部应征」/ 「✨ 智能推荐」
2. 默认显示「全部应征」（保持现有行为）
3. Client 点击「✨ 智能推荐」：
   - 若尚未计算：触发前端调用 DeepSeek，传入委托描述 + 所有应征者的 bio/styles/tools
   - loading 状态：列表区显示 spinner + 「AI 正在分析匹配度...」
   - 返回结果：应征者卡片右上角显示匹配度 Badge（如「匹配 92%」，青蓝色），按匹配度降序排列
4. 匹配结果缓存在组件 state 中，切换 Tab 不重复调用

### DeepSeek Prompt 设计

```
你是一个创意委托平台的智能匹配系统。

委托项目描述：
{commissionDescription}
委托分类：{category}

以下是应征者列表（JSON格式）：
{applicantsJson}
每个应征者包含：id, bio（个人简介）, styles（擅长风格列表）, tools（使用工具列表）

请为每个应征者打一个匹配度分数（0-100的整数），基于其风格、工具与委托需求的契合程度。
只输出 JSON 数组，格式：[{"id": "...", "score": 85}, ...]
不要有任何其他文字。
```

### 数据来源

- 委托描述：`commission.description` + `commission.category`
- 应征者信息：从 `applications` 表关联 `profiles` 表取 `bio`、`styles`、`tools`
- 匹配分数：前端临时计算，不写入数据库

---

## 技术架构

### 新增文件

**`src/services/aiService.ts`**
```typescript
// 两个导出函数：
enhanceBrief(roughIdea: string): Promise<string>
matchApplicants(commission: Commission, applicants: ApplicantWithProfile[]): Promise<{ id: string; score: number }[]>
```

**`src/hooks/useAIBrief.ts`** — 封装 loading/error 状态，供 CommissionNew 使用

**`src/hooks/useSmartMatch.ts`** — 封装 loading/error/cache 状态，供 CommissionDetail 使用

### 修改文件

- `src/pages/CommissionNew.tsx` — 添加「✨ AI 优化」按钮 + Dialog 组件
- `src/pages/CommissionDetail.tsx` — 添加 Tab 切换 + 匹配度 Badge
- `src/services/commissionService.ts` — 新增 `getApplicantsWithProfiles()` 方法，返回带 profile 的应征者列表

### 环境变量

```
VITE_DEEPSEEK_API_KEY=your_key_here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
```

> **安全说明**：`VITE_` 前缀变量会被打包进前端 bundle，Key 对用户可见。MVP 阶段可接受；生产环境应通过后端代理（如 Vercel Serverless Function）转发请求，前端不直接持有 Key。

### API 调用方式

DeepSeek 兼容 OpenAI 格式，使用 `fetch` 直接调用，模型选 `deepseek-chat`。

---

## 样式规范

遵循现有设计语言：
- AI 相关按钮：`variant="outline"` + `✨` emoji 前缀
- 匹配度 Badge：`bg-cyan-500 text-white` + `rounded-full`
- Dialog 内部：白底，padding p-6，结果卡片 `bg-muted rounded-lg p-4`
- Loading 状态：`Loader2` 图标（lucide-react）+ `animate-spin`
- 不引入任何新的 UI 组件库

---

## 验证方式

1. CommissionNew 页面点击「✨ AI 优化」，输入粗糙描述，确认 Dialog 弹出并返回结构化文本
2. 点击「使用这个描述」，确认文本正确填入 Textarea
3. CommissionDetail 页面切换到「✨ 智能推荐」，确认匹配度 Badge 显示且按分数排序
4. 网络错误时，确认有 toast 错误提示，不崩溃
5. 检查 API Key 不暴露在前端 bundle（通过 Network 面板确认请求头）
