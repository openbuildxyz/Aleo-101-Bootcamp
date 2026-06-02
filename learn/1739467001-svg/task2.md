# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 在 Leo 中，Record 的所有字段以及 entry 函数的所有输入和输出参数，如果不显式标注可见性，则默认是 `private` 的。Private 数据只存在于链下的零知识证明中，不会出现在链上交易里。只有被显式声明为 `public` 的数据才会以明文形式记录在链上。这种设计确保开发者必须有意识地选择公开哪些数据，从源头保护用户隐私。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: 
```leo
struct Point {
    x: u32,
    y: u32,
}

program test.aleo {
    fn main() -> u32 {
        // Tuple 包含一个 Point 数组和一个 u32 值
        let my_tuple: ([Point; 2], u32) = ([
            Point { x: 1u32, y: 2u32 },
            Point { x: 3u32, y: 4u32 }
        ], 10u32);

        // 1. 通过 .0 / .1 访问 Tuple 元素
        let points: [Point; 2] = my_tuple.0;
        let extra: u32 = my_tuple.1; // 10u32

        // 2. 通过 [index] 访问数组元素
        let first_point: Point = points[0];

        // 3. 通过 .field_name 访问 Struct 字段
        let x_val: u32 = first_point.x;  // 1u32
        let y_val: u32 = first_point.y;  // 2u32

        return x_val;
    }
}
```

总结访问方式：Tuple 用 `.0`, `.1` 等索引；Array 用 `[index]`；Struct 用 `.field_name`。也可以使用解构语法 `let (a, b) = my_tuple;` 来一次性取出 Tuple 的所有元素。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 是 Record 中唯一的必需字段（类型为 `address`），它指定了该 Record 的所有者。作用有三个方面：

1. **访问控制**：只有持有该地址对应私钥的用户才能解密和查看 Record 的内容
2. **消费权限**：只有 owner 才能将该 Record 作为 transition/fn 的输入参数来消费（spend）它
3. **隐私保障**：Record 在链上是加密的，除 owner 以外的任何人都无法读取其中的数据

此外，编译器会自动为 Record 插入 `_nonce: group` 和 `_version: u8` 两个隐藏字段，开发者无需手动声明。

---

**Q4. 程序中的 final 是什么？**

A: 在 Leo 4.0 中，`final` 用于定义需要在链上执行的状态更新逻辑。具体有两种形式：

**1. `final { }` 块**：写在 entry 函数内部，当函数需要修改链上公共状态（Mapping / Storage Variable / Storage Vector）时，函数返回类型为 `Final`，并在 return 语句中包含 `final { }` 块：

```leo
program example.aleo {
    mapping balances: address => u64;

    fn mint(receiver: address, amount: u64) -> Final {
        return final {
            let current: u64 = balances.get_or_use(receiver, 0u64);
            balances.set(receiver, current + amount);
        };
    }
}
```

**2. `final fn`**：定义在 `program {}` 块外部的可复用的链上逻辑函数，编译时会被内联到调用者的 `final { }` 块中：

```leo
final fn update_balance(receiver: address, amount: u64) {
    let current: u64 = balances.get_or_use(receiver, 0u64);
    balances.set(receiver, current + amount);
}
```

核心原则：`final { }` 块之外的逻辑在链下执行（通过 ZK 证明验证），`final { }` 块内的逻辑由所有验证节点在链上原子性执行以更新状态。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 辅助函数使用 `fn` 关键字，声明在 `program {}` 块**外部**：

```leo
// 辅助函数 —— 在 program 块外部定义
fn compute(a: u64, b: u64) -> u64 {
    return a + b;
}

program example.aleo {
    // entry 函数可以调用辅助函数
    fn transfer(receiver: address, amount: u64) {
        let balance: u64 = 1000u64;
        let new_balance: u64 = compute(balance, amount);
    }
}
```

辅助函数的调用规则：
- ✅ 可以调用：其他 helper fn
- ❌ 不能调用：entry fn（entry fn 只能被外部交易调用）
- ❌ 不允许直接或间接的递归调用

---

**Q6. helper functions 能否创建 records？**

A: **不能。** Record 只能在 `program {}` 块内部的 entry 函数中创建和消费。辅助函数（helper fn）定义在 `program {}` 块外部，不具备创建 Record 的能力。这是 Leo 的设计约束——Record 涉及链上资产的所有权变更，必须通过可被外部交易调用的 entry 函数来管理。

---

**Q7. constructor 的目的是什么？**

A: `constructor` 是在程序部署时自动执行一次的特殊函数，用于初始化链上状态。它通常与 `@noupgrade` 装饰器一起使用，表示程序部署后不可升级：

```leo
program bank.aleo {
    mapping balances: address => u64;
    storage counter: u64;

    @noupgrade
    constructor() {
        // 在部署时执行，初始化链上状态
    }
}
```

constructor 的特点：
- 只在程序首次部署到网络时执行一次
- 用于设置 Mapping、Storage Variable 等的初始值
- 部署后不会再被调用

---

**Q8. 如何组合多个 interfaces（接口）？**

A: Leo 4.0 提供两种方式组合多个接口：

**方式一：程序同时实现多个接口（使用 `+`）**

```leo
interface Transfer {
    record Token;
    fn transfer(input: Token, to: address, amount: u64) -> Token;
}

interface Pausable {
    mapping paused: address => bool;
    fn pause() -> (bool, Final);
}

// 使用 + 号组合，程序必须满足两个接口的全部要求
program my_token.aleo : Transfer + Pausable {
    record Token {
        owner: address,
        balance: u64,
    }
    mapping paused: address => bool;

    fn transfer(input: Token, to: address, amount: u64) -> Token {
        return Token { owner: to, balance: input.balance - amount };
    }

    fn pause() -> (bool, Final) {
        return (true, final {
            paused.set(self.caller, true);
        });
    }
}
```

**方式二：接口继承（使用 `:`）**

```leo
interface Base {
    fn get_value() -> u64;
}

interface Extended : Base {
    fn set_value(v: u64) -> u64;
}
// Extended 包含 Base 的所有要求 + 自己的要求
```

两种方式可以混合使用：`interface Token : Transfer + Balances {}`

---

**Q9. record interface 中 `..` 的含义是什么？**

A: 在接口的 Record 要求定义中，`..` 表示"实现者可以添加更多额外字段"。它允许接口只规定 Record 必须包含的最小字段集，而具体实现的程序可以在此基础上自由扩展字段：

```leo
interface Foo {
    record Bar {
        owner: address,  // 所有 Record 都必须有 owner
        baz: u64,        // Bar 必须有 baz 字段，类型为 u64
        ..               // 实现者可以添加更多字段
    }
}

// 合法的实现 —— 除了满足接口要求的字段外，还添加了 extra 字段
program my_program.aleo : Foo {
    record Bar {
        owner: address,
        baz: u64,
        extra: bool,     // 额外的自定义字段，接口允许
    }
}
```

如果接口中不写 `..`，则实现的 Record 必须严格匹配接口声明的字段，不能多也不能少。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: `dyn record` 是 Leo 4.0 引入的动态记录类型，用于在编译时不知道 Record 具体来自哪个程序时传递和检查记录。典型使用场景：

1. **通用资产处理**：编写能接受任何符合特定接口的 Token Record 的函数（如 DEX、聚合器）
2. **跨程序互操作**：配合动态分派（Dynamic Dispatch），在运行时才确定调用哪个程序的 Record
3. **标准化协议**：实现 ARC-20 等代币标准时，让同一函数能处理不同程序发行的 Token

使用 `dyn record` 时，通过 `get.record.dynamic` 指令按字段名提取值，底层通过 Merkle 证明验证字段的存在性和类型，确保类型安全。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: Storage Vector（`storage name: [type]`）是 Leo 4.0 的链上动态列表，支持以下核心操作：

```leo
storage vec: [u8];

// 查询操作
let length: u32 = vec.len();       // 获取当前长度
let val: u8? = vec.get(idx);      // 按索引读取（返回 Option，越界返回 none）

// 修改操作
vec.set(idx, value);               // 更新指定索引的值
vec.push(value);                   // 在末尾追加元素
vec.pop();                         // 移除末尾元素
vec.swap_remove(idx);              // 移除指定索引元素（用末尾元素填补）
vec.clear();                       // 清空整个向量
```

Storage Vector 与 Mapping 的区别：Vector 是有序的、支持按索引访问和动态增删，适合排行榜、历史记录等需要维护有序列表的场景；Mapping 是键值对，适合余额查询等随机访问场景。
