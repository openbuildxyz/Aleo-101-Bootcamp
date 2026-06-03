# Task 4: 用起来 - 真实场景落地

## 项目：隐私投票应用 (Private Voting)

将 Leo 隐私投票合约部署到 Aleo 测试网，并完成链上交互。

## 文件结构

```
task4/
├── contract/
│   ├── src/main.leo          # 隐私投票合约代码
│   └── Leo.toml              # 项目配置
├── deployment/
│   ├── DEPLOYMENT_GUIDE.md   # 部署指南
│   ├── TESTNET_ADDRESSES.md  # 测试网合约地址
│   ├── INTERACTION_DEMO.md   # 链上交互记录
│   └── deploy.sh             # 部署脚本
└── task4.md                  # Task 4 完整答案
```

## 核心功能

- `init_voting()` — 初始化投票计数
- `cast_vote(candidate)` — 隐私投票，生成加密 Ticket
- `tally_vote(ticket)` — 消费 Ticket 并链上计票

## 隐私特性

- ✅ 投票结果公开透明 (Mapping)
- ❌ 投票内容不可见 (Record 加密)
- ❌ 无法关联投票人与选择
