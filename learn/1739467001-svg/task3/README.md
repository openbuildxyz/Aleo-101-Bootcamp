# Task 3: Private Shield Vote (隐私投票 dApp)

基于 Aleo 和 Leo 4.1.0 构建的可交互隐私投票应用。

## 项目结构
```
task3/
├── contract/
│   ├── src/main.leo      # Leo 4.1.0 隐私投票合约（已本地编译验证）
│   └── Leo.toml           # 项目配置
├── frontend/
│   └── src/App.js         # React 前端交互界面
├── private_vote_dapp_demo.png     # 应用主界面截图
├── private_vote_dapp_voting.png   # 投票过程截图
└── README.md              # 本文件
```

## 核心功能

1. **隐私投票** (`cast_vote`)：调用后生成加密的 Ticket Record，链上无法看到投票内容
2. **公开计票** (`tally_vote`)：消费 Ticket Record，通过 Final 块在链上更新公开的票数统计
3. **ZK 证明**：每次投票都在本地生成零知识证明，证明投票有效但不泄露具体选择

## 隐私设计

| 数据 | 链上可见性 |
|------|-----------|
| 投票结果总数 (votes Mapping) | ✅ 公开 |
| 投票人身份 | ❌ 加密隐藏 |
| 投票选择 (candidate) | ❌ 加密隐藏 |
| 投票人与选择的关联 | ❌ 不可关联 |

## 本地运行验证

### 编译合约
```bash
cd contract
leo build
# ✅ Compiled 'private_vote.aleo' into Aleo instructions.
# ✅ Generated ABI for program 'private_vote.aleo'.
```

### 运行投票函数
```bash
leo run cast_vote 1u32
```

**输出结果：**
```
➡️  Output

 • {
  owner: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px.private,
  candidate: 1u32.private,
  _nonce: 1498567934026198502068414214150971650202149654046035286397058312265927775751group.public,
  _version: 1u8.public
}
```

> 注意：`candidate` 字段是 `.private`，说明在链上是加密隐藏的——这正是隐私投票的核心设计。

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
