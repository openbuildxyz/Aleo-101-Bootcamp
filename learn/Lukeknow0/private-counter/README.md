# Aleo 私密计数器 (Private Counter)

基于 Aleo 零知识证明技术的隐私保护计数器应用。

## 功能特性

- 🔒 **完全私密**：计数器值在链上加密存储，仅所有者可见
- 🛡️ **零知识证明**：所有操作在链下执行，仅提交 ZK 证明到链上
- 🎨 **现代化界面**：响应式设计，支持移动端和桌面端
- ⚡ **即时反馈**：模拟真实交易体验，包含加载状态提示

## 技术架构

### 智能合约 (Leo)
- `counter_app.aleo`：主程序合约
- `Counter` record：私密计数器数据结构
- `mint`：创建新计数器
- `increment`：增加计数（私密操作）
- `get_value`：查看当前值（可选公开）

### 前端界面
- HTML5 + CSS3 + Vanilla JavaScript
- 响应式布局设计
- 模拟 Aleo 钱包交互流程

## 使用方法

1. 打开 `index.html` 文件
2. 点击「创建计数器」按钮
3. 使用「+1 增加」按钮进行计数
4. 点击「查看数值」临时显示当前值

## 隐私说明

- 所有计数操作在本地执行，生成零知识证明
- 链上仅存储加密的 record commitment
- 只有计数器所有者持有 view key 可解密数据
- 其他用户无法查看您的计数值

## 部署到测试网

```bash
# 编译程序
leo build

# 部署到 Aleo Testnet
leo deploy

# 执行交易
leo execute counter_app.aleo mint
```

## 项目结构

```
private-counter/
├── counter_app/
│   ├── main.leo          # Leo 智能合约
│   └── program.json      # 程序配置
├── index.html            # 前端界面
└── README.md             # 项目说明
```

## 学习资源

- [Aleo 官方文档](https://developer.aleo.org/)
- [Leo 语言入门](https://leo-lang.org/)
- [Aleo Studio](https://aleo.studio/)

---

**Aleo 101 Bootcamp Task 3 提交**
作者：luke不吃面 (Lukeknow0)
