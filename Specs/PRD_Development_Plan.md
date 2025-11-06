# 教学出题App - 产品需求文档(PRD)与开发计划

## 1. 产品概述

### 1.1 产品定位
一个面向教师的智能出题平台，支持文档上传解析、题目分类存储、模板化试卷生成等功能。

### 1.2 核心价值
- **效率提升**：自动化文档解析，减少手动录入工作量
- **标准化输出**：统一格式的试卷生成
- **题库管理**：结构化存储和分类管理
- **快速部署**：轻量级架构，支持快速上线测试

## 2. 功能需求分析

### 2.1 MVP核心功能 (Phase 1)

#### 2.1.1 文件上传与解析 - 混合人机协作模式
- **支持格式**：Word(.docx)、PDF、TXT
- **解析策略**（分层识别）：
  - **第1层**：自动文本提取（python-docx、pdfplumber等）
  - **第2层**：初步分类识别（多模式匹配）
    - 选择题、填空题、简答题、判断题
  - **第3层**：置信度评估
    - HIGH（≥0.9）：自动保存，无需审核
    - MEDIUM（0.7-0.9）：需人工审核
    - LOW（<0.7）：需人工审核或手动输入
    - UNRECOGNIZED：完全失败，需人工标注

- **人工审核界面**：
  - 自动保存高置信度题目（占比预计50-60%）
  - 提供友好的审核和修正界面（占比30-40%）
  - 支持手动标注未识别的题目（占比10-20%）

- **反馈机制**：
  - 记录用户修正，用于改进算法
  - 统计常见识别错误模式
  - 定期优化规则库和置信度阈值

- **期望准确率**：
  - 自动识别准确率：70-80%（可接受）
  - 经人工审核后最终准确率：>98%（高质量）

#### 2.1.2 题目分类存储
- **题目类型**：选择题、填空题、简答题、判断题
- **分类维度**：
  - 按题型分类
  - 按难度分类（初期手动标记，后期AI自动识别）
  - 按学科/章节分类
- **存储结构**：结构化数据存储

#### 2.1.3 模板管理
- **模板类型**：
  - 选择题模板（A、B、C、D选项格式）
  - 填空题模板（下划线格式）
  - 简答题模板
- **自定义模板**：支持用户创建和保存模板
- **模板要素**：题型、分值、格式要求

#### 2.1.4 试卷生成与下载
- **智能组卷**：根据模板要求选择题目
- **格式统一**：生成标准格式的试卷文档
- **导出功能**：支持Word/PDF格式下载

### 2.2 进阶功能 (Phase 2)

#### 2.2.1 智能题目生成
- 基于已有题目生成相似题目
- 利用NLP技术提高题目质量
- 题目多样性优化

#### 2.2.2 在线答题与评分
- 学生答题界面
- 自动评分系统
- 答案解析与反馈

#### 2.2.3 AI增强功能
- RAG技术集成
- 智能推荐题目
- 难度自动识别

## 3. 技术架构设计

### 3.1 技术栈选择

#### 前端
- **框架**：React 18
- **UI库**：Ant Design (快速开发，组件丰富)
- **状态管理**：Redux Toolkit / Zustand
- **构建工具**：Vite
- **样式**：CSS Modules + Ant Design

#### 后端
- **框架**：FastAPI
- **数据验证**：Pydantic
- **文件处理**：
  - python-docx (Word)
  - pdfplumber (PDF)
  - 内置open (TXT)
- **异步处理**：asyncio

#### 数据库
- **推荐选择**：PostgreSQL + JSONB
  - 强大的事务支持和数据一致性
  - JSONB字段支持灵活的文档存储
  - 丰富的查询功能和性能优化
  - 成熟的生态系统和运维工具
- **备选方案**：MongoDB
  - 灵活的文档结构，适合题目存储
  - 易于扩展和修改schema
  - 支持复杂查询

#### 部署架构
- **容器化**：Docker + Docker Compose
- **反向代理**：Nginx
- **进程管理**：Gunicorn (FastAPI)

### 3.2 系统架构图

```mermaid
graph TB
    A[用户浏览器] --> B[Nginx反向代理]
    B --> C[React前端]
    B --> D[FastAPI后端]
    D --> E[PostgreSQL数据库]
    D --> F[文件存储]
    D --> G[文档解析服务]
    G --> H[Word解析器]
    G --> I[PDF解析器]
    G --> J[TXT解析器]
```

## 4. 数据库设计 - 企业级多租户架构

### 4.1 PostgreSQL完整表设计

#### 用户和组织表
```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'teacher',  -- teacher, admin, super_admin
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 组织表（支持多租户）
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 组织成员表（权限管理）
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',  -- admin, editor, member, viewer
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_user ON organization_members(user_id);
```

#### 题目表（支持版本控制）
```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,  -- multiple_choice, fill_blank, short_answer, true_false
    content JSONB NOT NULL,  -- 灵活存储选项、答案等
    difficulty VARCHAR(20) DEFAULT 'medium',
    subject VARCHAR(100),
    chapter VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    source_file VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,

    CHECK (type IN ('multiple_choice', 'fill_blank', 'short_answer', 'true_false'))
);

-- 题目修改历史表（支持版本回滚）
CREATE TABLE question_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    version INT NOT NULL,
    title TEXT,
    content JSONB,
    difficulty VARCHAR(20),
    changed_by UUID REFERENCES users(id),
    change_description TEXT,
    changed_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(question_id, version)
);

CREATE INDEX idx_questions_org_type ON questions(org_id, type);
CREATE INDEX idx_questions_org_subject ON questions(org_id, subject);
CREATE INDEX idx_questions_org_tags ON questions USING GIN(org_id, tags);
CREATE INDEX idx_questions_created_at ON questions(org_id, created_at DESC);
CREATE INDEX idx_question_history_question ON question_history(question_id, version DESC);
```

#### 题库和权限表
```sql
CREATE TABLE question_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 题库权限管理
CREATE TABLE bank_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id UUID REFERENCES question_banks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(50),  -- view, edit, admin
    granted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(bank_id, user_id)
);

CREATE INDEX idx_banks_org ON question_banks(org_id);
CREATE INDEX idx_bank_permissions_user ON bank_permissions(user_id);
```

#### 模板表
```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    question_types JSONB NOT NULL,  -- 题型配置
    format_rules JSONB,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_org ON templates(org_id, created_at DESC);
```

#### 试卷表
```sql
CREATE TABLE papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES templates(id),
    question_ids UUID[] NOT NULL,
    total_score INTEGER NOT NULL,
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT NOW(),
    file_path VARCHAR(500),
    is_archived BOOLEAN DEFAULT false,
    metadata JSONB  -- 生成参数、难度分布等
);

CREATE INDEX idx_papers_org ON papers(org_id, generated_at DESC);
CREATE INDEX idx_papers_template ON papers(template_id);
```

#### 审计日志表（安全和合规）
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,  -- create_question, edit_question, delete_question, etc.
    resource_type VARCHAR(50),  -- question, template, paper, user, etc.
    resource_id UUID,
    old_values JSONB,  -- 修改前的值
    new_values JSONB,  -- 修改后的值
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org_created ON audit_logs(org_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

#### 文件上传历史表
```sql
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INT,
    parse_result JSONB,  -- 解析结果摘要
    auto_count INT DEFAULT 0,  -- 自动保存数量
    review_count INT DEFAULT 0,  -- 需审核数量
    failed_count INT DEFAULT 0,  -- 失败数量
    status VARCHAR(50),  -- success, partial_success, failed
    error_message TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_file_uploads_org ON file_uploads(org_id, uploaded_at DESC);
```

#### 数据备份表
```sql
CREATE TABLE backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    backup_type VARCHAR(50),  -- full, incremental, questions_only
    created_by UUID REFERENCES users(id),
    status VARCHAR(50),  -- in_progress, completed, failed
    file_path VARCHAR(500),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_backups_org ON backups(org_id, created_at DESC);
```

## 5. 开发计划 (修正版本)

> **时间调整**：从 4-6周 → **8-10周**（更现实的估计）
>
> **原因**：
> - 文档解析准确率需人工审核环节
> - 权限系统贯穿全项目
> - 测试覆盖范围更广
> - 安全加固和性能优化时间

### 5.1 Phase 1: MVP开发 (8-10周)

#### 第1周：项目搭建
- [ ] 前端React项目初始化
- [ ] 后端FastAPI项目初始化
- [ ] Docker环境配置
- [ ] 数据库连接配置
- [ ] 基础CI/CD流程

#### 第2-3周：文件上传与解析（混合人机模式）
- [ ] **后端核心**
  - [ ] 文件接收接口（支持多格式）
  - [ ] 三层识别引擎实现
    - [ ] 第1层：文本提取（python-docx、pdfplumber）
    - [ ] 第2层：多模式匹配分类（正则表达式库）
    - [ ] 第3层：置信度评估算法
  - [ ] 分类API（高/中/低/失败四个分类）
  - [ ] 反馈记录服务（收集用户修正）

- [ ] **前端审核界面**
  - [ ] 上传进度和结果显示
  - [ ] 高置信度题目展示（自动保存）
  - [ ] 需审核题目的编辑表单
  - [ ] 失败题目的手动标注表单
  - [ ] 一键保存审核结果

- [ ] **测试**
  - [ ] 创建多种格式测试文件
  - [ ] 测试各题型识别准确率
  - [ ] 人工审核流程测试

#### 第4周：权限和用户系统
- [ ] 用户认证系统（JWT）
- [ ] 组织和成员管理
- [ ] 基于角色的权限控制（RBAC）
- [ ] 前端权限管理界面
- [ ] 审计日志记录

#### 第5周：题目存储与管理
- [ ] 题目CRUD接口（带权限检查）
- [ ] 版本控制和历史记录
- [ ] 前端题目管理界面
- [ ] 题目分类和搜索功能
- [ ] 批量操作功能

#### 第6周：模板管理和试卷生成
- [ ] 模板CRUD接口
- [ ] 试卷生成算法
- [ ] 文档格式化输出（Word/PDF）
- [ ] 前端试卷生成和下载
- [ ] 生成历史管理

#### 第7-8周：数据备份、安全加固和优化
- [ ] 自动备份机制
- [ ] 数据恢复功能
- [ ] 文件上传安全检查
- [ ] API限流和速率限制
- [ ] 性能优化（缓存、查询优化）
- [ ] 错误处理和日志完善

#### 第9-10周：测试、文档和部署准备
- [ ] 单元测试编写（>80%覆盖率）
- [ ] 集成测试
- [ ] 端到端测试
- [ ] 性能压力测试
- [ ] 安全漏洞扫描
- [ ] API文档完善
- [ ] 部署脚本和文档

### 5.2 Phase 2: 进阶功能 (6-8周)

#### 第7-8周：智能题目生成
- [ ] NLP模型集成
- [ ] 题目相似度计算
- [ ] 智能题目生成算法
- [ ] 生成质量评估

#### 第9-10周：在线答题系统
- [ ] 学生答题界面
- [ ] 答题逻辑实现
- [ ] 自动评分系统
- [ ] 答题记录存储

#### 第11-12周：AI增强功能
- [ ] RAG技术集成
- [ ] 难度自动识别
- [ ] 智能推荐系统
- [ ] 性能监控和优化

## 6. 部署方案

### 6.1 推荐部署架构

#### 方案一：轻量级部署 (推荐MVP)
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/question_bank
      - REDIS_URL=redis://redis:6379/0
  
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=question_bank
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

#### 方案二：云服务优化部署
- **CDN加速**：Cloudflare (免费套餐足够)
- **对象存储**：腾讯云COS存储文件
- **负载均衡**：Nginx + 多实例部署
- **监控告警**：腾讯云监控

### 6.2 腾讯云服务器部署建议

#### 服务器配置
- **配置**：2核4GB内存 (初期足够)
- **存储**：50GB SSD
- **带宽**：5Mbps (可按需升级)
- **操作系统**：Ubuntu 20.04 LTS

#### 部署步骤
1. **服务器初始化**
   ```bash
   # 安装Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # 安装Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **域名和SSL**
   - 使用Cloudflare免费CDN
   - 自动SSL证书
   - DDoS防护

3. **监控和备份**
   - 设置自动备份
   - 配置监控告警
   - 日志收集

### 6.3 性能优化建议

#### 前端优化
- 代码分割和懒加载
- 静态资源CDN加速
- 图片压缩和优化

#### 后端优化
- 数据库索引优化
- 缓存策略 (Redis)
- 异步任务处理

## 7. 风险评估与应对

### 7.1 技术风险
- **文档解析准确性**：建立测试用例库，持续优化解析算法
- **性能瓶颈**：采用异步处理，分批上传大文件
- **数据安全**：文件加密存储，访问权限控制

### 7.2 业务风险
- **用户接受度**：MVP快速验证，收集用户反馈
- **竞品压力**：专注核心功能，快速迭代
- **合规要求**：数据隐私保护，内容审核

## 8. 成本估算

### 8.1 开发成本
- **人力成本**：1-2名全栈开发者，2-3个月
- **云服务成本**：
  - 腾讯云服务器：约200-300元/月
  - Cloudflare：免费套餐
  - 域名：约60元/年

### 8.2 运营成本
- **服务器维护**：50-100元/月
- **备份存储**：20-50元/月
- **监控服务**：免费或低成本方案

## 9. 成功指标

### 9.1 技术指标
- **系统可用性**：>99%
- **响应时间**：<2秒
- **文件解析成功率**：>95%

### 9.2 业务指标
- **用户注册量**：目标100+用户
- **日活用户**：目标20+用户
- **试卷生成量**：目标50+份/天

## 10. 下一步行动

1. **立即开始**：项目环境搭建和基础架构
2. **优先级排序**：按MVP功能优先级开发
3. **持续迭代**：基于用户反馈快速优化
4. **技术预研**：AI功能的技术可行性验证

---

*本文档将根据开发进展和用户反馈持续更新*
