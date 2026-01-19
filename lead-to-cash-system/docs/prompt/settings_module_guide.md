# Settings Module Guide (配置管理模块指南)

本文档分为两部分：
1.  **现有功能拆解**：详细列出客户管理、厂商管理和内部人员管理包含的所有特性。
2.  **从零构建提示词**：如果您需要从头开发一个一模一样的配置模块，应该如何向 AI 提问。

---

## 📅 Part 1: 现有功能详细拆解 (Current Features)

### 1. 客户管理 (`/customers`)
*   **功能**：基础的 CRUD (增删改查)。
*   ** UI**：简单的表格展示，包含 `CustomerDialog` 用于新建和编辑。
*   **关键字段**：公司名、行业、规模、主要联系人。

### 2. 厂商管理 (`/settings/vendors`)
*   **功能**：管理供应链合作伙伴。
*   **特色 UI (由 Grouping Logic 驱动)**：
    *   **品牌分组 (Brand Grouping)**：列表并非扁平展示，而是按 `Vendor.Brand` 进行分组（如 "Dell", "Lenovo"）。
    *   **层级展示**：如果厂商有父级 (Parent)，会在名字下方显示 "↳ 属: ParentName"。
*   **字段**：名称、品牌、类型（标签式 Badge）、行业、区域。

### 3. 内部人员管理 (`/settings/users`)
*   **功能**：管理系统登录用户及权限。
*   **安全逻辑**：
    *   **防删保护**：对于 `admin` 账号，前端直接拦截删除操作，提示“不能删除系统预设管理员”。
*   **字段**：用户名、显示名称、角色 (Role Badge)、创建时间。

---

## 🚀 Part 2: 从零构建提示词 (Zero-to-Hero Prompt)

### 📋 Master Prompt (复制给 AI)

> **角色设定**：
> 你是一个精通后台管理系统 (Admin Portal) 开发的前端专家。
>
> **任务目标**：
> 请开发 Lead-to-Cash 系统的 "Settings / Master Data" 模块。包含三个子页面：**客户管理**、**厂商管理** 和 **用户管理**。
>
> **通用要求**：
> *   所有页面均需包含搜索框 (`Input`) 和新建按钮 (`Button` with `Dialog`).
> *   使用 Shadcn `Table` 组件。
> *   操作列需包含“编辑”和“删除”图标按钮。
>
> **子模块 1：厂商管理 (Vendor Management)**
> *   **UI 特性**：请实现 **按品牌分组 (Group by Brand)** 的表格视图。
>     *   表格中不需要显示 Brand 列，每组厂商上方插入一个 Title Row 显示品牌名。
> *   **数据处理**：前端获取 flat array 后，按 `brand` 字段进行 reduce 分组。
>
> **子模块 2：用户管理 (User Management)**
> *   **安全逻辑**：此处需要前端拦截：当用户尝试删除 `username === 'admin'` 的记录时，弹出 `alert` 警告并阻止请求。
> *   **角色展示**：Role 字段请使用 `Badge` 组件（Admin: Red, User: Blue）。
>
> **子模块 3：客户管理 (Customer Management)**
> *   标准 CRUD 即可。字段包括：公司名、行业、规模、联系人。
>
> **技术栈**：
> *   `lucide-react` (Pencil, Trash2, Building2)
> *   `shadcn/ui` (Dialog, Input, Table)
