# 部署指南

## 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0
- Linux/macOS/Windows (with WSL2)

## 开发环境部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd question-generator-app
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置开发环境变量
```

### 3. 启动服务

```bash
# 使用提供的脚本
./scripts/setup.sh

# 或手动启动
docker-compose up -d
```

### 4. 检查服务状态

```bash
docker-compose ps
```

### 5. 查看日志

```bash
docker-compose logs -f
# 查看特定服务日志
docker-compose logs -f backend
```

## 生产环境部署

### 1. 服务器准备

确保服务器满足以下条件：
- 至少2GB内存
- 至少10GB磁盘空间
- Ubuntu 20.04 LTS 或更新版本

### 2. 安装依赖

```bash
# 更新系统
sudo apt-get update
sudo apt-get upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.10.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. 配置生产环境

```bash
# 复制项目
git clone <repository-url>
cd question-generator-app

# 配置环境变量
cp .env.example .env
# 编辑 .env，设置生产环境变量和密钥
```

### 4. SSL证书配置

将SSL证书放置在 `nginx/ssl/` 目录：

```bash
mkdir -p nginx/ssl
cp /path/to/cert.pem nginx/ssl/
cp /path/to/key.pem nginx/ssl/
```

### 5. 部署服务

```bash
# 使用部署脚本
./scripts/deploy.sh

# 或手动部署
docker-compose -f docker-compose.prod.yml up -d
```

### 6. 数据库迁移

```bash
docker-compose -f docker-compose.prod.yml exec -T backend \
  alembic upgrade head
```

## 数据备份

定期备份数据库和上传文件：

```bash
# 使用备份脚本
./scripts/backup.sh

# 手动备份PostgreSQL
docker-compose exec -T postgres pg_dump -U question_user question_generator \
  > backup_$(date +%Y%m%d).sql
```

## 监控和日志

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 性能监控

```bash
# 查看容器资源使用
docker stats
```

## 更新和维护

### 应用更新

```bash
# 拉取最新代码
git pull origin main

# 重建镜像
docker-compose -f docker-compose.prod.yml build

# 重启服务
docker-compose -f docker-compose.prod.yml up -d
```

### 数据库迁移

```bash
docker-compose -f docker-compose.prod.yml exec backend \
  alembic upgrade head
```

## 故障排除

### 服务无法启动

1. 检查日志：
```bash
docker-compose logs -f
```

2. 检查端口占用：
```bash
netstat -tlnp | grep LISTEN
```

3. 检查磁盘空间：
```bash
df -h
```

### 数据库连接失败

1. 检查PostgreSQL是否运行：
```bash
docker-compose ps postgres
```

2. 重启PostgreSQL：
```bash
docker-compose restart postgres
```

3. 检查数据库连接URL：
```bash
# 确保 DATABASE_URL 环境变量正确配置
echo $DATABASE_URL
```

### 内存不足

1. 增加Docker内存限制
2. 优化应用配置
3. 清理无用的Docker镜像和容器：
```bash
docker system prune -a
```

## 性能优化

### 1. 负载均衡

配置多个后端实例：

```yaml
backend:
  deploy:
    replicas: 3
```

### 2. 缓存配置

配置Redis缓存策略以提升性能。

### 3. 数据库优化

- 创建适当的索引
- 定期优化数据库
- 配置备份策略

### 4. CDN配置

将静态文件通过CDN分发。

## 安全建议

1. **定期更新依赖**：
```bash
docker-compose pull
docker-compose build --no-cache
```

2. **设置强密码**：
   - PostgreSQL密码
   - Redis密码
   - JWT密钥

3. **启用HTTPS**：配置SSL证书

4. **API限流**：配置速率限制

5. **定期备份**：实施自动备份策略

6. **日志审计**：保存和分析访问日志

## 扩展性

### 水平扩展

部署多个应用实例并使用负载均衡器。

### 垂直扩展

增加服务器资源（CPU、内存、磁盘）。

### 数据库优化

- 创建合适的索引（特别是JSON字段的索引）
- 配置连接池大小
- 定期VACUUM和ANALYZE
- 配置自动备份策略
