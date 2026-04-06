#!/bin/bash

# 海明OA 快速启动脚本
# 用法: ./start.sh

set -e

echo "🚀 启动海明OA系统..."
echo ""

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ 请先安装 pnpm: npm install -g pnpm"
    exit 1
fi

# 安装依赖（如果没有）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install
fi

# 创建 .env（如果不存在）
if [ ! -f ".env" ]; then
    echo "⚙️  创建 .env 配置文件..."
    cp .env.example .env
fi

# 检查是否需要数据库迁移
if [ ! -f "apps/server/prisma/dev.db" ]; then
    echo "🗄️  初始化数据库..."
    cd apps/server
    pnpm exec prisma migrate dev --name init
    pnpm exec tsx prisma/seed.ts
    cd ../..
fi

echo ""
echo "✅ 准备就绪！"
echo ""
echo "启动开发服务器..."
echo ""
echo "后台管理: http://localhost:5173"
echo "默认账号: admin / admin123"
echo ""

# 同时启动前后端
pnpm dev
