# 应用模块提示词参考手册 (Module Prompts Reference)

本文档整理了系统核心模块的“最佳实践提示词”。您可以直接复用或修改这些提示词，以便在后续开发中快速维护或扩展相应功能。

---

## 1. 发票管理模块 (Invoice Management)

**功能定位**：财务人员查看、管理和追踪发票。
**核心特性**：树状层级展示（合同 -> 发票）、状态可视化、智能排序。

### 📋 Master Prompt (功能构建提示词)

> **目标**：重构发票列表页 (`/finance/invoices`)，实现以“合同”为中心的树状管理视图。
>
> **UI 结构要求**：
> 1.  **层级表格 (Tree Table)**：
>     *   **父节点 (Parent Row)**：代表“合同/项目”。显示合同名称、客户名称、合同总金额。支持展开/折叠。
>     *   **子节点 (Child Row)**：代表“具体发票”。显示发票号、开票金额、状态徽章、开票日期。
> 2.  **默认交互**：
>     *   默认展开所有组。
>     *   点击父行整行即可切换展开状态。
>
> **数据处理逻辑**：
> *   **分组键**：基于 `contract.id` 进行分组。
> *   **排序逻辑**：
>     *   **组排序**：按组内最新的一张发票日期降序排列（确保最近有活动的项目排在前面）。
>     *   **组内排序**：按发票日期降序排列。
> *   **搜索过滤**：
>     *   搜索框支持输入：发票号、合同名、客户名。
>     *   **智能展开**：当搜索命中子节点时，自动显示并展开对应的父节点。
>
> **视觉样式**：
> *   状态列请使用 Badge 组件，颜色映射：
>     *   Issued (已开票): Default/Blue
>     *   Paid (已收款): Success/Green
>     *   Cancelled (作废): Outline/Gray
>     *   Overdue (逾期): Destructive/Red

---

## 2. 项目交付仪表盘 (Project Delivery Dashboard)

**功能定位**：项目经理监控整体项目健康度、利润及资源负载。
**核心特性**：可视化图表、实时 KPI 计算。

### 📋 Master Prompt (功能构建提示词)

> **目标**：开发项目交付仪表盘 (`/delivery`)，集成可视化图表与关键指标。
>
> **关键指标卡片 (KPI Cards)**：
> 1.  **平均利润率 (Avg Margin)**：基于所有活跃项目的 `(wonPrice - cost) / wonPrice` 动态计算。
> 2.  **待确认收入 (Pending Revenue)**：展示处于 `Verified` 状态里程碑的总金额。
> 3.  **团队负载 (Team Load)**：当前活跃项目数与总资源数的比率。
>
> **可视化图表 (Charts)**：
> *   请引入 `recharts` 库。
> 1.  **项目状态分布 (Pie Chart)**：展示各状态（执行中、验收中、运维）的项目数量占比。
> 2.  **利润率排行 (Bar Chart)**：横向条形图，列出利润率最高的 Top 5 项目。
>
> **数据获取**：
> *   修改后端 `projects.service.ts`，确保 `findAll` 接口返回 `fundTransactions` 和 `milestones` 数据，以便前端进行实时计算，而不是读取死数据。

---

## 3. 供应商管理 (Vendor Management)

**功能定位**：管理外部供应商库、评级及分类。
**核心特性**：Next.js Server Actions (CRUD)、弹窗表单、标签系统。

### 📋 Master Prompt (功能构建提示词)

> **目标**：实现供应商管理模块 (`/settings/vendors`)。
>
> **交互流程**：
> 1.  **列表视图**：展示供应商名称、服务类型（Tags）、评级（Star Rating）、状态。
> 2.  **新增/编辑**：使用 Shadcn UI `Dialog` 组件弹出表单。
> 3.  **删除**：需带二次确认 `AlertDialog`。
>
> **表单字段详情**：
> *   **Rating**：1-5 星评分组件。
> *   **Tags/Type**：多选标签（如：人力外包、云服务、硬件采购），需支持颜色区分。
> *   **Status**：Active (活跃) / Blocked (黑名单)。
>
> **技术要求**：
> *   使用 `Server Actions` 处理表单提交 (POST/PUT/DELETE)。
> *   提交成功后调用 `revalidatePath` 刷新列表，无需页面重载。

---

## 4. 全局侧边栏导航 (Sidebar Navigation)

**功能定位**：应用主导航。
**核心特性**：高亮逻辑（最长路径匹配）。

### 📋 Master Prompt (功能构建提示词)

> **目标**：优化左侧侧边栏 (`Sidebar.tsx`) 的路由高亮逻辑。
>
> **问题背景**：
> *   当前使用简单的 `startsWith` 匹配，导致访问 `/finance/invoices` 时，父级菜单 `/finance` 和子级菜单 `/finance/invoices` 同时高亮。
>
> **需求**：
> *   实现“最长匹配原则” (Longest Match Wins) 逻辑。
> *   计算当前 URL (`pathname`) 与所有菜单 `href` 的匹配长度。
> *   仅高亮**匹配长度最长**的那个菜单项。
> *   (可选) 增加对多语言 `t("nav.key")` 的支持，如果翻译缺失则回退到英文。

---

## 5. 财务资金大屏 (Finance Funds Dashboard)

**功能定位**：老板/财务总监视角的现金流监控。
**核心特性**：多币种、流水账本。

### 📋 Master Prompt (功能构建提示词)

> **目标**：构建财务资金管理页面 (`/finance`)。
>
> **核心组件**：
> 1.  **资产概览卡片**：
>     *   显示总资产（人民币 CNY）。
>     *   显示待入账（Pending Invoices）和待出账（Pending POs）。
> 2.  **交易流水账本 (Ledger Table)**：
>     *   列出所有收支明细。
>     *   **类型区分**：收入 (Income) 显示为绿色 (+)，支出 (Expense) 显示为红色 (-)。
>     *   **关联性**：每笔流水应能关联到对应的 Project 或 Logic Contract。
>
> **国际化 (i18n)**：
> *   金额显示需使用 `Intl.NumberFormat` 处理货币符号和千分位。
> *   所有文本标签需对接 `zh.json` 和 `en.json`。

---

**使用建议**：
当您需要修复 Bug 或增加新功能时，可以复制上述对应模块的 "Master Prompt"，并在其基础上添加具体修改要求（如：“基于上述[项目交付仪表盘]的逻辑，请把饼图改为环形图...”）。这样能确保 AI 瞬间理解该模块的完整上下文。
