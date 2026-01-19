# Finance Module Guide (财务管理模块指南)

本文档分为两部分：
1.  **现有功能拆解**：详细列出财务模块（发票 + 资金）包含的所有特性。
2.  **从零构建提示词**：如果您需要从头开发一个一模一样的财务模块，应该如何向 AI 提问。

---

## 📅 Part 1: 现有功能详细拆解 (Current Features)

### 1. 发票管理 (`/finance/invoices`)
*   **Tree Table View (树状列表)**：
    *   **核心逻辑**：以“合同”为父节点，“发票”为子节点进行分组展示。
    *   **智能分组**：无合同的发票自动归入“无关联合同”组。
    *   **展开/折叠**：支持点击行展开子项。默认全部展开。
*   **交互细节**：
    *   **搜索联动**：搜索发票号时，能自动定位并高亮所在的父合同组。
    *   **状态徽章**：区分 Draft, Issued, Paid, Overdue 等状态。

### 2. 资金管理 (`/finance/funds`)
*   **资金流水账本 (Ledger)**：
    *   展示每一笔资金进出 (Advance/Payout/Collection)。
    *   **字段**：类型、描述、关联项目、金额（区分正负或借贷）、状态。
*   **Dashbaord KPI**：
    *   **Total Capital Occupied (资金占用)**：计算所有 ACTIVE 状态的垫资总额，高亮显示（红色），提示风险。

---

## 🚀 Part 2: 从零构建提示词 (Zero-to-Hero Prompt)

### 📋 Master Prompt (复制给 AI)

> **角色设定**：
> 你是一个精通企业财务系统的全栈专家。
>
> **任务目标**：
> 请开发 "Lead-to-Cash" 系统的**财务模块**。该模块包含两个核心子系统：**发票管理** 和 **资金管理**。
>
> **子系统 1：发票管理 (`/finance/invoices`)**
> *   **UI 结构**：请实现一个 **Tree Table (树形表格)**。
>     *   **Parent Row (合同层)**：展示合同号、客户名、合同总金额。
>     *   **Child Row (发票层)**：展示发票号、金额、状态、开票日期。
> *   **核心逻辑**：
>     *   前端获取扁平的 `invoices` 数组，请使用 JavaScript `reduce` 将其按 `contract.id` 分组。
>     *   组内排序：按发票日期降序。
>     *   组间排序：按组内最新发票日期降序。
>
> **子系统 2：资金管理 (`/finance/funds`)**
> *   **目标**：监控项目垫资和回款情况。
> *   **Dashboard**：
>     *   **资金占用卡片**：统计所有 `type='ADVANCE'` 且 `status='ACTIVE'` 的交易总额。
> *   **列表展示**：
>     *   展示最近的 50 条交易记录。
>     *   如果 `transaction.project` 存在，显示项目描述；否则显示 "-"。
>
> **技术细节**：
> *   **金额格式化**：所有金额显示必须使用 `Intl.NumberFormat('zh-CN')`，保留两位小数。
> *   **Badge 样式**：
>     *   Draft: Gray
>     *   Issued: Blue
>     *   Paid: Green
>     *   Overdue: Red
