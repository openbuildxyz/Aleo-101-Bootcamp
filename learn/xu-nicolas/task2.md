# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A:

Leo 的默认语义是：没有显式标记为 `public` 的输入、输出或 record 字段，默认按 `private` 处理。private 数据不会直接公开到链上，而是在零知识证明中作为私有 witness 被证明其计算正确。

例如 record 字段如果不写 `public` 或 `private`，Leo 默认把它当作 `private`：

```leo
record Token {
    owner: address,
    amount: u64,
}
```

上面 `owner` 和 `amount` 都是 private 字段；如果希望链上可见，需要显式写成 `public amount: u64`。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:

可以先定义一个 struct，然后让 tuple 的某个元素是 struct array。访问顺序是：先用 `.0`、`.1` 访问 tuple 元素，再用 `[index]` 访问 array，再用 `.field` 访问 struct 字段。

```leo
struct Point {
    x: u32,
    y: u32,
}

program tuple_array_struct.aleo {
    fn example() -> u32 {
        let points: [Point; 2] = [
            Point { x: 1u32, y: 2u32 },
            Point { x: 3u32, y: 4u32 },
        ];

        let data: ([Point; 2], u32) = (points, 10u32);

        let first_x: u32 = data.0[0u32].x;
        let second_y: u32 = data.0[1u32].y;

        return first_x + second_y + data.1;
    }
}
```

这里 `data.0` 是 tuple 的第一个元素，也就是 `[Point; 2]`；`data.0[0u32]` 是第一个 `Point`；`data.0[0u32].x` 是这个 struct 里的 `x` 字段。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A:

`owner: address` 表示这个 record 的拥有者。Aleo record 是用户拥有的私有状态，只有 owner 对应账户能解密、使用或花费这个 record。record 类型必须包含 `owner` 字段；当 record 作为输入被消费时，系统还会使用 `_nonce`、`_version` 等隐含字段防止重复消费和保证 record 生命周期正确。

---

**Q4. 程序中的 final 是什么？**

A:

`final { }` 是 Leo 中用于链上 finalization 的代码块，主要用来读取或修改链上的 public state，比如 `mapping` 和 `storage`。包含链上逻辑的 entry `fn` 通常返回 `Final`，并在 `final { }` 中执行状态更新。

```leo
program counter.aleo {
    storage counter: u64;

    fn increment() -> Final {
        return final {
            let current: u64 = counter.unwrap_or(0u64);
            counter = current + 1u64;
        };
    }
}
```

`final` 中的操作是原子的：如果 finalization 失败，状态更新会回滚。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:

helper function 使用普通 `fn` 声明，但要写在 `program {}` 外面。它不能作为程序入口被外部直接调用，只能被 entry function 或其他 helper function 调用。helper function 的参数不写 `public` / `private` 可见性修饰符。

```leo
fn double(x: u64) -> u64 {
    return x * 2u64;
}

program helper_example.aleo {
    fn main(public input: u64) -> u64 {
        return double(input);
    }
}
```

---

**Q6. helper functions 能否创建 records？**

A:

不能。helper functions 只能做内部计算，不能产生 records。record 的创建应该放在 program 内的 entry `fn` 中完成。

---

**Q7. constructor 的目的是什么？**

A:

`constructor` 是部署和升级程序时运行的特殊函数，用来定义程序的升级策略和部署/升级校验逻辑。所有新程序都需要带 constructor。constructor 中的逻辑在第一次部署后不可变，如果断言失败，部署或升级交易会被拒绝。

常见模式包括：

```leo
program hello.aleo {
    fn ping() {
        return;
    }

    @noupgrade
    constructor() {}
}
```

`@noupgrade` 表示程序不可升级；也可以使用 `@admin`、`@checksum`、`@custom` 等模式控制升级权限。

---

**Q8. 如何组合多个 interfaces（接口）？**

A:

Leo 中可以用 `+` 组合多个 interfaces。一个 program 实现多个接口时，也是在 program 声明后用 `:` 加接口列表。

```leo
interface Transfer {
    record Token;
    fn transfer(token: Token, to: address, amount: u64) -> Token;
}

interface Balance {
    mapping balances: address => u64;
}

interface TokenStandard: Transfer + Balance {}

program my_token.aleo: TokenStandard {
    // 这里需要实现 TokenStandard 要求的 record、mapping 和 fn
}
```

也可以直接：

```leo
program my_program.aleo: Transfer + Balance {
    // ...
}
```

---

**Q9. record interface 中 `..` 的含义是什么？**

A:

在 record interface 中，`..` 表示接口只要求列出的字段必须存在，但允许实现方额外添加更多字段。

```leo
interface TokenLike {
    record Token {
        owner: address,
        amount: u64,
        ..
    }
}
```

实现这个 interface 的 program 里的 `Token` record 必须至少有 `owner` 和 `amount`，但还可以有 `memo`、`expiry` 等额外字段。

---

**Q10. 何时使用 dyn record（动态 record）？**

A:

当 record 的具体结构在编译期不知道，或者需要通过 interface / dynamic call 转发来自不同程序的 record 时，使用 `dyn record`。

典型场景是路由器、聚合器或标准接口调用：调用方只知道目标程序实现了某个接口，但不知道它的 record 具体有哪些字段。`dyn record` 允许程序接收、检查和转发这种 record，同时保留普通 record 的 owner 和隐私属性。

```leo
interface TokenStandard {
    record Token;
    fn transfer_private(token: Token, to: address, amount: u64) -> Token;
}

program router.aleo {
    fn route(target: identifier, input: dyn record, to: address, amount: u64) -> dyn record {
        return TokenStandard@(target)::transfer_private(input, to, amount);
    }
}
```

---

**Q11. storage vector 支持的核心操作有哪些？**

A:

storage vector 是链上的动态数组，声明方式类似：

```leo
storage id_numbers: [u64];
```

核心操作包括：

- `get(index)`：读取指定下标，返回 `T?`；越界返回 `none`
- `len()`：返回当前长度，类型是 `u32`
- `set(index, value)`：设置指定下标的值
- `push(value)`：在末尾追加元素
- `pop()`：移除并返回最后一个元素
- `swap_remove(index)`：移除指定下标元素，并用最后一个元素补位
- `clear()`：清空逻辑长度

这些操作只能在 `final { }` block 或 `final fn` 中使用。跨程序访问外部 storage vector 时只能读，不能修改。
