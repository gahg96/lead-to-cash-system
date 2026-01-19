# Contracts Module Guide (合同管理模块指南)

本文档分为两部分：
1.  **现有功能拆解**：详细列出当前合同管理模块包含的所有特性。
2.  **从零构建提示词**：如果您需要从头开发一个一模一样的合同模块，应该如何向 AI 提问。

---

## 📅 Part 1: 现有功能详细拆解 (Current Features)

### 1. 合同列表页 (`/contracts`)
*   **Analytics Dashboard (分析看板)**：
    *   顶部集成了一组可视化图表（引用自 `ContractAnalytics` 组件），展示合同状态分布等。
    *   **过滤器集成**：支持按 `Status`（状态）和 `Drafter`（起草人）进行过滤。
*   **列表视图**：
    *   **字段展示**：合同编号、客户名称、关联商机标题、中标金额 (Won Price)、状态徽章。
    *   **删除功能**：带有 `AlertDialog` 二次确认的删除操作。
    *   **搜索**：支持搜索合同号、客户名或商机标题。
    *   **排序**：支持多维度排序。

### 2. 合同详情页 (`/contracts/[id]`)
一个极度复杂详情页，集成了详情展示、编辑、里程碑管理、文档上传和项目初始化。

*   **状态管理 (Status Lifecycle)**：
    *   支持强制修改状态 (Force Update Status)。
    *   **状态流转**：Draft -> CustomerReview -> InternalReview -> CustomerSeal -> InternalSeal -> Signed -> Terminated。
*   **富文本与自动保存**：
    *   **风险评估 (Risk Assessment)**：使用 `Textarea`，支持防抖 (Debounce) 自动保存功能。
*   **多标签页详情 (Tabs)**：
    *   **Tabs**: 概览 (Overview)、条款 (Terms)、里程碑 (Milestones)、文档 (Documents)、财务 (Financials)。
    *   **Milestones**: 支持增删改查 (CRUD) 里程碑，这是生成 Invoices 的基础。
    *   **Documents**: 支持文件上传。
*   **关键交互**：
    *   **Initialize Project**: 如果合同已签署，可以一键初始化项目（跳转到 `/delivery`）。
    *   **全局保存**: 一个大的 "Save Changes" 按钮用于提交除 Risk 以外的所有修改。

---

## 🚀 Part 2: 从零构建提示词 (Zero-to-Hero Prompt)

### 📋 Master Prompt (复制给 AI)

> **角色设定**：
> 你是一个精通企业级业务系统（ERP/CRM）的全栈架构师。
>
> **任务目标**：
> 请构建核心的“合同管理模块 (Contracts Module)”。该模块衔接了“商机 (Opportunity)”与“项目交付 (Delivery)”，是资金流转的关键节点。
>
> **核心页面结构**：
> 1.  **列表页 (`/contracts/page.tsx`)**
> 2.  **详情页 (`/contracts/[id]/page.tsx`)**
>
> **详细功能要求**：
>
> ### 1. 列表页 (List View)
> *   **UI 组件**：Shadcn `Table` + `Card`。
> *   **数据展示**：
>     *   必须展示关键财务信息：`Won Price` (中标金额) 或 `Total Contract Value`。
>     *   展示关联的 `Opportunity` 和 `Customer` 信息。
> *   **交互**：
>     *   **删除保护**：删除操作必须弹出 `AlertDialog` 确认，防止误删核心数据。
>     *   **高级搜索**：搜索框需同时检索“合同号”、“客户名”和“项目名”。
>
> ### 2. 详情页 (Detail View)
> *   **布局**：顶部为 Header（包含合同信息摘要、状态变更按钮、项目初始化按钮），下方为 `Tabs` 分栏。
> *   **分栏内容**：
>     *   `Overview`: 核心字段（起止日期、SLA、Liability 等）。支持“编辑模式”切换。
>     *   `Risk Assessment`: **关键特性**。一个大的文本域，要求实现**自动保存 (Auto-save)** 逻辑（用户停止输入 2秒后自动提交 PATCH 请求）。
>     *   `Milestones`: 一个内嵌的 CRUD 列表。允许用户添加“付款里程碑”（名称、金额、日期）。这是后续财务开票的数据源。
>     *   `Documents`: 文件上传区域。
> *   **业务逻辑 (关键)**：
>     *   **状态流转**：实现标准合同生命周期 (Draft -> Review -> Seal -> Signed)。
>     *   **项目初始化**：仅当状态为 `Signed` 时，显示 "Initialize Project" 按钮，点击后自动创建一个关联的 Project 记录并跳转。
>
> **数据模型 (Schema)**：
> *   `contractVersion`: 用于追踪变更（可选）。
> *   `riskAssessment`: Text (大字段)。
> *   `milestones`: Relation (One-to-Many)。
> *   `documents`: Relation (One-to-Many)。
>
> **技术栈**：
> *   `sonner` (Toast 通知)
> *   `lucide-react` (图标)
> *   `use-debounce` (或者手写 timeout 用于自动保存)
