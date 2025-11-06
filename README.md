# 教学出题App - 项目总览

## 📋 项目简介

这是一个面向教师的智能出题平台，支持文档上传解析、题目分类存储、模板化试卷生成等功能。项目采用现代化的技术栈，旨在提高教师出题效率，实现教学资源的数字化管理。

## 🎯 核心功能

### MVP功能 (Phase 1)
- 📄 **文档上传解析**: 支持Word、PDF、TXT格式，自动识别题目类型
- 🗂️ **题目管理**: 题目分类存储，支持筛选、搜索、编辑
- 📋 **模板管理**: 自定义试卷模板，支持多种题型配置
- 📝 **试卷生成**: 基于模板智能组卷，支持Word/PDF导出

### 进阶功能 (Phase 2)
- 🤖 **智能题目生成**: 基于NLP技术的题目自动生成
- 📊 **在线答题系统**: 学生答题界面和自动评分
- 🧠 **AI增强功能**: RAG技术集成，智能推荐系统

## 🏗️ 技术架构

### 前端技术栈
- **React 18** + **TypeScript** - 现代化前端框架
- **Ant Design 5.x** - 企业级UI组件库
- **Redux Toolkit** - 状态管理
- **React Router v6** - 路由管理
- **Vite** - 构建工具

### 后端技术栈
- **FastAPI** - 高性能异步Web框架
- **MongoDB** + **Motor** - 文档数据库
- **Pydantic** - 数据验证和序列化
- **python-docx/pdfplumber** - 文档解析
- **Redis** - 缓存和会话存储

### 部署架构
- **Docker** + **Docker Compose** - 容器化部署
- **Nginx** - 反向代理和负载均衡
- **Cloudflare** - CDN加速和安全防护

## 📁 项目结构

```
question-generator-app/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── store/          # Redux状态管理
│   │   └── utils/          # 工具函数
│   └── package.json
├── backend/                 # FastAPI后端应用
│   ├── app/
│   │   ├── api/           # API路由
│   │   ├── models/        # 数据模型
│   │   ├── services/      # 业务逻辑
│   │   └── utils/         # 工具函数
│   └── requirements.txt
├── nginx/                   # Nginx配置
├── data/                    # 数据存储目录
└── docker-compose.yml       # 容器编排配置
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- Git

### 本地开发环境搭建

1. **克隆项目**
```bash
git clone <repository-url>
cd question-generator-app
```

2. **环境配置**
```bash
# 复制环境变量文件
cp .env.example .env

# 启动开发环境
docker-compose up -d
```

3. **访问应用**
- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/api/docs

### 生产环境部署

1. **服务器准备**
```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **部署应用**
```bash
# 构建生产镜像
docker-compose -f docker-compose.prod.yml build

# 启动生产环境
docker-compose -f docker-compose.prod.yml up -d
```

## 📖 文档导航

### 📋 规划文档
- [PRD_Development_Plan.md](./PRD_Development_Plan.md) - 产品需求文档和开发计划
- [project_structure.md](./project_structure.md) - 项目目录结构说明
- [development_tasks.md](./development_tasks.md) - 详细开发任务清单
- [technical_specifications.md](./technical_specifications.md) - 技术选型详细说明

### 📊 项目进度

#### Phase 1: MVP开发 (4-6周)
- [x] 需求分析和架构设计
- [ ] 项目基础设施搭建
- [ ] 文件上传与解析功能
- [ ] 题目存储与管理
- [ ] 模板管理功能
- [ ] 试卷生成功能
- [ ] 测试与优化

#### Phase 2: 进阶功能 (6-8周)
- [ ] 智能题目生成
- [ ] 在线答题系统
- [ ] AI增强功能

## 💡 核心特性

### 🧠 智能文档解析
- 支持多种文档格式 (Word, PDF, TXT)
- 自动识别题目类型 (选择题、填空题、简答题、判断题)
- 智能提取题目内容和选项
- 数据清洗和格式化

### 📋 灵活的模板系统
- 支持自定义试卷模板
- 动态题型配置
- 分值和格式规则设置
- 模板预览和应用

### 🚀 高性能架构
- 异步处理提升响应速度
- Redis缓存优化查询性能
- 数据库索引优化
- 前端代码分割和懒加载

### 🔒 安全可靠
- 文件上传安全检查
- API限流和防护
- 数据加密存储
- HTTPS强制使用

## 📈 性能指标

### 目标性能
- 页面加载时间 < 3秒
- API响应时间 < 500ms
- 文件解析成功率 > 95%
- 系统可用性 > 99%

### 扩展能力
- 支持10万+题目存储
- 并发用户数1000+
- 文件上传大小50MB
- 数据库查询毫秒级响应

## 🛠️ 开发工具

### 推荐工具
- **IDE**: VS Code
- **扩展**: Python, React, Docker, MongoDB
- **版本控制**: Git
- **API测试**: Postman/Insomnia
- **数据库管理**: MongoDB Compass

### 开发脚本
```bash
# 开发环境启动
./scripts/setup.sh

# 生产环境部署
./scripts/deploy.sh

# 数据备份
./scripts/backup.sh
```

## 🔧 配置说明

### 环境变量配置
```bash
# 数据库配置
DATABASE_URL=mongodb://localhost:27017
DATABASE_NAME=question_bank

# Redis配置
REDIS_URL=redis://localhost:6379

# 安全配置
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=http://localhost:3000

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB
```

### 数据库索引
```javascript
// 题目集合索引
db.questions.createIndex({ "type": 1, "difficulty": 1 })
db.questions.createIndex({ "subject": 1, "chapter": 1 })
db.questions.createIndex({ "tags": 1 })
db.questions.createIndex({ "created_at": -1 })
```

## 🚨 注意事项

### 开发注意事项
1. **代码规范**: 遵循ESLint和Prettier配置
2. **提交规范**: 使用Conventional Commits格式
3. **测试要求**: 单元测试覆盖率 > 80%
4. **文档更新**: 及时更新API文档和注释

### 部署注意事项
1. **安全配置**: 生产环境必须使用HTTPS
2. **数据备份**: 定期备份数据库和文件
3. **监控告警**: 配置系统监控和错误告警
4. **性能监控**: 监控关键性能指标

## 🤝 贡献指南

### 开发流程
1. Fork项目到个人仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

### 代码审查
- 代码风格检查
- 功能完整性测试
- 性能影响评估
- 安全性审查

## 📞 支持与反馈

### 问题反馈
- 提交Issue: [GitHub Issues](https://github.com/your-repo/issues)
- 功能建议: [GitHub Discussions](https://github.com/your-repo/discussions)

### 技术支持
- 文档: [项目文档](./docs/)
- API文档: http://localhost:8000/api/docs
- 邮箱: support@your-domain.com

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🎯 下一步行动

### 立即开始
1. **环境准备**: 安装必需的开发工具
2. **项目初始化**: 创建项目目录结构
3. **基础设施**: 配置Docker和数据库
4. **核心功能**: 开始文件上传和解析功能开发

### 优先级排序
1. **高优先级**: 文件上传解析、题目存储管理
2. **中优先级**: 模板管理、试卷生成
3. **低优先级**: AI功能、高级分析

### 里程碑目标
- **2周内**: 完成基础架构和文件解析
- **4周内**: 完成MVP核心功能
- **6周内**: 完成测试和部署上线
- **12周内**: 完成进阶功能开发

🚀 **开始您的教学出题App开发之旅吧！**
