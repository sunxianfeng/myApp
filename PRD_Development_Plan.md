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

#### 2.1.1 文件上传与解析
- **支持格式**：Word(.docx)、PDF、TXT
- **解析能力**：
  - 自动识别题目类型（选择题、填空题、简答题）
  - 提取题目内容、选项、答案
  - 基础内容清洗和格式化
- **技术实现**：
  - Word: python-docx
  - PDF: PyPDF2/pdfplumber
  - TXT: 内置open函数

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

## 4. 数据库设计

### 4.1 PostgreSQL表设计

#### questions 表
```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    content JSONB, -- 存储题目具体内容（选项、答案等）
    difficulty VARCHAR(20) DEFAULT 'medium',
    subject VARCHAR(100),
    chapter VARCHAR(100),
    tags TEXT[],
    source_file VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);
CREATE INDEX idx_questions_content ON questions USING GIN(content);
```

#### templates 表
```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    question_types JSONB NOT NULL,
    format_rules JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_created_by ON templates(created_by);
```

#### papers 表
```sql
CREATE TABLE papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES templates(id),
    question_ids UUID[] NOT NULL,
    total_score INTEGER NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    file_path VARCHAR(500)
);

CREATE INDEX idx_papers_template_id ON papers(template_id);
CREATE INDEX idx_papers_generated_at ON papers(generated_at);
```

## 5. 开发计划

### 5.1 Phase 1: MVP开发 (4-6周)

#### 第1周：项目搭建
- [ ] 前端React项目初始化
- [ ] 后端FastAPI项目初始化
- [ ] Docker环境配置
- [ ] 数据库连接配置
- [ ] 基础CI/CD流程

#### 第2周：文件上传与解析
- [ ] 前端文件上传组件
- [ ] 后端文件接收接口
- [ ] Word文档解析实现
- [ ] PDF文档解析实现
- [ ] TXT文档解析实现
- [ ] 解析结果数据结构化

#### 第3周：题目存储与管理
- [ ] 题目数据模型设计
- [ ] 题目CRUD接口开发
- [ ] 前端题目管理界面
- [ ] 题目分类功能
- [ ] 搜索和筛选功能

#### 第4周：模板管理
- [ ] 模板数据模型设计
- [ ] 模板CRUD接口
- [ ] 前端模板管理界面
- [ ] 模板预览功能
- [ ] 默认模板配置

#### 第5周：试卷生成
- [ ] 试卷生成算法实现
- [ ] 文档格式化输出
- [ ] 试卷下载功能
- [ ] 前端试卷生成界面
- [ ] 生成历史记录

#### 第6周：测试与优化
- [ ] 单元测试编写
- [ ] 集成测试
- [ ] 性能优化
- [ ] 用户界面优化
- [ ] 部署测试

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
