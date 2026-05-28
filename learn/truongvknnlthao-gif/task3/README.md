# Task 3 - Private Allocation Proof

本目录是 Aleo 101 Bootcamp Task 3 的交付：一个从 ZKGames 思想延展出来、但可映射到现实社会应用的隐私资源分配证明 demo。

## 核心想法

社区中关于 ZKGames 的讨论启发了一个更通用的模式：

> 公开规则，隐藏策略；证明自己遵守规则，但不暴露完整私有数据。

本 demo 不照搬战争迷雾或隐藏基地，而是抽象成 `Private Allocation Proof`：用户私下把有限资源分配到 Scout / Shield / Research，Leo 程序证明总预算没有超过 10，但前端和公开结果不需要暴露完整分配。

## Demo 目标

- Leo 程序：`private_allocation_demo.aleo`
- 隐私点：`scout`、`shield`、`research` 是 private inputs，并写入 `Allocation` private record。
- 公开规则：`scout + shield + research <= 10`。
- 选择性公开：可以只 reveal 一个 lane，而不是公开完整 allocation。
- 前端交互：连接演示钱包、输入 Aleo 地址、输入私有分配、生成 Aleo 调用预览。
- Task 3 边界：本任务展示本地程序和前端交互；测试网部署、合约地址和链上交互截图留到 Task 4。

## 目录

```text
private_allocation_demo/
  src/main.leo                         # Leo 程序
  tests/test_private_allocation_demo.leo
  VALIDATION.md
frontend/
  index.html                           # 前端页面
  styles.css
  app.js
demo/
  demo-initial.png                     # 初始页面截图
  demo-allocation-preview.png                # 交互结果截图
  screenshot-placeholder.md            # 截图说明
```

## Leo 程序

核心函数：

```leo
fn create_allocation(
    public owner: address,
    private scout: u8,
    private shield: u8,
    private research: u8,
) -> Allocation
```

规则：

- `scout + shield + research <= 10u8`。
- 若超过预算，程序会失败。
- 返回的 `Allocation` record 由 `owner` 持有，完整分配保存在 private record 中。

选择性公开函数：

```leo
fn reveal_lane(private allocation: Allocation, public lane: u8) -> u8
```

它只公开某一个 lane 的结果：

- `1u8` = Scout
- `2u8` = Shield
- `3u8` = Research

## 现实社会应用映射

这个 demo 用策略游戏界面降低理解成本，但 proof pattern 可以迁移到现实场景：

| 场景 | 私有数据 | 公开证明 |
| --- | --- | --- |
| ZKGames / 策略游戏 | Scout / Shield / Research 分配 | 总点数不超预算，且可选择性 reveal 一个行动结果 |
| 贷款 / 租房预审 | 收入、负债、还款额 | 负债率或还款能力满足规则 |
| 暗标竞价 / 招投标 | 报价、成本、保证金 | 报价合法，保证金充足 |
| 供应商准入 | 库存、交付周期、缺陷率 | 符合准入标准 |
| 企业预算 | R&D / Marketing / Ops 预算 | 总预算没有超过 cap |

## 本地验证

在本目录运行：

```bash
cd private_allocation_demo
leo build
leo test
```

本机验证环境：

```text
leo 4.0.2
node v22.22.0
npm 10.9.4
```

## 前端 demo

前端是无依赖静态页面，可直接打开：

```bash
open frontend/index.html
```

交互流程：

1. 点击「连接演示钱包」。
2. 保留或输入 Aleo 地址。
3. 输入 Scout / Shield / Research 私有分配。
4. 选择想公开的 lane。
5. 点击「生成 Aleo 证明调用预览」。
6. 页面会展示 `private_allocation_demo.aleo/create_allocation` 和 `reveal_lane` 调用预览。

真实上线时，可把 `frontend/app.js` 中的调用预览替换为 Provable SDK/API 或 Aleo wallet adapter 调用。

## 安全说明

- 没有提交 private key、view key、API key 或 consumer id。
- 前端只做演示交互，不包含真实签名或测试网交易。
- `demo/` 目录只放截图或截图说明，不放任何敏感钱包信息。
