# 教学出题App - 问卷生成应用

一个强大的在线出题系统，支持从Word、PDF等文档自动解析题目，生成定制化试卷。

## 功能特性

- 📄 **智能文档解析** - 支持Word、PDF、TXT格式的文档解析
- 🎯 **题目管理** - 完整的题目管理系统，支持分类、搜索、编辑
- 📋 **试卷生成** - 基于模板快速生成试卷，支持自定义配置
- 🎨 **模板系统** - 灵活的模板设置，支持多种题型配置
- 📊 **数据统计** - 完整的题目统计和使用分析
- ☁️ **云存储** - 集成MinIO对象存储，支持大文件上传

## 技术栈

### 前端
- React 18
- Ant Design
- Redux Toolkit
- Vite
- React Router
- Axios

### 后端
- FastAPI
- Pydantic
- SQLAlchemy (ORM)
- python-docx (Word处理)
- pdfplumber (PDF处理)

### 数据库和存储
- PostgreSQL (主数据库，支持JSON字段)
- Redis (缓存)
- MinIO (对象存储)

## 快速开始

### 前置要求
- Docker & Docker Compose
- Git

### 开发环境启动

```bash
# 克隆项目
git clone <repository-url>
cd question-generator-app

# 复制环境变量文件
cp .env.example .env

# 启动开发环境
docker-compose up -d

# 查看日志
docker-compose logs -f
```

访问应用：
- 前端：http://localhost:5173
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

### 生产环境部署

```bash
# 构建生产镜像
docker-compose -f docker-compose.prod.yml build

# 启动生产环境
docker-compose -f docker-compose.prod.yml up -d

# 数据库迁移
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## 项目结构

详见 [项目结构文档](docs/project_structure.md)

```
question-generator-app/
├── frontend/           # React前端应用
├── backend/            # FastAPI后端应用
├── nginx/              # Nginx反向代理配置
├── scripts/            # 部署和维护脚本
├── data/               # 数据目录（上传、生成、备份）
├── docs/               # 文档目录
└── docker-compose.yml  # Docker编排文件
```

## API文档

启动应用后，访问 http://localhost:8000/docs 查看完整的API文档。

## 开发工作流

### 功能开发流程
1. 创建功能分支
2. 后端API开发
3. 前端界面开发
4. 集成测试
5. 代码审查
6. 合并主分支

### 测试
```bash
# 后端单元测试
docker-compose exec backend pytest

# 前端测试
docker-compose exec frontend npm test
```

## 部署

详见 [部署文档](docs/deployment.md)

## 用户指南

详见 [用户指南](docs/user-guide.md)

## 许可证

MIT License

## 联系方式

有问题或建议？请提交Issue或联系开发团队。
