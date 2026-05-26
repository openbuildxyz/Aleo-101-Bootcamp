# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: Leo 中函数的**参数和返回值**，如果不显式标 `public`，编译器会**默认视为 `private`**。

```leo
program example.aleo {
    @noupgrade
    constructor() {}

    // x 显式 public，y 没标 → 默认 private
    fn main(public x: u64, y: u64) -> u64 {
        return x + y;
    }
}
```

- **`public`**——值以明文形式上链，全网都能看到；
- **`private`**（默认）——值在链上以**密文（ciphertext）**形式存在，等同于一段乱码，只有持有 view key 的人能解密；
- 如果想让代码更易读，也可以显式写 `private`，效果完全相同。

这一设计是 Aleo 整个"默认隐私"定位的语言级落地——开发者**什么都不写就拿到隐私**，要公开反而需要主动加 `public` 关键字。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: 直接看一个 Leo 程序示例：

```leo
program nested.aleo {
    @noupgrade
    constructor() {}

    struct Point {
        x: u32,
        y: u32,
    }

    fn main(public a: u32, b: u32) -> u32 {
        // 先构造一个 Point 数组
        let arr: [Point; 3] = [
            Point { x: a, y: b },
            Point { x: a + 1u32, y: b + 1u32 },
            Point { x: a + 2u32, y: b + 2u32 },
        ];
        // 再构造一个 tuple，里面包含一个 Point 和一个 [Point; 3] 数组
        // 注意：tuple 只能作为本地变量使用，不能作为 fn 的入参/返回值类型
        let pack: (Point, [Point; 3]) = (Point { x: a, y: b }, arr);

        // ---- 访问 tuple 中的元素：用 .0 / .1 ----
        let head: Point = pack.0;       // tuple 第 0 项：单个 Point

        // ---- 访问数组里的元素：用 [index] ----
        let first: Point = pack.1[0u32];   // 数组下标必须显式 u32

        // ---- 访问 struct 的字段：用 .字段名 ----
        let hx: u32 = head.x;           // head 这个 struct 的 x 字段

        // ---- 嵌套链式访问 ----
        let fy: u32 = pack.1[0u32].y;   // tuple.1 → 数组 → 第 0 个 Point → y 字段

        return hx + fy;
    }
}
```

（上面这段在本地用 `leo build` 实测可编译。）

**访问三种复合结构的语法小结：**

| 结构 | 访问语法 | 示例 |
|---|---|---|
| Tuple | `.索引`（从 0 开始） | `pack.0`, `pack.1` |
| Array | `[索引]`（索引必须显式带类型，如 `0u32`） | `arr[0u32]` |
| Struct | `.字段名` | `head.x`, `head.y` |
| 嵌套 | 链式连接 | `pack.1[0u32].y` |

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 是 record 的**第一个字段**，类型必须是 `address`，用来标记**这条 record 属于哪个地址**。

```leo
record Token {
    owner: address,   // ← 必填，且必须是第一个字段
    amount: u64,
    // ... 其他自定义字段
}
```

它的核心作用有三个：

1. **决定持有权**——只有 `owner` 字段里那个地址，配合相应的私钥，才能"花掉"这条 record（在 transition 里消耗它）；
2. **决定可解密性**——record 整体在链上是加密存储的，只有 owner 对应的 view key 才能在客户端把它解密回来，因此 owner 同时定义了"谁能看到这条 record 的明文"；
3. **撑起账户隐私**——账本不再以"地址 → 余额"的全局表索引状态，而是以 program ID + 加密 record 的方式存储，地址只出现在 record 内部，再加上密文化，账户行为画像因此被规避。

所以语法上 `owner` 只是个字段，语义上它**同时承载了所有权 + 隐私边界 + 防双花归属**。

> 顺手澄清一点：record 实际上还会自带 `_nonce`（防双花用的随机数）和 `_version`（升级追踪用的版本号）这两个字段，但它们是**虚拟机自动写入**的——开发者只需要写 `owner` 和自己的业务字段，**不需要、也不应该手动声明 `_nonce: group`** 之类的内部字段，写了反而会出错。

> 顺手另一点：和 `owner` 配套的两个内置操作数 **`self.signer`** 与 **`self.caller`** 在权限校验里要分清：
> - **`self.caller`** —— 当前函数的**直接调用者**，可能是另一个合约；
> - **`self.signer`** —— **最初签发整笔交易的用户地址**，跨多少层合约调用都不会变。
>
> 在拍卖、转账这类简单场景里，用 `self.caller` 够用（讲师在 Lec2 拍卖 demo 里也用的它）；但**写跨合约的权限检查**时，如果你只想认"原始用户"、不让中间合约劫持身份，**必须用 `self.signer`**。类似 EVM 里 `msg.sender` vs `tx.origin`，但在 Aleo 跨合约动态分派场景下更关键。

> 配套要提一对**身份操作数**，写权限判断时要分清：
> - **`self.caller`** —— 当前函数的直接调用者，**可能是另一个合约**；
> - **`self.signer`** —— 最初签发整笔交易的用户地址（永远是 EOA），**跨多少层合约调用都不会变**。
>
> 类似 EVM 里 `msg.sender` vs `tx.origin` 的关系。课程拍卖 demo 里用的是 `self.caller`（场景简单够用），但做"只允许原始用户操作"这类严肃权限检查时，**必须用 `self.signer`**，否则可能被中间代理合约劫持身份。

---

**Q4. 程序中的 final 是什么？**

A: `final` 是 Leo 4.0+ 里专门的关键字，标记一段**链上执行逻辑**，是 Aleo "**混合虚拟机模型**"的关键。它在 Leo 里有两种写法：

**写法 1 — 内联 `final {}` 块（常用）**：函数主体执行完之后返回一个 `final` 块，块内逻辑由链上执行：

```leo
program counter.aleo {
    @noupgrade
    constructor() {}

    mapping accumulator: u8 => u64;

    fn increment() -> Final {
        return final {
            let cur: u64 = accumulator.get_or_use(0u8, 0u64);
            accumulator.set(0u8, cur + 1u64);
        };
    }
}
```

- 函数返回类型写成 `-> Final`（首字母大写）；
- `return final { ... };` 把 final 块作为返回值交给链上节点；
- 也可以混合返回：`-> (Token, Final)`，既返回隐私 record 又触发链上逻辑。

**写法 2 — 顶层 `final fn`（适合复用的链上逻辑）**：在 `program {}` **外面**单独声明一个 `final fn`，由 program 内的普通 `fn` 调用：

```leo
program counter.aleo {
    @noupgrade
    constructor() {}

    mapping accumulator: u8 => u64;

    fn increment() -> Final {
        return final { do_increment(); };
    }
}

final fn do_increment() {
    let cur: u64 = Mapping::get_or_use(accumulator, 0u8, 0u64);
    Mapping::set(accumulator, 0u8, cur + 1u64);
}
```

**为什么需要 `final`：**

- 函数主体在**链下虚拟机**执行（用户本地），所有计算保持隐私；
- 但链下虚拟机**读不到链上共享状态**（如 mapping、其他用户的公开余额）——因为这种链下环境本身是"断网"的，否则隐私就破了；
- 真正写到链上的共享状态（计数器、公开余额、白名单等）必须**链上节点执行才能更新**；
- `final` 正好填这个缺口：它里面的代码**由链上节点执行**，可以读写 mapping、与其他合约的公开状态交互。

执行流程：

```
用户本地：fn 主体 → 生成 ZK 证明 + 准备 final 输入
              ↓
链上节点：验证证明 ✓ → 执行 final 块逻辑 → 更新链上状态
```

注意：**所有 `final` 里的数据都是公开的**——因为节点必须看到具体数值才能运算，所以涉及隐私的逻辑必须留在 fn 主体里，只把"该公开的部分"丢进 `final`。

⚠️ 一个容易踩的坑：**就算某个参数在 fn 签名上标了 `private`（或省略默认 private），一旦你把它作为输入交给 `final` 块/`final fn`，它就会在链上被公开**——`final` 是隐私的硬边界，跨过去就回不来。要保密的值绝对不能传进 `final` 的输入里。

📎 补一点结构：**`final fn` 之间可以互相调用、形成嵌套**（比如 `Final F` 里调用 `Final G` 和 `Final H`），这样链上逻辑也能像普通函数一样拆模块、复用——内联 `final {}` 也可以直接调用顶层 `final fn`。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 在 `program` 块**外面**用 `fn` 关键字声明，就是一个 helper（也叫 internal function）：

```leo
// program 外面声明 → helper function（内部辅助函数）
fn add_u32(x: u32, y: u32) -> u32 {
    return x + y;
}

fn max_u32(a: u32, b: u32) -> u32 {
    if a > b {
        return a;
    } else {
        return b;
    }
}

program calculator.aleo {
    @noupgrade
    constructor() {}

    // program 内的 fn 才是 entry function（外部可调用）
    fn compute(public a: u32, b: u32) -> u32 {
        let s: u32 = add_u32(a, b);      // ← 调用 helper
        let m: u32 = max_u32(a, b);      // ← 调用 helper
        return s + m;
    }
}
```

> ⚠️ 命名小坑：`add`、`sub`、`mul`、`div` 等是 Aleo Instruction 的保留 opcode，**不能用作 program 内 `fn` 的名字**（在 program 外的 helper 倒可以）。常见做法是加后缀，比如 `add_u32`、`do_add`。

判断规则一句话：

- **在 `program` 块内声明的 `fn`** = entry function（外部可调用）；
- **在 `program` 块外声明的 `fn`** = helper / internal function，**只能被本合约内部调用**，外部用户和其他合约都看不见。
- 同理还有顶层的 `final fn` —— 见 Q4 ——专门用于链上执行的辅助函数。

helper 的典型用途：把重复用到的纯计算逻辑提取出来复用（数学运算、哈希、字段拼装等），让 transition 主体保持清爽。

---

**Q6. helper functions 能否创建 records？**

A: **不能**。helper functions 只能做**纯计算**，不能创建（也不能消耗）record。

原因可以从 Aleo 的执行模型反推：

1. **record 的创建必须绑定 ZK 证明**——每生成一条新 record，链上节点要通过 transition 的 ZK 证明确认它合法（没有凭空造钱、所有权正确等）；
2. **ZK 证明是 transition 维度的**——一个 transition = 一个独立的 ZK 电路 = 一份"消耗旧 record + 产出新 record"的状态转换证明；
3. helper function 没有自己的 ZK 电路，只是被 transition 调用时**内联展开**到 transition 的电路里——它不能独立生成 record，因为没有自己的"状态转换边界"；
4. **owner / nonce / commitment 等关键字段**也需要在 transition 上下文里由编译器/运行时设置，helper 拿不到这套机制。

helper 可以**读取** record 字段（作为参数传进来），可以基于这些字段做计算返回普通类型（u64、bool、struct 等），但**返回值不能是 record 类型**。要创建 record，必须在 transition 里写。

---

**Q7. constructor 的目的是什么？**

A: Leo 里的 `constructor`**不是用来初始化数据**（不像 Solidity），它是用来**定义这个程序的可升级逻辑**——决定"这份合约将来能不能升级、谁能升级、什么条件下能升级"。

Leo 提供 4 种 constructor 写法：

| 注解 / 写法 | 升级权限 | 适用场景 |
|---|---|---|
| **`@noupgrade`** | 任何人都不能升级 | 想要"代码即法律"、永久不可变的合约 |
| **`@admin(address="aleo1...")`** | 只有指定的 admin 地址可升级 | 项目方运维、需要紧急修 bug 的场景 |
| **`@checksum(mapping="...", key="...")`** | 升级时必须匹配指定 mapping 在指定 key 上存的合约 checksum | DAO 治理：链上投票通过后，把新合约 checksum 写进 mapping，升级自动放行 |
| **`@custom`** | 开发者手写任意升级条件 | 多签、时间锁、复合治理等 |

```leo
program token.aleo {
    @noupgrade           // 不可升级（默认推荐）
    constructor() {}

    // 或换成：@admin(address="aleo1abc...xyz")  → admin 可升级
    // 或换成：@checksum(mapping="credits.aleo/approved", key="0field")
    // 或换成：@custom（然后自己在 constructor 体内写校验逻辑）
}
```

`leo new` 生成的模板默认就是 `@noupgrade`。前 3 种用注解就够了，Leo 编译器会自动生成对应的 constructor 逻辑；`@custom` 留给特殊场景，开发者在 constructor 体内自行写校验：

```leo
program timelock_example.aleo {
    @custom
    constructor() {
        // self.edition：协议层自动维护的版本号。首次部署 = 0，每次升级 +1。
        // 等价于"只有非首次部署时（即升级时）才需要校验"。
        if self.edition > 0u32 {
            // 自定义升级条件：要求当前区块高度大于 1300
            assert(block.height > 1300u32);
        }
    }
}
```

升级相关的内置操作数还有：

- **`self.edition`** —— 程序版本号，每次升级自动 +1；
- **`self.program_owner`** —— 提交此次部署/升级交易的地址；
- **`self.checksum`** —— 虚拟机自动计算的此次部署/升级 32 字节合约校验和，用于 `@checksum` 模式匹配。

**关键提醒**：constructor 的升级逻辑本身**不可升级、永久写死在合约里**。部署前必须确认这套逻辑正确，部署后就改不掉了。

所以语义上：`constructor` 是 Aleo 程序的"治理入口"，不是"对象初始化器"。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 在 `program` 名称后面加冒号 `:`，列出要实现的接口，**多个接口用 `+` 连接**：

```leo
// 先声明两个接口
interface Transfer {
    record Token {
        owner: address,
        balance: u64,
        ..   // 见 Q9：实现方可以加更多字段
    }
    fn transfer(token: Token, to: address, amount: u64) -> Token;
}

interface Pausable {
    mapping paused: u8 => bool;
    fn pause() -> Final;
}

// program 同时实现 Transfer 和 Pausable
program my_token.aleo: Transfer + Pausable {
    @noupgrade
    constructor() {}

    // 编译器会强制检查：上面声明的所有字段、函数签名都必须满足
    record Token {
        owner: address,
        balance: u64,
        nonce: field,   // 自己加的额外字段，允许
    }

    mapping paused: u8 => bool;

    fn transfer(token: Token, to: address, amount: u64) -> Token { /* ... */ }
    fn pause() -> Final { /* ... */ }
}
```

声明 `: Transfer + Pausable` 之后，编译器会强制 `my_token.aleo` **同时**满足两个接口的全部要求——任何字段、函数签名缺一不可，但允许在此基础上加更多自定义内容。

---

**Q9. record interface 中 `..` 的含义是什么？**

A: `..` 表示**这个 interface 只要求实现方"至少包含"这些字段，允许再添加更多字段**——本质是"开放式约束 / 最小要求"。

```leo
interface Transfer {
    record Token {
        owner: address,
        balance: u64,
        ..             // ← 实现方可以加任意更多字段
    }
}

// 实现 1：刚好满足
program token_a.aleo : Transfer {
    record Token {
        owner: address,
        balance: u64,
    }
}

// 实现 2：在最小集合之上加字段，也合法
program token_b.aleo : Transfer {
    record Token {
        owner: address,
        balance: u64,
        nonce: field,        // ← 额外字段
        metadata: [u8; 32],  // ← 额外字段
    }
}
```

**意义**：让接口只**锁定最小契约**，给具体实现留扩展空间。否则一旦接口写死字段列表，所有 token 都得长得一模一样，业务无法做差异化（如稳定币需要 KYC 标记、NFT 需要 metadata 等）。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当合约要**调用外部合约**、且对方的 record 类型**编译期未知**（只确定它符合某个 interface）时，用 `dyn record` 来描述输入/输出。

典型场景：写一个**通用 wrapper**，给一组都实现 ARC20 接口的 token 合约统一调用 transfer：

```leo
// 接口约束：任何 ARC20 必须有 Token record 和 transfer_private 函数
interface ARC20 {
    record Token {
        owner: address,
        balance: u64,
        ..
    }
    fn transfer_private(t: Token, to: address, amount: u64) -> Token;
}

program router.aleo {
    @noupgrade
    constructor() {}

    // target 是外部合约的 identifier，t 是该外部合约的 record（动态类型）
    fn main(
        public target: identifier,
        t: dyn record,           // ← 我不知道具体类型，但保证它符合 ARC20
        to: address,
        amount: u64,
    ) -> dyn record {            // ← 返回值同样动态
        // 通过接口 + target 动态分派
        return ARC20@(target)::transfer_private(t, to, amount);
    }
}
```

关键点：

1. **静态分派不够用**——如果直接写具体 record 类型（如 `token`），就只能调用某一个特定合约，做不到"路由到任意符合 ARC20 的合约"；
2. **`dyn record` 告诉编译器**：这个 record 来自外部合约，运行时确定，但接口形状（owner、balance 等字段、必须有的函数）必须满足约束；
3. **使用前提**：必须先定义 interface 来锁定字段和函数签名，否则编译器无法做安全检查。

简单说：`dyn record` 是 Leo 实现**动态分派 / 路由模式**的语法基础。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: storage vector（链上动态数组）是 Aleo 的 storage 类型之一，自带一套类 Rust `Vec` 的内置辅助函数。核心操作：

| 操作 | 语义 | 复杂度 |
|---|---|---|
| **`push(elem)`** | 在尾端追加一个新元素 | O(1) |
| **`pop()`** | 移除并返回最后一个元素 | O(1) |
| **`get(index)`** | 读取指定下标的元素值 | O(1) |
| **`set(index, value)`** | 把指定下标的元素值替换成新值 | O(1) |
| **`len()`** | 返回当前元素数量（vector 总长度） | O(1) |
| **`swap_remove(index)`** | 移除指定下标的元素，并把最后一个元素**搬到该下标位置**填补空缺 | O(1) |

`swap_remove` 是常用的 O(1) 删除技巧：常规 remove 要 O(n) 移动后续元素，`swap_remove` 直接拿尾巴填洞，代价是**不保留原顺序**。和 Rust 的 `Vec::swap_remove` 语义完全一致。

```leo
program counter_pool.aleo {
    @noupgrade
    constructor() {}

    // storage vector 声明：方括号包裹元素类型，无需指定长度
    storage entries: [u64];

    fn push_entry(public x: u64) -> Final {
        return final {
            entries.push(x);                                       // 添加
            let n: u32 = entries.len();                            // 长度
            let first: u64 = entries.get(0u32).unwrap_or(0u64);    // 读取（get 返回 Option，需 unwrap）
            entries.set(0u32, x + first);                          // 更新
            // entries.swap_remove(2u32);                           // 删除（不保序）
            // let last: u64 = entries.pop().unwrap_or(0u64);       // 弹出末尾
        };
    }
}
```

（上面这段在本地用 `leo build` 实测可编译。）

**两个易踩的坑：**

1. `entries.get(i)` 返回的是 `u64?`（Optional），用 `unwrap_or(default)` 取实际值——因为下标可能越界，Leo 不让它静默成 0；
2. 函数名不能是 `add` / `sub` / `mul` 这种保留 opcode，会被 Aleo Instruction parser 撞名（所以例子里写的是 `push_entry`）。

注意：storage 操作只能在 `final` 块（或 `final fn`）内进行（链上执行），不能在 fn 主体（链下执行）里调用——这是 Q4 讲的"混合 VM 模型"在 Leo 语法层面的体现。
