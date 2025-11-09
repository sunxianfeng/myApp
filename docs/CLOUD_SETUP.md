# 云服务配置指南

本项目已迁移为使用云服务架构，替代了自建的PostgreSQL、Redis和MinIO。

## 架构概览

```
┌─────────────────────────────────────────────────┐
│          你的应用 (Docker容器)                    │
│  ┌──────────────┐       ┌──────────────┐        │
│  │  Frontend    │       │   Backend    │        │
│  │  (React)     │       │  (FastAPI)   │        │
│  └──────────────┘       └──────────────┘        │
└─────────────────────────────────────────────────┘
          ↓                   ↓
    ┌──────────────────────────────────────┐
    │     云服务 (互联网)                   │
    ├──────────────────────────────────────┤
    │ PostgreSQL ← Supabase                 │
    │ Redis ←────── Upstash                 │
    │ Storage ←──── Supabase Storage        │
    └──────────────────────────────────────┘
```

---

## 云服务商选择

| 服务 | 云服务商 | 免费额度 | 用途 |
|------|--------|--------|------|
| **数据库** | Supabase | 500MB | PostgreSQL 主数据库 |
| **缓存** | Upstash | 10k请求/天 | Redis 缓存 |
| **存储** | Supabase Storage | 1GB | 文件上传存储 |

---

## 详细配置步骤

### 1️⃣ Supabase 配置（数据库 + 存储）

#### 1.1 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 点击 **New Project**
3. 填写项目信息：
   - **Name**: `question-generator` (或你的项目名)
   - **Database Password**: 设置一个强密码（牢记！）
   - **Region**: 选择离你服务器最近的区域
4. 点击 **Create new project**（等待几分钟）

#### 1.2 获取数据库连接字符串

1. 项目创建完成后，进入 **Project Settings**
2. 点击 **Database** 选项卡
3. 找到 **Connection String**，选择 **PostgreSQL** 标签
4. 复制连接字符串，格式如下：

```
postgresql://postgres:[YOUR_PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

5. 将此字符串保存到你的 `.env` 文件中的 `DATABASE_URL`

#### 1.3 获取 API 密钥

1. 在 **Project Settings** 中点击 **API**
2. 找到 **Project URL** 和 **anon public** 密钥
3. 复制以下信息到 `.env` 文件：

```bash
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 1.4 创建存储桶

1. 在左侧菜单点击 **Storage**
2. 点击 **Create a new bucket**
3. 输入桶名称：`question-uploads`
4. 设置为 **Public** 以支持文件访问
5. 点击 **Create bucket**

---

### 2️⃣ Upstash 配置（Redis 缓存）

#### 2.1 创建 Redis 数据库

1. 访问 [Upstash Console](https://console.upstash.com)
2. 点击 **Create Database**
3. 选择：
   - **Database Name**: `question-redis` (或你的名称)
   - **Region**: 选择离服务器最近的区域
   - **Type**: Redis (默认)
4. 点击 **Create**

#### 2.2 获取 REST API 凭证

1. 进入刚创建的数据库
2. 点击 **REST API** 标签
3. 复制 **UPSTASH_REDIS_REST_URL**，格式如下：

```
https://default:[token]@[region]-[number].upstash.io
```

4. 将此 URL 保存到 `.env` 文件中的 `REDIS_URL`

**完整示例**:
```bash
REDIS_URL=https://default:AXY_1234567890abcdefg@us-east-1-1.upstash.io
```

---

## 环境变量配置

### 编辑 `.env` 文件

创建或编辑项目根目录的 `.env` 文件，填入以下内容：

```bash
# ===== 后端配置 =====
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
ENVIRONMENT=production

# ===== 数据库配置 (Supabase) =====
# 从 Supabase 项目设置 -> Database 获取
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# ===== Redis 配置 (Upstash) =====
# 从 Upstash Console -> REST API 获取
REDIS_URL=https://default:[token]@[region]-[number].upstash.io

# ===== Supabase 存储配置 =====
# 从 Supabase 项目设置 -> API 获取
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_KEY=[anon-key]
SUPABASE_BUCKET=question-uploads

# ===== JWT 配置 =====
JWT_SECRET=your-very-secure-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# ===== CORS 配置 =====
# 添加你的域名
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://yourdomain.com

# ===== 文件上传配置 =====
MAX_UPLOAD_SIZE=52428800
ALLOWED_EXTENSIONS=.docx,.pdf,.txt

# ===== 前端配置 =====
VITE_API_URL=https://yourdomain.com/api
VITE_APP_NAME=Question Generator
```

**⚠️ 重要提示**:
- 不要将 `.env` 提交到 Git，添加到 `.gitignore`
- 生产环境要使用强密码和密钥
- JWT_SECRET 要足够复杂，建议 32 字符以上

---

## 验证配置

### 1. 测试数据库连接

```bash
# 进入后端容器
docker-compose exec backend bash

# 测试 PostgreSQL 连接
python -c "from app.config import settings; print(settings.DATABASE_URL)"
```

### 2. 测试 Redis 连接

```bash
# 使用 curl 测试 Upstash REST API
curl -H "Authorization: Bearer [TOKEN]" \
  https://[region]-[number].upstash.io/ping
```

### 3. 测试 Supabase 存储

```bash
# 在后端代码中测试连接
python -c "from app.config import settings; print(settings.SUPABASE_URL)"
```

---

## 成本估算

### 月度成本（个人开发）

```
Supabase:
  - 数据库: 免费 (500MB)
  - 存储: 免费 (1GB)
  小计: $0

Upstash:
  - Redis: 免费 (10k请求/天)
  小计: $0

总计: $0/月 ✅
```

### 生产环境（预期成本）

```
如果免费额度不够：
  - Supabase 数据库: $25/月 (10GB)
  - Supabase 存储: $5/月 (100GB)
  - Upstash Redis: $7/月 (100k请求/天)

总计: ~$37/月
```

---

## 常见问题

### Q1: 如何迁移现有数据？

```bash
# 导出本地数据库
docker-compose exec postgres pg_dump -U question_user question_generator > backup.sql

# 连接到 Supabase 并导入
psql postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres < backup.sql
```

### Q2: Redis 缓存无法连接？

确保：
1. Upstash Redis 数据库已创建
2. REST API URL 正确复制到 `.env`
3. 防火墙/网络允许出站 HTTPS 连接

### Q3: 文件上传失败？

检查：
1. Supabase Storage 桶已创建且名称为 `question-uploads`
2. `SUPABASE_URL` 和 `SUPABASE_KEY` 正确
3. 桶的权限设置为 Public（可读）

### Q4: 如何监控使用情况？

访问各服务的仪表板：
- Supabase: https://app.supabase.com
- Upstash: https://console.upstash.com

---

## 后续步骤

1. ✅ 按上述步骤配置所有云服务
2. ✅ 更新 `.env` 文件
3. ✅ 启动应用：`docker-compose up -d`
4. ✅ 验证应用运行：http://localhost:8000/docs
5. ✅ 在生产环境部署

---

## 参考文档

- [Supabase 官方文档](https://supabase.com/docs)
- [Upstash 官方文档](https://upstash.com/docs)
- [FastAPI + Supabase 集成](https://supabase.com/docs/guides/getting-started/quickstarts/fastapi)

