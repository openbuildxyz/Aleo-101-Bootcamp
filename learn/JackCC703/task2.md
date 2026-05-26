# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。


## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 在 Leo 中，所有函数的输入参数和返回值如果没有显式标注 `public`，默认就是 `private`。

- **private 值**：只在用户本地执行 transition 时存在，链上看不到明文，仅通过 ZK 证明保证计算的正确性。
- **public 值**：会作为交易的明文出现在链上，全网可见，可在 `finalize` 中参与链上状态更新。

这种"默认隐私"的设计让开发者不容易因为忘记加隐私保护而泄露敏感数据。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:

```leo
struct Point {
    x: u32,
    y: u32,
}

program example.aleo {
    transition demo() -> u32 {
        // 定义一个包含 u8 和 Point 数组的 Tuple
        let data: (u8, [Point; 3]) = (
            1u8,
            [
                Point { x: 1u32, y: 2u32 },
                Point { x: 3u32, y: 4u32 },
                Point { x: 5u32, y: 6u32 },
            ],
        );

        // 1. 用 .N 访问 tuple 中第 N 个元素
        let tag: u8 = data.0;           // 取出 u8 值 1
        let points: [Point; 3] = data.1; // 取出 [Point; 3] 数组

        // 2. 用 [i] 访问数组中第 i 个元素
        let p0: Point = data.1[0u32];

        // 3. 用 .field 访问 struct 字段
        let x0: u32 = data.1[0u32].x;   // = 1u32
        let y2: u32 = data.1[2u32].y;   // = 6u32

        return x0 + y2; // 返回 7u32
    }
}
```

访问规则：tuple 用 `.N`，array 用 `[i]`，struct 用 `.field`，三者可以链式组合使用。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 是 record 的强制字段，类型为 `address`，标识这条 record 的归属。它在 Aleo 隐私模型中承担两个核心职责：

1. **访问控制（spend 权限）**：只有持有 `owner` 对应私钥的人才能在 transition 中把这条 record 作为输入花费掉（生成 nullifier）。这相当于"私钥即所有权"在 record 模型中的体现。
2. **加密目标**：record 在链上是密文，加密使用的是 `owner` 的 view key。只有 owner 自己（或其授权方）才能解密读取 record 中的明文内容（如金额等字段）。

---

**Q4. 程序中的 final 是什么？**

A: 这里的 "final" 指 `finalize`（或新版 Leo 中的 `async function` 块），是 Aleo 程序"链下 + 链上"两段式执行模型中的链上部分。

执行流程：
1. **transition（链下）**：用户本地执行，处理 private 输入，生成 ZK 证明，可以创建/花费 records。全网节点不重新执行，只验证证明。
2. **finalize（链上）**：transition 完成后触发，由全网节点执行，操作 public 的 `mapping` 状态（如更新公开余额、计数器等）。

为什么需要 finalize：
- record 模型适合表达私有的、用户独占的状态，但全局共享的状态（如 token 的 public 余额、NFT 注册表）必须放在链上 mapping 中。
- finalize 的输入只能是 transition 的 public 输出，**finalize 内不能访问 private 数据**——这是隐私边界。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 使用 `function` 关键字定义：

```leo
program example.aleo {
    // helper function：纯计算逻辑，可被 transition 或其他 function 复用
    function square(x: u32) -> u32 {
        return x * x;
    }

    function add_squared(a: u32, b: u32) -> u32 {
        return square(a) + square(b);
    }

    transition demo(a: u32, b: u32) -> u32 {
        return add_squared(a, b);
    }
}
```

helper function 的特点：
- **纯函数**：只做计算和返回值，不修改链上状态。
- 可在 transition 或其他 function 内被调用，用于复用复杂逻辑。
- 会被一起编译进电路，受 ZK 证明覆盖。
- 不暴露给外部直接调用，只有 `transition` 才是程序的对外入口。

---

**Q6. helper functions 能否创建 records？**

A: 不能。在 Leo 中，只有 `transition` 才能创建（mint）或花费（spend）records。helper function 只能做纯计算，不能在返回值中包含新的 record，也不能消费传入的 record。

原因：
- **创建 record** 意味着要往 transaction 的 output commitments 里加一条，这是交易协议层的事件。
- **花费 record** 意味着要发出 nullifier 并附带所有权证明。
- 这些副作用必须发生在 transition 的边界上，编译器才能正确生成对应的 ZK 约束和交易结构。

---

**Q7. constructor 的目的是什么？**

A: `constructor` 用于程序部署时执行一次的初始化逻辑，类似于 Solidity 的 `constructor`。

典型用途：
- 初始化 `mapping`，例如写入 admin 地址。
- 设置 token 的 metadata（名称、符号、精度）。
- mint 初始供应量给部署者。
- 写入链上不可变的配置参数。

关键性质：
- 只在部署 transaction 中执行一次，部署完成后无法再被外部调用。
- 不接受 private 输入（部署本身是公开行为）。
- 实现"部署即就绪"，避免部署后还需要额外手动初始化的麻烦。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: Leo 通过两种方式组合 interface：

1. **一个 struct/record 同时实现多个 interface**，用 `+` 连接：

```leo
record Token implements Ownable + Transferable {
    owner: address,
    amount: u64,
}
```

2. **interface 本身可以继承/组合其他 interface**：

```leo
interface Ownable {
    owner: address,
}

interface Transferable {
    amount: u64,
}

// 组合接口：同时要求 Ownable + Transferable
interface Asset: Ownable + Transferable {}
```

这样，任何实现了 `Asset` 的类型就同时满足 `Ownable` 和 `Transferable`，调用方可以用更通用的接口类型来书写函数签名。

---

**Q9. record interface 中 `..` 的含义是什么？**

A: `..` 是 rest pattern（剩余字段占位符），表示"这个 record 还有其他字段，但这里不关心、也不约束"。

```leo
interface AnyOwned {
    owner: address,
    ..   // 其余字段任意
}
```

只要某个具体的 record 拥有 `owner: address`，无论它额外有什么字段（如 `amount`、`metadata` 等），都满足 `AnyOwned` 这个接口。这在定义通用接口时非常有用。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当 transition 需要接受或返回类型在编译期未知的 record 时，使用 `dyn record`。

典型场景：
- **通用 Escrow / Vault**：合约要托管任意项目方发行的 record，不能在编写时就把 record 类型写死。
- **通用 Marketplace**：挂单合约要支持任意 NFT、任意 token record，按统一接口处理。
- **跨程序的中介逻辑**：router/agent 程序帮用户在多种资产之间路由。

使用时通常需要配合 interface（如 Q9 的 `..` rest pattern）声明 dyn record 至少要满足的字段契约。有了 dyn record，Aleo 才能在保持 ZK 验证的前提下写出真正可复用的通用协议。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: `storage vector` 是 Leo 提供的链上动态数组，核心操作：

| 操作 | 语义 |
|------|------|
| `push(value)` | 在末尾追加一个元素 |
| `pop() -> T` | 弹出并返回末尾元素 |
| `get(index) -> T` | 按下标读取元素 |
| `set(index, value)` | 按下标写入元素 |
| `len() -> u32` | 返回当前长度 |
| `contains(value)` | 判断是否存在某元素 |
| `clear()` | 清空整个 vector |

关键约束：
- 必须在 **`async function` / `finalize` 块**里读写，因为这是链上 public 状态。
- transition 链下部分**不能直接操作** storage vector。
- 适合表达"有序、可枚举、长度可变"的公开状态，如注册表、白名单、排行榜等。如果只需要键值查找则用 mapping 更合适。
