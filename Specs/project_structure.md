# 教学出题App - 项目目录结构

## 推荐项目结构

```
question-generator-app/
├── README.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
├── docs/
│   ├── api.md
│   ├── deployment.md
│   └── user-guide.md
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── upload/
│   │   │   │   ├── FileUpload.jsx
│   │   │   │   └── UploadProgress.jsx
│   │   │   ├── questions/
│   │   │   │   ├── QuestionList.jsx
│   │   │   │   ├── QuestionCard.jsx
│   │   │   │   └── QuestionFilter.jsx
│   │   │   ├── templates/
│   │   │   │   ├── TemplateList.jsx
│   │   │   │   ├── TemplateForm.jsx
│   │   │   │   └── TemplatePreview.jsx
│   │   │   └── papers/
│   │   │       ├── PaperGenerator.jsx
│   │   │       ├── PaperPreview.jsx
│   │   │       └── PaperHistory.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Questions.jsx
│   │   │   ├── Templates.jsx
│   │   │   ├── Papers.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── upload.js
│   │   │   └── download.js
│   │   ├── store/
│   │   │   ├── index.js
│   │   │   ├── slices/
│   │   │   │   ├── questionsSlice.js
│   │   │   │   ├── templatesSlice.js
│   │   │   │   └── papersSlice.js
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   ├── helpers.js
│   │   │   └── validators.js
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── components/
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── setupTests.js
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── .dockerignore
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── question.py
│   │   │   ├── template.py
│   │   │   └── paper.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── question.py
│   │   │   ├── template.py
│   │   │   └── paper.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── questions.py
│   │   │       ├── templates.py
│   │   │       ├── papers.py
│   │   │       └── upload.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── parser.py
│   │   │   ├── question_service.py
│   │   │   ├── template_service.py
│   │   │   └── paper_service.py
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── file_handler.py
│   │   │   └── validators.py
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── test_parser.py
│   │       ├── test_services.py
│   │       └── test_api.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .dockerignore
│   └── alembic/
│       ├── versions/
│       ├── env.py
│       └── alembic.ini
├── nginx/
│   ├── nginx.conf
│   └── ssl/
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   └── backup.sh
└── data/
    ├── uploads/
    ├── generated/
    └── backups/
```

## 核心文件说明

### 前端核心文件

#### `frontend/src/components/upload/FileUpload.jsx`
- 文件上传组件
- 支持拖拽上传
- 显示上传进度
- 文件格式验证

#### `frontend/src/components/questions/QuestionList.jsx`
- 题目列表展示
- 支持分页加载
- 题目筛选和搜索
- 批量操作功能

#### `frontend/src/components/templates/TemplateForm.jsx`
- 模板创建/编辑表单
- 动态题型配置
- 实时预览功能

#### `frontend/src/services/api.js`
- API请求封装
- 错误处理
- 请求/响应拦截器

### 后端核心文件

#### `backend/app/services/parser.py`
- 文档解析核心逻辑
- 支持Word、PDF、TXT解析
- 题目类型识别
- 数据清洗和格式化

#### `backend/app/models/question.py`
- 题目数据模型
- MongoDB集合定义
- 数据验证规则

#### `backend/app/api/v1/upload.py`
- 文件上传接口
- 异步处理大文件
- 解析结果返回

#### `backend/app/services/paper_service.py`
- 试卷生成逻辑
- 模板匹配算法
- 文档格式化输出

## 快速开始命令

### 开发环境启动
```bash
# 克隆项目
git clone <repository-url>
cd question-generator-app

# 复制环境变量
cp .env.example .env

# 启动开发环境
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 生产环境部署
```bash
# 构建生产镜像
docker-compose -f docker-compose.prod.yml build

# 启动生产环境
docker-compose -f docker-compose.prod.yml up -d

# 数据库初始化
docker-compose exec backend python -m app.db.init
```

## 开发工作流

### 1. 功能开发流程
1. 创建功能分支
2. 后端API开发
3. 前端界面开发
4. 集成测试
5. 代码审查
6. 合并主分支

### 2. 测试策略
- 单元测试：覆盖率 > 80%
- 集成测试：API接口测试
- E2E测试：关键用户流程
- 性能测试：文件上传和解析

### 3. 部署流程
1. 开发环境验证
2. 测试环境部署
3. 用户验收测试
4. 生产环境发布
5. 监控和回滚准备

## 技术选型详细说明

### 前端技术栈
- **React 18**: 最新版本，支持并发特性
- **Ant Design**: 企业级UI组件库
- **Redux Toolkit**: 状态管理，减少样板代码
- **Vite**: 快速构建工具，开发体验好
- **React Router**: 路由管理
- **Axios**: HTTP客户端

### 后端技术栈
- **FastAPI**: 高性能异步框架
- **Pydantic**: 数据验证和序列化
- **Motor**: MongoDB异步驱动
- **python-docx**: Word文档处理
- **pdfplumber**: PDF文档处理
- **Celery**: 异步任务队列（可选）

### 数据库选择
- **MongoDB**: 文档型数据库，适合题目存储
- **Redis**: 缓存和会话存储
- **MinIO**: 对象存储，文件管理

## 部署架构优化

### 负载均衡
```nginx
upstream backend {
    server backend1:8000;
    server backend2:8000;
}

server {
    listen 80;
    location /api/ {
        proxy_pass http://backend;
    }
    location / {
        proxy_pass http://frontend:3000;
    }
}
```

### 监控配置
- **Prometheus**: 指标收集
- **Grafana**: 监控面板
- **ELK Stack**: 日志分析
- **Sentry**: 错误追踪

### 安全措施
- HTTPS强制跳转
- API限流
- 文件上传安全检查
- 数据库访问控制
- 敏感信息加密

## 性能优化建议

### 前端优化
1. **代码分割**: 按路由懒加载
2. **缓存策略**: 浏览器缓存 + CDN
3. **图片优化**: WebP格式 + 懒加载
4. **Bundle优化**: Tree shaking + 压缩

### 后端优化
1. **数据库索引**: 查询性能优化
2. **缓存层**: Redis缓存热点数据
3. **异步处理**: 大文件异步解析
4. **连接池**: 数据库连接复用

### 文件处理优化
1. **分片上传**: 大文件分片处理
2. **格式转换**: 统一文档格式处理
3. **压缩存储**: 文件压缩减少存储空间
4. **CDN加速**: 静态资源分发

这个项目结构为您提供了一个完整的开发框架，可以根据实际需求进行调整和扩展。
