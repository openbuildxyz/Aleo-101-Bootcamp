# Task 3: Private Shield Vote (隐私投票 dApp)

基于 Aleo 和 Leo 构建的可交互隐私投票应用。

## 项目结构
```
task3/
├── contract/
│   ├── src/main.leo      # Leo 隐私投票合约
│   └── Leo.toml           # 项目配置
├── frontend/
│   └── src/App.js         # React 前端交互界面
└── README.md              # 本文件
```

## 核心功能

1. **隐私投票** (`vote_private`)：调用后生成加密的 Ticket Record，链上无法看到投票内容
2. **公开计票** (`tally_vote`)：消费 Ticket Record，通过 finalize 在链上更新公开的票数统计
3. **ZK 证明**：每次投票都在本地生成零知识证明，证明投票有效但不泄露具体选择

## 隐私设计

| 数据 | 链上可见性 |
|------|-----------|
| 投票结果总数 (votes Mapping) | ✅ 公开 |
| 投票人身份 | ❌ 加密隐藏 |
| 投票选择 (candidate) | ❌ 加密隐藏 |
| 投票人与选择的关联 | ❌ 不可关联 |

## 运行说明

### 合约编译
```bash
cd contract
leo build
leo run vote_private 1u32
```

### 前端启动
```bash
cd frontend
npm install
npm start
```

## Demo 截图

### 应用主界面 - 连接钱包并投票

![Private Shield Vote 主界面](./private_vote_dapp_demo.png)

### 投票进行中 - 生成 ZK 证明

![投票操作演示](./private_vote_dapp_voting.png)
