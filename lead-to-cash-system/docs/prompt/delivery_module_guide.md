# Project Delivery Module Guide (项目交付模块指南)

本文档分为两部分：
1.  **现有功能拆解**：详细列出项目交付模块包含的所有特性。
2.  **从零构建提示词**：如果您需要从头开发一个一模一样的交付模块，应该如何向 AI 提问。

---

## 📅 Part 1: 现有功能详细拆解 (Current Features)

### 交付仪表盘 (`/delivery`)
一个高度可视化的项目监控中心，核心在于**实时计算**而非简单的 CRUD。

*   **KPI 卡片 (实时计算)**：
    *   **Active Projects**: 活跃项目总数。
    *   **Avg Margin (平均利润率)**：
        *   逻辑复杂：遍历所有项目，计算 `(ContractValue - TotalCost) / ContractValue` 的平均值。
        *   成本包含：人工、外包、差旅、软硬件采购 以及 **资金交易 (Fund Transactions)**。
    *   **Team Load (团队负载)**：
        *   资源分配率的平均值。统计所有 `Resource` 的 `allocationPct`。
*   **可视化图表 (Recharts)**：
    *   **Status Distribution (饼图)**：项目状态分布 (Planning, Execution, Delivery)。
    *   **Margin Top 5 (条形图)**：利润率最高的 5 个项目排行。
*   **Engagement Table (项目列表)**：
    *   展示项目基础信息。
    *   **Resources Column**: 使用重叠头像 (Avatar Stack) 展示参与该项目的成员首字母。

---

## 🚀 Part 2: 从零构建提示词 (Zero-to-Hero Prompt)

### 📋 Master Prompt (复制给 AI)

> **角色设定**：
> 你是一个精通数据可视化和 ERP 业务逻辑的前端专家。
>
> **任务目标**：
> 请开发“项目交付仪表盘 (`/delivery/page.tsx`)”。这是 PMO (项目管理办公室) 监控项目健康度的核心页面。
>
> **核心功能要求**：
>
> ### 1. 复杂 KPI 计算 (Frontend Calculation)
> *   由于后端接口返回的是全量 Project 对象（包含 `contract`, `fundTransactions`, `resources`），请在前端 `useEffect` 或渲染时计算以下指标：
>     *   **平均利润率 (Avg Margin)**：
>         *   公式：`Sum((WonPrice - TotalCost) / WonPrice) / ProjectCount`
>         *   **Costs** 包括字段：`laborCost`, `outsourceCost`, `travelCost`, `softwareCost` 以及 `fundTransactions` 中所有非归档支出的总和。
>     *   **团队负载 (Team Load)**：
>         *   统计所有项目中 `resources` 数组里的 `allocationPct` 总和，除以涉及的唯一用户数。
>
> ### 2. 可视化图表 (Recharts)
> *   **项目状态分布 (Pie Chart)**：自定义颜色 (Blue/Green/Yellow/Purple)，带 Legend。
> *   **利润率排行 (Bar Chart)**：水平或垂直条形图，列出 Margin 最高的 Top 5 项目。Tooltip 需显示项目全名。
>
> ### 3. 项目列表 (Interactive Table)
> *   **字段**：项目名、客户、状态、起止时间、**资源组**。
> *   **资源组 (Resources)**：请实现一个“头像堆叠”效果 (Avatar Group)。
>     *   只显示圆形头像（背景色随机或固定），显示用户首字母。
>     *   鼠标悬停显示全名。
>
> **数据模型 (Schema)**：
> 假设 `Project` 对象包含：
> *   `status`: Enum (Initialization, Planning, Execution...)
> *   `resources`: Array<{ user: { displayName }, allocationPct }>
> *   `fundTransactions`: Array<{ amount, type: 'EXPENSE' }>
>
> **技术栈**：
> *   `recharts` (必须)
> *   `lucide-react`
> *   `shadcn/ui` (Card, Table, Badge)
