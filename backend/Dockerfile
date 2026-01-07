FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装 uv
RUN pip install uv

# 复制依赖文件（不要依赖 README 必须存在）
COPY pyproject.toml uv.lock ./

# 如果仓库没有 README，创建一个占位文件以避免某些构建工具报错
RUN [ -f README.md ] || echo "# placeholder README" > README.md

# 安装依赖（使用锁文件确保一致性）
# Note: Removed --frozen to allow lockfile updates if needed
RUN uv sync --no-dev

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

EXPOSE 8000

# 使用 uv 运行应用
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
