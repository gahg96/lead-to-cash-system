# Opportunity Module Guide (商机管理模块指南)

本文档分为两部分：
1.  **现有功能拆解**：详细列出当前商机管理模块包含的所有特性。
2.  **从零构建提示词**：如果您需要从头开发一个一模一样的商机模块，应该如何向 AI 提问。

---

## 📅 Part 1: 现有功能详细拆解 (Current Features)

### 1. 商机列表页 (`/opportunities`)
*   **Analytics Dashboard (分析看板)**：
    *   顶部集成了一组可视化图表（引用自 `OpportunityAnalytics` 组件）。
    *   支持点击图表区块进行快速过滤（如点击 "Lost" 饼图块，列表只显示丢单记录）。
*   **过滤与排序**：
    *   **Filters**: 支持按 `Source` (来源), `Status` (状态), `Sales Owner` (销售负责人) 过滤。
    *   **Sorting**: 表头点击排序，支持多层级字段（如 `customer.companyName`）和计算字段（如 `winningPrice`）。
*   **主要字段展示**：
    *   ID/编号 (Format: `#...`)
    *   客户名称 (Client)
    *   商机标题 (Project)
    *   **预算金额 (Estimated Value)**: 预期项目总值。
    *   **中标金额 (Winning Price)**: 关联的 Won 状态的投标金额。
    *   商机来源 (Source) & 销售负责人 (Sales Owner)
    *   状态徽章 (Status Badge)

### 2. 新建商机页 (`/opportunities/new`)
一个功能极其丰富的**分步表单**，集成在 `Tabs` 中。

*   **草稿自动保存 (Auto-save Draft)**：
    *   表单内容实时保存到 `localStorage`。
    *   页面加载时若检测到草稿，会弹出提示栏供用户选择 "恢复" 或 "忽略"。
*   **分步标签页 (Tabs Workflow)**：
    1.  **客户信息 (Customer)**：
        *   支持 **Select Existing** (下拉选择现有客户) 或 **Create New** (填表新建客户) 两种模式切换。
    2.  **商机概况 (Opportunity)**：
        *   填写 Title, Value, Probability (几率), Source, Close Date, Stage 等。
    3.  **企业/竞争 (Enterprise)**：
        *   填写 Competitors (竞争对手), Decision Makers (决策人)。
    4.  **财务测算 (Financials)**：
        *   填写 Project Budget, Cost Breakdown (Labor, Business, Other), Gross Profit (自动计算毛利), Margin (自动计算毛利率)。
    5.  **详细描述 (Description)**：
        *   集成 **RichTextEditor** (富文本编辑器) 用于输入详细需求。
        *   文件上传 (File Upload) 区域，支持拖拽上传。

---

## 🚀 Part 2: 从零构建提示词 (Zero-to-Hero Prompt)

### 📋 Master Prompt (复制给 AI)

> **角色设定**：
> 你是一个精通 B2B 销售流程和 CRM 系统开发的全栈专家。
>
> **任务目标**：
> 请构建一个功能完备的“商机管理模块”。该模块是 L2C (Lead-to-Cash) 系统的核心入口。
>
> **核心页面结构**：
> 1.  **列表页 (`/opportunities/page.tsx`)**
> 2.  **新建/编辑页 (`/opportunities/new/page.tsx`)**
>
> **详细功能要求**：
>
> ### 1. 列表页 (List View)
> *   **UI 组件**：使用 Shadcn `Table`，配合 `Card` 作为容器。
> *   **分析看板集成**：在列表上方预留位置，放置 `OpportunityAnalytics` 组件（包含 Pipeline 漏斗图、来源分布饼图）。
> *   **筛选联动**：点击上方的分析图表，应能直接过滤下方的列表数据（例如点击“输单”饼图，列表只显示输单的商机）。
> *   **智能排序**：支持按“预算金额”和“中标金额”排序。注意中标金额可能来源于关联的 `Procurement` 表，需做数据处理。
>
> ### 2. 新建页 (Creation Flow)
> *   **布局**：使用 Shadcn `Tabs` 根据业务维度将长表单拆分为 5 个标签页：
>     *   `Customer`: 支持“选择现有客户”和“新建快捷客户”的 Toggle 切换。
>     *   `Opportunity`: 核心字段（金额、预计成交日、阶段）。
>     *   `Enterprise`: 竞争对手分析、决策链分析。
>     *   `Financials`: 成本与利润测算（需在前端自动计算 Gross Profit = Budget - Costs）。
>     *   `Description`: 富文本描述 + 附件上传。
> *   **体验优化 (关键)**：
>     *   **草稿箱功能**：监听表单变化，实时写入 `localStorage`。用户意外刷新或关闭回来后，提示“检测到未保存草稿，是否恢复？”
>     *   **拖拽上传**：在描述页支持 Drag & Drop 文件上传。
>
> **数据模型 (Schema)**：
> 请参照以下核心字段结构：
> *   `customer`: Relation (One-to-Many)
> *   `estimatedValue`: Float
> *   `probability`: Int (0-100)
> *   `salesStage`: Enum (Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost)
> *   `financials`: JSON/Embedded (LaborCost, BusinessCost, etc.)
>
> **技术栈**：
> *   React Hook Form + Zod (验证)
> *   TipTap (富文本)
> *   Lucide Icons
