# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。


## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 在 Leo 中，函数的输入参数和返回值如果没有显式标注 `public`，默认就是 `private`。

- **private 值**：只在用户本地执行 transition 时存在，链上看不到明文，只通过 ZK 证明保证计算被正确执行。
- **public 值**：会作为交易的明文出现在链上，全网可见，且可在 `finalize` / `async function` 中参与链上状态更新。

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
        // Tuple: (u8, [Point; 3])
        let data: (u8, [Point; 3]) = (
            1u8,
            [
                Point { x: 1u32, y: 2u32 },
                Point { x: 3u32, y: 4u32 },
                Point { x: 5u32, y: 6u32 },
            ],
        );

        // 1. 取 tuple 的第 0 个元素（u8）
        let tag: u8 = data.0;

        // 2. 取 tuple 的第 1 个元素（[Point; 3] 数组）
        let points: [Point; 3] = data.1;

        // 3. 取数组中的某个 struct
        let p0: Point = data.1[0u32];

        // 4. 一路点下去，取 struct 的字段
        let x0: u32 = data.1[0u32].x;   // = 1u32
        let y2: u32 = data.1[2u32].y;   // = 6u32

        return x0 + y2;
    }
}
```
访问规则一句话：tuple 用 .N 索引位置，array 用 [i] 索引下标，struct 用 .field 取字段，三者可以任意串起来。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 是 record 的强制字段，类型为 `address`，标识这条 record 归谁所有。它在 Aleo 隐私模型里同时承担两个职责：

1. **访问控制（spend 权限）。** 只有持有 `owner` 对应私钥的人才能在 transition 里把这条 record 作为输入花掉（生成 nullifier）。这相当于"私钥即所有权"在 record 模型里的体现。
2. **加密目标。** record 在链上是密文，加密用的是 `owner` 的 view key。也就是说，这条 record 的内容只有 owner 自己（或其授权方）解得开，其他人即使能在链上看到它的 commitment 也无法读出金额、其他自定义字段等明文。


---

**Q4. 程序中的 final 是什么？**

A: 这里的 "final" 指 `finalize`（或新版 Leo 中的 `async function` 块），是 Aleo 程序"链下 + 链上"两段式执行模型的链上部分。

一个完整的调用流程：

1. **transition（链下）**：用户本地执行，处理 private 输入，生成 ZK 证明，可以创建/花费 records。这一段全网节点不会重新执行，只验证证明。
2. **finalize（链上）**：transition 完成后触发，由全网节点重新执行，操作 public 的 `mapping` 状态（例如更新公开余额、计数器、注册表）。

为什么需要 finalize：

- record 模型擅长表达私有、用户独占的状态，但全局共享、需要原子读写的状态（比如 token 的 public 余额表、NFT 注册表）必须放链上 mapping 里。
- finalize 让节点对"公开状态变更"达成共识，同时保持 transition 部分的隐私。
- 它的输入只能是 transition 的 public 输出，**finalize 内不能再访问 private 数据**——这是隐私边界。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 使用 `function` 关键字（：

```leo
program example.aleo {
    // helper function：纯计算逻辑，可被 transition / function 复用
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
- **可在 transition、其他 function 内被调用**，用于把复杂逻辑拆出来复用。
- **会被一起编译进电路**，所以可以被 ZK 证明覆盖。
- 不暴露给外部直接调用（只有 `transition` 才是程序的对外入口）。

---

**Q6. helper functions 能否创建 records？**

A: 不能。 在 Leo 中，只有 `transition` 才能创建（mint）或花费（spend）records。helper function 只能做纯计算，不能在返回值里包含新的 record，也不能消费传入的 record。

原因在于 record 的电路语义：

- **创建 record** 意味着要往 transaction 的 output commitments 里加一条，这是链下/链上协议层的事件。
- **花费 record** 意味着要发出 nullifier、并附带所有权证明。
- 这些副作用必须发生在 transition 的边界上，编译器才能正确生成对应的 ZK 约束和交易结构。如果 helper function 也能凭空产生 record，电路里就难以保证 record 的总数、唯一性和 nullifier 的正确性。

---

**Q7. constructor 的目的是什么？**

A: `constructor` 用于程序部署时执行一次的初始化逻辑，类似 Solidity 的 `constructor`。

典型用途：

- 初始化 `mapping`，例如把 admin 地址写入 `mapping admin: u8 => address`。
- 设置 token 的 metadata（名称、符号、精度）。
- mint 初始供应量给部署者。
- 写入一些链上不可变的配置参数。

关键性质：

- 只在部署 transaction 中执行一次，部署完成后无法再被外部调用。
- 不接受 private 输入（部署本身是公开行为，输入参数会落在链上）。
- 让"部署即就绪"成为可能，避免之前那种"部署后还得手动调一笔 init transition、且要靠社会共识保证别人没抢先调"的尴尬。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: Leo 通过多接口实现 + 接口组合两种方式组合 interface：

1. **一个 struct/record 同时实现多个 interface**——在声明时把多个 interface 用 `+` 或逗号列出：

   ```leo
   record Token implements Ownable + Transferable {
       owner: address,
       amount: u64,
   }
   ```

2. **interface 本身可以继承/组合其他 interface**，形成更高一级的复合契约：

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

这样，**任何实现了 `Asset` 的类型就同时满足 `Ownable` 和 `Transferable`**，调用方可以用更通用的接口类型来书写函数签名，达到面向接口编程的效果。

---

**Q9. record interface 中 `..` 的含义是什么？**

A: `..` 是 rest pattern（剩余字段占位符），含义是"这个 record 还有其它字段，但我这里不关心、也不约束"。

应用场景：定义一个通用的 record interface 时，只想必须有哪些字段（如 `owner`），而不想限制其它字段：

```leo
interface AnyOwned {
    owner: address,
    ..   // 其余字段任意
}
```

只要某个具体的 record 拥有 `owner: address`，无论它额外有 `amount`、`metadata`、`expires_at` 还是别的什么字段，都满足 `AnyOwned` 这个接口。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当 transition 需要接受/返回类型在编译期未知的 record 时，使用 `dyn record`。

典型场景：

- **通用 Escrow / Vault**：合约要托管任意项目方发行的 record，不能在编写时就把 record 类型写死。
- **通用 Marketplace**：挂单合约要支持任意 NFT、任意 token record，按统一接口处理。
- **跨程序的中介逻辑**：一个 router/agent 程序帮用户在多种资产之间路由，输入参数的具体 record 类型由调用方决定。

使用条件：通常需要配合 interface（如 Q9 的 `..` rest pattern）声明 dyn record 至少要满足的字段契约，例如"必须有 `owner: address`"。**有了 dyn record，Aleo 才能在保持 ZK 验证的前提下写出真正可复用的通用协议**，而不是为每种资产复制一份合约。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: `storage vector` 是 Leo 提供的链上动态数组（相当于 `mapping` 之外的另一种 public 存储原语），核心操作：

| 操作                 | 语义                                   |
| -------------------- | -------------------------------------- |
| `push(value)`        | 在末尾追加一个元素                     |
| `pop() -> T`         | 弹出并返回末尾元素                     |
| `get(index) -> T`    | 按下标读取元素                         |
| `set(index, value)`  | 按下标写入元素                         |
| `len() -> u32`       | 返回当前长度                           |
| `contains(value)`    | 判断是否存在某元素                     |
| `clear()`            | 清空整个 vector                        |

关键约束（和 `mapping` 类似）：

- 必须在 **`async function` / `finalize` 块**里读写，因为这是链上 public 状态。
- transition 链下部分**不能直接操作** storage vector，只能通过 public 参数把变更意图传给 finalize。
- 适合表达"有序、可枚举、长度可变"的公开状态，例如**注册表、白名单、排行榜、提案列表**；如果只需要键值查找则用 mapping 更合适。
