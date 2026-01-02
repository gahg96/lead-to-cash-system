# Lead-to-Cash 系统部署指南

本指南将帮助您将系统部署到互联网上，以便公开访问。

由于系统包含前后端和数据库，建议采用以下组合进行免费/低成本部署：
*   **前端**: Vercel (Next.js 最佳拍档)
*   **数据库**: Neon / Supabase (提供免费 PostgreSQL)
*   **后端**: Render / Railway (支持 Node.js 服务)

---

## 1. 准备数据库 (PostgreSQL)

后端需要一个云端数据库。

1.  注册 [Neon](https://neon.tech) 或 [Supabase](https://supabase.com)。
2.  创建一个新项目 (Project)。
3.  获取 **Connection String** (连接字符串)，格式如下：
    `postgresql://user:password@host:port/database?sslmode=require`
    *记下这个字符串，后续配置后端时需要。*

---

## 2. 部署后端 (Backend)

推荐使用 [Render](https://render.com)。

1.  注册 Render 并连接您的 GitHub 账号。
2.  点击 **"New +"** -> **"Web Service"**。
3.  选择您刚才推送的仓库 `lead-to-cash-system`。
4.  **配置服务**:
    *   **Name**: `l2c-backend`
    *   **Root Directory**: `backend` (非常重要！因为是 Monorepo)
    *   **Runtime**: Node
    *   **Build Command**: `npm install && npx prisma generate && npm run build`
    *   **Start Command**: `npm run start:prod`
5.  **环境变量 (Environment Variables)**:
    添加以下变量：
    *   `DATABASE_URL`: (步骤1中获取的数据库连接串)
    *   `JWT_SECRET`: (任意长字符串，用于加密，如 `my-super-secret-key-2026`)
    *   `PORT`: `10000` (Render默认端口)
6.  点击 **"Create Web Service"**。
    *   等待部署完成后，Render 会给您一个 URL，例如 `https://l2c-backend.onrender.com`。
    *   *记下这个 URL。*

---

## 3. 部署前端 (Frontend)

推荐使用 [Vercel](https://vercel.com)。

1.  注册 Vercel 并连接 GitHub。
2.  点击 **"Add New..."** -> **"Project"**。
3.  导入仓库 `lead-to-cash-system`。
4.  **配置项目**:
    *   **Framework Preset**: Next.js (通常会自动识别)
    *   **Root Directory**: 点击 Edit，选择 `frontend` 目录。
5.  **环境变量 (Environment Variables)**:
    添加：
    *   `NEXT_PUBLIC_API_URL`: (步骤2中获取的后端 URL，如 `https://l2c-backend.onrender.com`)
        *注意：不要带尾部的斜杠 `/`*
6.  点击 **"Deploy"**。

---

## 4. 验证与调试

1.  访问 Vercel 生成的前端域名（如 `https://lead-to-cash.vercel.app`）。
2.  尝试登录 (默认账号需先通过后台或API注册，或者在数据库直接插入 Admin 用户)。
    *   *提示*: 初始化数据库种子数据 (Seed) 可以通过在后端 Build Command 中增加 `npx prisma db push` 来实现表结构同步。

### 常见问题
*   **跨域错误 (CORS)**: 如果前端报错 CORS，需要在后端 `main.ts` 中配置 `app.enableCors()` 允许 Vercel 的域名。
*   **数据库连接失败**: 检查 `DATABASE_URL` 是否正确，Render 的 IP 是否被数据库白名单限制 (Neon/Supabase 通常允许所有 IP)。

---

祝您部署顺利！
