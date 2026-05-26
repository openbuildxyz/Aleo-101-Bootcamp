# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: Leo 中函数的输入、输出以及 record 字段默认是 `private`。也就是说，除非显式标注为 `public`，这些值不会作为明文暴露在链上；执行者在本地用私有输入完成计算并生成零知识证明，网络只验证证明和必要的公开数据。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:

```leo
struct Point {
    x: u32,
    y: u32,
}

program tuple_array_struct.aleo {
    fn main() -> u32 {
        let data: ([Point; 2], u8) = (
            [
                Point { x: 1u32, y: 2u32 },
                Point { x: 3u32, y: 4u32 }
            ],
            9u8
        );

        let first_x: u32 = data.0[0].x;
        let second_y: u32 = data.0[1].y;

        return first_x + second_y;
    }
}
```

访问顺序是：先用 `data.0` 取 tuple 的第一个元素，也就是 `[Point; 2]` 数组；再用 `[index]` 取数组元素；最后用 `.x`、`.y` 访问 struct 字段。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 表示该 record 归哪个 Aleo 地址所有。record 会按 owner 加密，只有 owner 能解密并在后续交易中消费这个 record。它也是 record 所有权、消费权限和隐私状态归属的核心字段。

---

**Q4. 程序中的 final 是什么？**

A: `final` 是交易最终化阶段执行的链上逻辑。普通 `fn` 主要在本地执行并生成证明；`final { ... }` 或 `final fn` 会在证明通过后由网络执行，用来读取和更新公开状态，例如 `mapping`、`storage`。`final` 只能处理公开/可捕获的数据，不能访问私有 witness，也不能创建私有 record。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 在 Leo v4 中，辅助函数通常写成 program block 外部的普通 `fn`，然后在 program 内的入口 `fn` 中调用。它适合放校验、计算、哈希、格式转换等可复用逻辑。

```leo
fn double(x: u32) -> u32 {
    return x * 2u32;
}

program helper_example.aleo {
    fn main(x: u32) -> u32 {
        return double(x);
    }
}
```

---

**Q6. helper functions 能否创建 records？**

A: 不能。helper functions/closures 只能做内部计算，不能直接创建或返回 record。record 属于程序状态模型，通常只能在 program 的入口 `fn` 中创建并作为输出返回；辅助函数可以计算创建 record 需要的普通值，但 record 本身应在入口函数里构造。

---

**Q7. constructor 的目的是什么？**

A: `constructor` 用来定义程序部署或升级时的初始化/升级规则，尤其是程序是否可升级、由谁控制升级、如何校验升级等。它是不可变的部署级逻辑；如果想让程序永久不可升级，通常会使用类似 `@noupgrade constructor() {}` 的形式。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 可以用 `+` 把多个接口组合成一个新接口，然后让 program 实现组合后的接口。

```leo
interface Transfer {
    record Token;
    fn transfer(input: Token, to: address, amount: u64) -> Token;
}

interface Balances {
    mapping balances: address => u64;
}

interface TokenStandard : Transfer + Balances {}

program my_token.aleo : TokenStandard {
    // 必须实现 Transfer 和 Balances 中要求的 record、mapping、fn
}
```

---

**Q9. record interface 中 `..` 的含义是什么？**

A: `..` 表示接口只要求列出的字段必须存在，但实现方可以额外添加更多字段。它相当于对 record 形状做“部分约束”。

```leo
interface TokenLike {
    record Token {
        owner: address,
        amount: u64,
        ..
    }
}
```

这里要求实现方的 `Token` 至少有 `owner` 和 `amount`，但也可以再加 `memo`、`token_id` 等字段。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当函数需要接收或返回“运行时才确定具体程序/具体 record 类型”的 record 时使用 `dyn record`。典型场景是动态分发：例如 DEX 或路由程序想处理任何符合某个 token interface 的私有 token record，但部署时不知道未来会接入哪些 token 程序。`dyn record` 提供固定大小表示，并通过 Merkle proof 验证字段访问。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: storage vector 是持久化的链上 vector，核心操作包括：

- `push(value)`: 在末尾追加元素。
- `pop()`: 弹出并返回最后一个元素。
- `get(index)`: 读取指定索引的元素，通常返回 optional。
- `set(index, value)`: 更新指定索引的元素。
- `len()`: 返回 vector 长度。
- `swap_remove(index)`: 删除指定索引元素，并用最后一个元素填补该位置。
