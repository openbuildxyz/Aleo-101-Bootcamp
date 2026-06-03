#!/bin/bash

# Aleo 隐私投票应用部署脚本
# 此脚本自动化部署流程

set -e

echo "=========================================="
echo "Aleo 隐私投票应用 - 测试网部署"
echo "=========================================="
echo ""

# 检查 Leo CLI 是否安装
if ! command -v leo &> /dev/null; then
    echo "❌ 错误: Leo CLI 未安装"
    echo "请访问 https://docs.leo-lang.org/ 安装 Leo"
    exit 1
fi

echo "✅ Leo CLI 已安装: $(leo --version)"
echo ""

# 进入合约目录
cd contract

# 第 1 步：编译合约
echo "📦 第 1 步：编译合约..."
leo build
echo "✅ 编译成功"
echo ""

# 第 2 步：部署到测试网
echo "🚀 第 2 步：部署到测试网..."
echo "请确保您已经："
echo "  1. 安装了 Aleo 钱包"
echo "  2. 获得了测试币（从水龙头）"
echo "  3. 配置了 .env 文件"
echo ""
echo "执行部署命令..."
leo deploy --network testnet

echo ""
echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "后续步骤:"
echo "1. 记录合约地址"
echo "2. 在区块浏览器中验证: https://explorer.hamp.app/"
echo "3. 执行链上交互进行测试"
echo ""
