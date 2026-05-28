# Task 3 - 建起来：从程序到 dApp

本次提交的是一个可交互隐私小应用：`Private Allocation Proof`。

## 设计思路

这个 demo 受 ZKGames 中“公开规则、隐藏策略”的思想启发，但不照搬战争迷雾或隐藏基地。它抽象出一个更通用的现实模式：

> 用户私下分配有限资源，公开证明分配满足规则，但不暴露完整私有分配。

在 demo 中，用户把 10 点资源私下分配到：

- Scout 侦察
- Shield 防御
- Research 研究

Leo 程序证明：

```text
scout + shield + research <= 10
```

但完整分配会进入 private record，不作为公开状态暴露。

## 交付文件

代码目录：

```text
learn/truongvknnlthao-gif/task3/
```

主要文件：

```text
task3/README.md
task3/private_allocation_demo/src/main.leo
task3/private_allocation_demo/tests/test_private_allocation_demo.leo
task3/private_allocation_demo/VALIDATION.md
task3/frontend/index.html
task3/frontend/styles.css
task3/frontend/app.js
task3/demo/demo-initial.png
task3/demo/demo-allocation-preview.png
task3/demo/screenshot-placeholder.md
```

## 应用说明

前端允许用户：

1. 点击连接演示钱包；
2. 输入 Aleo 地址；
3. 输入 Scout / Shield / Research 私有分配；
4. 选择性公开一个 lane；
5. 生成 `private_allocation_demo.aleo/create_allocation` 和 `reveal_lane` 调用预览。

## 现实社会应用映射

同一个 proof pattern 不只适用于游戏，也可用于：

- 贷款 / 租房预审：证明负债率或还款能力达标，但不公开完整收入和债务；
- 暗标竞价 / 招投标：证明报价和保证金合法，但不提前公开报价策略；
- 供应商准入：证明库存、交付和质量指标达标，但不泄露商业细节；
- 企业预算：证明部门预算总额不超过上限，但不公开完整预算分配。

## 本地验证

```bash
cd learn/truongvknnlthao-gif/task3/private_allocation_demo
leo build
leo test
```

前端 demo：

```bash
open learn/truongvknnlthao-gif/task3/frontend/index.html
```

## 截图说明

Demo 截图放在：

```text
learn/truongvknnlthao-gif/task3/demo/
```

当前已包含 `demo-initial.png` 和 `demo-allocation-preview.png` 两张页面截图。

## 安全说明

本 demo 不提交 private key、view key、API key 或真实钱包敏感信息。测试网部署和链上交互截图会在 Task 4 中继续完成。
