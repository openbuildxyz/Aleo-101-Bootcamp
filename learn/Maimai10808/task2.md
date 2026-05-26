# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A:

Leo 中的 “Private by Default” 指的是：如果函数参数、返回值或 record 字段没有显式标记为 public，它们默认就是 private。

在 Aleo/Leo 中，private 数据只在证明者本地参与计算，不会以明文形式出现在链上；验证者只能看到公开输入、公开输出以及零知识证明本身。

例如：

```leo
fn add(public a: u32, b: u32) -> u32 {
    return a + b;
}
```

这里 `public a: u32` 是公开输入，链上可见；而 `b: u32` 没有写 `public`，所以默认是 private，只有证明者知道。

如果返回值需要公开，也要显式写成：

```leo
fn privacy_demo(public visible_input: u32, secret_input: u32) -> public u32 {
    let result: u32 = visible_input + secret_input;
    return result;
}
```

所以 Leo 的默认语义是：不主动公开的数据默认保持隐私。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:

可以先定义一个 struct，再创建包含 struct 数组的 tuple。

例如：

```leo
struct Point {
    x: i32,
    y: i32,
}

fn demo_tuple_with_array_structs() -> i32 {
    let points: [Point; 3] = [
        Point { x: 1i32, y: 2i32 },
        Point { x: 3i32, y: 4i32 },
        Point { x: 5i32, y: 6i32 },
    ];

    let data: ([Point; 3], u32) = (points, 100u32);

    let first_x: i32 = data.0[0u32].x;
    let second_y: i32 = data.0[1u32].y;
    let score: u32 = data.1;

    return first_x + second_y;
}
```

这里：

- `data.0` 访问 tuple 的第一个元素，也就是 `[Point; 3]` 数组。
- `data.0[0u32]` 访问数组中的第一个 `Point`。
- `data.0[0u32].x` 访问第一个 `Point` 里的 `x` 字段。
- `data.1` 访问 tuple 的第二个元素，也就是 `100u32`。

因此访问路径可以理解为：

```text
tuple 位置索引 -> 数组索引 -> struct 字段
```

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A:

`owner` 是 Aleo record 中必须存在的字段，用来表示这个 record 的所有者。

例如：

```leo
record Token {
    owner: address,
    amount: u64,
}
```

这里的 `owner` 表示这个 `Token` record 属于哪个 Aleo 地址。

它的作用主要有三个：

1. 标识 record 的所有权。
2. 决定谁可以解密和使用这个 record。
3. 在转账、消费 record 时，用来验证调用者是否有权限操作该 record。

例如在安全转账中，可以检查：

```leo
assert_eq(self.caller, token.owner);
```

这样可以防止别人花费不属于自己的 record。

简单理解，`owner` 就像 record 的“持有人地址”。只有 `owner` 对应的账户才能解密、使用或消费这个 record。

---

**Q4. 程序中的 final 是什么？**

A:

`final` 是 Leo/Aleo 中用于执行链上公开状态更新的部分。

Aleo 程序分为两个阶段：

1. 链下执行阶段：入口函数在用户本地执行，处理私有数据并生成零知识证明。
2. 链上执行阶段：`final` 块在链上执行，修改公开状态，例如 `mapping`。

例如：

```leo
mapping account_balances: address => u64;

fn mint_public(public receiver: address, public amount: u64) -> Future {
    return final {
        let current_balance: u64 = account_balances.get_or_use(receiver, 0u64);
        account_balances.set(receiver, current_balance + amount);
    };
}
```

这里入口函数本身不能直接修改 `mapping`，它只能返回一个 `Future`。真正修改 `mapping` 的逻辑放在：

```leo
return final {
    ...
};
```

里面。

所以 `final` 的作用是：在链上执行公开状态变更逻辑，尤其是读写 `mapping`。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:

helper function 是定义在 `program {}` 外部的普通 `fn` 函数。

例如：

```leo
fn add_two(a: u32, b: u32) -> u32 {
    return a + b;
}

fn multiply_two(a: u32, b: u32) -> u32 {
    return a * b;
}

fn compute(x: u32, y: u32, z: u32) -> u32 {
    let sum: u32 = add_two(x, y);
    let result: u32 = multiply_two(sum, z);
    return result;
}

program example.aleo {
    fn calculate(public x: u32, y: u32, z: u32) -> u32 {
        let result: u32 = compute(x, y, z);
        return result;
    }
}
```

helper function 的特点是：

- 定义在 `program {}` 外部。
- 不能被外部用户直接调用。
- 只能被程序中的入口函数或其他 helper function 调用。
- 编译时会被内联到调用它的入口函数中。

它主要用于复用逻辑、简化入口函数代码。

---

**Q6. helper functions 能否创建 records？**

A:

一般来说，helper function 不能像入口函数那样直接完成 record 的创建并作为链上输出。

在 Aleo 中，record 的创建通常发生在入口函数中：当入口函数返回一个 record 时，就表示创建了一个新的 record。

例如：

```leo
record Token {
    owner: address,
    amount: u64,
}

fn mint_token(public receiver: address, amount: u64) -> Token {
    let new_token: Token = Token {
        owner: receiver,
        amount: amount,
    };

    return new_token;
}
```

helper function 可以辅助计算创建 record 所需的数据，比如计算金额、检查条件、返回普通值或 struct，但真正作为程序输出创建 record，通常应该由 `program {}` 内部的入口函数完成。

因此可以理解为：

- helper function 可以辅助 record 创建逻辑。
- record 的实际创建和输出应放在入口函数中。

---

**Q7. constructor 的目的是什么？**

A:

`constructor` 是程序部署或初始化时使用的特殊函数。

在示例中，`constructor` 通常这样写：

```leo
@noupgrade
constructor() {}
```

这里的目的主要是配合 `@noupgrade`，防止程序后续被升级。

也就是说：

```leo
@noupgrade
constructor() {}
```

表示这个程序部署后不可升级，从而保证程序逻辑不会被后续修改。

`constructor` 也可以用于程序初始化相关逻辑，比如设置初始状态。不过在材料示例里，它主要用于标记程序不可升级。

---

**Q8. 如何组合多个 interfaces（接口）？**

A:

在 Leo 中，可以通过 `interface` 约束类型结构，并通过组合多个 interface 来表达一个类型需要同时满足多组字段要求。

组合多个 interface 的核心思路是：把多个接口要求合并到同一个类型声明或函数约束中，让一个类型同时具备这些接口定义的字段或能力。

例如可以把通用字段拆成多个 interface：

```leo
interface Ownable {
    owner: address,
}

interface BalanceLike {
    amount: u64,
}
```

然后在需要时组合使用，让某个 record 或参数同时满足所有接口约束。

概念上可以理解为：

```text
Ownable + BalanceLike = 同时拥有 owner 字段和 amount 字段的数据形状
```

这样做的好处是可以复用接口定义，不需要在每个 record 或数据结构里重复描述相同字段。

---

**Q9. record interface 中 `..` 的含义是什么？**

A:

record interface 中的 `..` 表示“允许还有其他字段”。

也就是说，interface 只关心它声明出来的字段，`..` 表示实现这个 interface 的 record 可以包含额外字段。

例如：

```leo
interface TokenLike {
    owner: address,
    amount: u64,
    ..
}
```

这表示某个 record 只要至少包含：

- `owner: address`
- `amount: u64`

就可以满足这个 interface。它还可以有其他字段，比如：

```leo
record PrivateToken {
    owner: address,
    amount: u64,
    metadata: field,
}
```

这里 `metadata` 是额外字段，不影响它满足 `TokenLike` 这个 interface。

所以 `..` 的作用是：让 record interface 只约束必要字段，同时允许 record 拥有更多字段。

---

**Q10. 何时使用 dyn record（动态 record）？**

A:

当函数不需要依赖某一个具体 record 类型，而是希望接收“满足某个 record interface 的任意 record”时，可以使用 dyn record。

简单理解：

- 普通 record：指定具体 record 类型。
- dyn record：指定 record 需要满足的接口形状。

例如，如果一个函数只关心 record 是否有：

- `owner: address`
- `amount: u64`

而不关心它到底是 `Token`、`PrivateToken` 还是其他 record，就适合使用 dyn record。

适合使用 dyn record 的场景包括：

1. 想写更通用的 record 处理逻辑。
2. 多种 record 结构有相同字段。
3. 函数只依赖 record interface，而不依赖具体 record 名称。
4. 想提高代码复用性，避免为每种 record 重复写类似逻辑。

例如概念上可以这样理解：

```leo
interface TokenLike {
    owner: address,
    amount: u64,
    ..
}
```

那么函数可以接收满足 `TokenLike` 的动态 record，而不是绑定到某一个具体 record。

---

**Q11. storage vector 支持的核心操作有哪些？**

A:

storage vector 可以理解为链上存储中的顺序集合，适合保存一组同类型的数据。

它常见的核心操作包括：

1. `push`：向 vector 末尾追加元素。
2. `pop`：移除并返回末尾元素。
3. `get`：按索引读取元素。
4. `set`：按索引更新元素。
5. `len`：获取 vector 当前长度。
6. `contains`：检查是否包含某个元素。
7. `remove`：删除指定位置或指定元素。
8. 遍历读取：配合固定范围循环读取多个元素。

如果和 `mapping` 对比，`mapping` 更像键值表：

```leo
mapping account_balances: address => u64;
```

而 storage vector 更像一个按顺序排列的列表。

在真实使用时，要注意 storage vector 仍然属于链上状态，相关读写逻辑通常需要放在链上执行阶段，也就是类似 `final` 的公开状态处理逻辑中。
