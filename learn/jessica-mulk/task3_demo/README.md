# Task 3 - Private Credential Vault（隐私凭证保险库）

> Aleo 101 Bootcamp Task 3: 基于 Leo 和前端完成一个可交互的隐私小应用

## 项目简介

这是一个基于 Aleo 区块链的**隐私凭证保险库** dApp，展示了 Aleo 的核心隐私特性：

- **私有 Record** — 凭证数据（如评分）作为私有 Record 存储在链上，只有拥有者可查看
- **公共 Mapping** — 只存储凭证计数等非敏感信息
- **零知识证明** — 通过 Leo 编译器自动生成 ZK 电路

## 项目结构

```
task3_demo/
├── program/                  # Leo 智能合约
│   ├── src/
│   │   └── main.leo          # 核心程序
│   ├── program.json          # 程序配置
│   └── inputs/
│       └── credential.in     # 测试输入
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── App.jsx           # 主应用组件
│   │   ├── App.css           # 样式
│   │   ├── index.css         # 全局样式
│   │   ├── main.jsx          # 入口
│   │   └── workers/
│   │       ├── AleoWorker.js # Worker 封装
│   │       └── worker.js     # Aleo SDK Worker
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── README.md
```

## Leo 程序说明

### 核心功能

| 函数 | 说明 | 隐私特性 |
|------|------|----------|
| `mint` | 铸造新的私有凭证 | 返回私有 Record，评分仅拥有者可见 |
| `share` | 分享凭证给他人 | 消耗原始凭证，生成新 Record |
| `get_count` | 查询凭证计数 | 只返回数量，不暴露任何凭证详情 |

### 隐私机制

```
┌──────────────────────────────────────────────────────┐
│                    Aleo 区块链                        │
│                                                      │
│  ┌─────────────────┐    ┌──────────────────────┐     │
│  │  Public Mapping │    │  Private Records     │     │
│  │                 │    │                      │     │
│  │  address => u64 │    │  Credential {        │     │
│  │  (仅计数)        │    │    owner,            │     │
│  │                 │    │    credential_id,    │     │
│  │  可被任何人查询   │    │    score  ← 加密    │     │
│  │                 │    │  }                   │     │
│  └─────────────────┘    │                      │     │
│                         │  只有拥有者可解密      │     │
│                         └──────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

## 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) >= 18
- [Leo 编译器](https://docs.leo-lang.org/installation) (可选，用于编译 Leo 程序)

### 1. 安装 Leo 编译器（可选）

```bash
# 安装 Leo
curl -L leo | bash

# 编译 Leo 程序
cd program
leo build
```

编译成功后会在 `program/build/` 目录生成 `.aleo` 文件。

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 `http://localhost:5173` 即可访问。

### 3. 使用流程

1. **生成账户** — 点击"生成新账户"创建 Aleo 账户
2. **获取测试币** — 前往 [Aleo Faucet](https://faucet.testnet.provable.com) 获取测试网代币
3. **铸造凭证** — 输入凭证 ID 和评分，铸造私有凭证
4. **分享凭证** — 将凭证私密分享给其他地址
5. **查询计数** — 查询任意地址的凭证数量

## 隐私特性分析

| 数据类型 | 存储位置 | 可见性 | 说明 |
|---------|---------|--------|------|
| `score` | Record (链上) | 仅拥有者 | 评分完全私密 |
| `credential_id` | Record (链上) | 仅拥有者 | 建议使用哈希 |
| `owner` | Record (链上) | 仅拥有者 | 持有者地址 |
| `credential_counts` | Mapping (链上) | 公开 | 仅显示数量 |

### 隐私保证

- 链上 observers 无法看到任何凭证的具体内容
- `share` 操作消耗原始 Record，无法追踪凭证流转
- Mapping 只存储计数，最小化信息泄露
- `@noupgrade` 防止合约被恶意升级

## 技术栈

- **Leo** — Aleo 零知识编程语言
- **Provable SDK** (`@provablehq/sdk`) — 前端交互 SDK
- **React 19** — 前端框架
- **Vite** — 构建工具
- **Comlink** — Web Worker 通信

## 参考资源

- [Leo 语言文档](https://docs.leo-lang.org)
- [Provable SDK 文档](https://docs.explorer.provable.com/docs/sdk)
- [Aleo 开发者文档](https://developer.aleo.org)
- [Aleo Explorer](https://explorer.provable.com)