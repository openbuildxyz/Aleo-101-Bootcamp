# Task 3 - 隐私投票 dApp

基于 Aleo Leo + 前端构建的隐私投票应用，投票内容受零知识证明保护。

## 项目结构

```
├── program/                    # Leo 智能合约
│   ├── program.json            # 程序配置
│   └── src/main.leo            # 投票核心逻辑
├── frontend/                   # 前端应用
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.js             # SDK 交互逻辑
│       └── style.css           # 样式
└── screenshot/                 # Demo 截图
```

## Leo 程序设计

程序 `privacy_vote.aleo` 包含以下核心组件：

- **mapping `votes`**: 链上公开存储，记录每个提案的赞成/反对计数
- **record `Ballot`**: 私密投票记录，只有持有者能看到投票内容
- **transition `create_proposal`**: 创建新提案，初始化计数为 0
- **transition `vote`**: 私密投票，生成 Ballot record 并更新公开计数
- **transition `get_results`**: 查询投票结果

## 前端功能

1. **账户管理**: 创建 Aleo 账户（地址、私钥、视图密钥）
2. **提案创建**: 设置提案 ID 和名称
3. **隐私投票**: 赞成/反对，投票内容受 ZK 保护
4. **结果查看**: 展示汇总投票结果，个人投票不公开

## 运行方式

```bash
cd frontend
npm install
npm run dev
```

浏览器访问 http://localhost:3000

## 隐私保护说明

- 投票选择通过 Aleo 的 record 机制存储，只有投票者本人可见
- 链上仅公开投票计数汇总结果，无法追溯个人投票
- 基于零知识证明，验证投票有效性无需暴露投票内容
