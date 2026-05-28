# Task 3 - 建起来：从程序到 dApp

## 提交内容

- `task3/program/src/main.leo` — Leo 智能合约：Private Credential Vault
- `task3/frontend/` — React 前端应用（基于 Provable SDK）
- `task3/README.md` — 项目完整文档

## 项目简介：Private Credential Vault（隐私凭证保险库）

基于 Aleo 区块链的隐私凭证管理 dApp，展示 Aleo 的核心隐私特性。

### Leo 程序功能

| 函数 | 说明 | 隐私特性 |
|------|------|----------|
| `mint` | 铸造新的私有凭证 | 返回 Record，评分仅拥有者可见 |
| `share` | 分享凭证给他人 | 消耗原凭证，生成新 Record |
| `get_count` | 查询凭证计数 | Mapping 公开，只存数量不暴露详情 |

### 隐私机制

- **Record (私有)**：`score`、`credential_id` 加密存储，只有拥有者可解密
- **Mapping (公共)**：`credential_counts` 只存储计数，最小化信息泄露
- **@noupgrade**：防止合约被恶意升级
- **share 操作**：消耗原始 Record，无法追踪凭证流转

### 前端功能

- 生成/导入 Aleo 账户
- 铸造私有凭证
- 私密分享凭证
- 查询任意地址凭证计数

### 技术栈

Leo + Provable SDK (`@provablehq/sdk`) + React 19 + Vite + Comlink（Web Worker）

## Demo 截图

> 截图待补充
