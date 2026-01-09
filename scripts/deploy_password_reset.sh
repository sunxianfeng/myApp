#!/bin/bash

# 密码重置功能 - 快速部署脚本

echo "🚀 开始部署密码重置功能..."

# 进入后端目录
cd "$(dirname "$0")/backend" || exit

echo ""
echo "📦 运行数据库迁移..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ 数据库迁移成功！"
    echo ""
    echo "🎉 密码重置功能已准备就绪！"
    echo ""
    echo "下一步："
    echo "1. 确保后端正在运行: cd backend && uvicorn app.main:app --reload"
    echo "2. 确保前端正在运行: cd frontend-nextjs && npm run dev"
    echo "3. 访问 http://localhost:3000/login"
    echo "4. 点击 '忘记密码？' 测试新功能"
    echo ""
else
    echo "❌ 数据库迁移失败，请检查错误信息"
    exit 1
fi
