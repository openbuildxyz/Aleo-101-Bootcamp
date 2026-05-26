# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 根据官方文档(<https://docs.leo-lang.org/language/programs_in_practice/private_state>)，Leo 中 record 的组件（component）声明可指定可见性修饰符 `constant`、`public` 或 `private`。如果不指定修饰符，Leo 默认使用 `private`。这意味着在 `transition` 函数中，输入参数和 record 字段默认是私有的，数据在链上以加密形式存在，只有拥有该 record 的 owner 才能用自己的 view key 解密查看。若需要公开某个参数或字段，必须显式声明为 `public`。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: 根据官方文档（<https://docs.leo-lang.org/language/data_types>），Leo 支持 tuple、array 和 struct 的嵌套组合。Tuple 类型声明为 `(type1, type2, ...)`，不能为空。数组类型声明为 `[type; length]`。示例如下：

```leo
// 定义一个 struct
struct Bar {
    data: [u8; 8],
}

// 数组中包含 struct
let arr_of_structs: [Bar; 2] = [
    Bar { data: [1u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8] },
    Bar { data: [2u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8] },
];

// Tuple 中包含 struct 和数组
let tup: (u8, Bar) = (1u8, Bar { data: [1u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8] });

// 访问 struct 字段：使用 . 操作符
// 访问 tuple 元素：使用 .索引 (如 tup.0, tup.1)
// 访问数组元素：使用 [索引] (如 arr[0])
// 访问数组中 struct 的字段：arr_of_structs[0].data
// 访问 tuple 中 struct 的字段：tup.1.data
```

注意：数组和 tuple 只支持常量索引访问（编译时已知的常量表达式）。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: 根据官方文档（<https://docs.leo-lang.org/language/programs_in_practice/private_state>），record 是 Aleo 上编码私有状态的方法。Record 数据结构**必须**包含一个名为 `owner` 且类型为 `address` 的组件。`owner` 字段的作用包括：

1. **所有权标识** — `owner` 指定了该 record 的所有者（一个 Aleo 地址），只有 owner 才能使用（消费）这个 record 作为 transition 的输入。
2. **隐私保护** — record 的数据在链上以加密形式存储，只有 owner 能用自己的 view key 解密查看 record 内容。
3. **UTXO 模型基础** — 类似比特币的 UTXO 模型，owner 机制实现了链上资产的所有权追踪。

此外，当传递 record 作为程序函数输入时，编译器会自动插入 `_nonce: group` 和 `_version: u8` 组件，无需在 Leo 程序中显式声明。

```leo
record Token {
    owner: address,    // 必需的 owner 字段
    amount: u64,
}
```

---

**Q4. 程序中的 final 是什么？**

A: 根据官方文档（<https://docs.leo-lang.org/language/programs_in_practice/public_state>），`final` 是 Leo 中用于**链上公开执行**的代码块或函数类型。Leo 程序的执行分为两个阶段：

1. **transition 阶段** — 在链下执行，处理私有数据并生成零知识证明。
2. **final 阶段** — 在链上由验证节点公开执行，可以读写 `mapping`（公共链上存储）和 `storage`（存储变量）。

使用方式有两种：

```leo
// 方式一：在 transition 中使用 return final {} 块
fn dubble() -> Final {
    let addr: address = self.caller;
    return final {
        let current_value: u64 = balance.get_or_use(addr, 0u64);
        balance.set(addr, current_value + 1u64);
    };
}

// 方式二：定义 final fn（只在链上执行的独立函数）
final fn update_balance(addr: address, amount: u64) {
    balance.set(addr, amount);
}
```

重要提示：mapping 操作和 storage 变量操作**只能**在 `final { }` 块或 `final fn` 中使用。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 根据官方文档（<https://docs.leo-lang.org/language/programs_in_practice/functions>），在Leo 中使用 `fn` 关键字（而非 `transition`）定义辅助函数（也叫 inline function / helper function）。辅助函数在编译时会被内联展开到调用它的 transition 中。

```leo
// 定义辅助函数
fn compute_fee(amount: u64, rate: u64) -> u64 {
    return amount * rate / 100u64;
}

// 在 transition 中调用辅助函数
transition process_payment(amount: u64) -> u64 {
    let fee: u64 = compute_fee(amount, 5u64);
    return amount - fee;
}
```

辅助函数的特点：

- 使用 `fn` 关键字声明（不是 `transition`，不是 `helper`）
- 只能被 `transition` 或其他 `fn` 调用，不能直接被外部调用
- 不能访问 `self.caller` 等上下文信息
- 编译时内联展开，不会单独生成电路

---

**Q6. helper functions 能否创建 records？**

A: 不能。`fn`（辅助函数）不能创建或销毁 record。只有 `transition` 函数才有权限创建 record（作为输出返回）和销毁 record（作为输入消费）。这是 Leo 的安全设计——record 代表链上资产的所有权，其生命周期必须由 transition 管理，以确保能生成有效的零知识证明并正确更新链上状态。

---

**Q7. constructor 的目的是什么？**

A: 在 Leo 中，struct 和 record 的 constructor（构造器）用于创建该类型的新实例。语法是 `TypeName { field1: value1, field2: value2 }`。Constructor 确保了类型安全——必须为所有字段提供正确类型的值，不能遗漏或多余字段。

```leo
struct Point {
    x: u32,
    y: u32,
}

record Token {
    owner: address,
    amount: u64,
}

// 使用 constructor 创建 struct 实例
let p: Point = Point { x: 1u32, y: 2u32 };

// 使用 constructor 创建 record 实例（只能在 transition 中）
let t: Token = Token {
    owner: aleo1xxx...xxx,
    amount: 100u64,
};
```

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 根据官方文档（<https://docs.leo-lang.org/language/programs_in_practice/interfaces>），在当前版本的 Leo 中，"interface" 的概念主要体现在程序间的交互和动态调度（Interfaces & Dynamic Dispatch）上。组合多个数据类型的方式是通过 **struct 嵌套**——一个 struct 的字段类型可以是另一个 struct，从而实现数据组合。

```leo
struct Coordinates {
    x: u64,
    y: u64,
}

struct Player {
    name: field,
    position: Coordinates,  // 嵌套组合
    score: u64,
}

// 访问嵌套字段使用链式 . 操作符
let p: Player = Player {
    name: 1field,
    position: Coordinates { x: 10u64, y: 20u64 },
    score: 100u64,
};
let x_pos: u64 = p.position.x;
```

对于程序间接口的组合，Leo 使用 `import` 导入外部程序并调用其 transition，通过动态调度（dynamic dispatch）使用 `identifier` 类型在运行时决定调用哪个程序。

---

**Q9. record interface 中 `..` 的含义是什么？**

A: 在 Leo 中，`..` 是 record/struct 更新时的展开语法（spread operator），用于在创建新实例时复制旧实例的未修改字段。这样可以避免逐一重写所有字段的冗余代码。

```leo
record Token {
    owner: address,
    amount: u64,
}

// 使用 .. 展开旧 record 的字段，只更新 amount
let updated: Token = Token {
    amount: new_amount,
    ..old_token  // 保留 old_token 的 owner 等其他字段
};
```

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 根据官方文档（<https://docs.leo-lang.org/language/programs_in_practice/interfaces），>动态调度（dynamic dispatch）允许在运行时决定调用哪个程序的 transition。`dyn record` 用于在需要处理来自**不同程序**的 record 类型时，提供运行时类型灵活性。典型使用场景包括：

1. **跨程序交互** — 当一个程序需要接收和处理来自多个不同程序的 record 输入，但在编译时无法确定具体类型时。
2. **可扩展的协议设计** — 允许未来部署的新程序与现有程序交互，而无需修改现有代码。
3. **动态调用** — 结合 `identifier` 类型，在运行时确定要调用的目标程序和要处理的 record 类型。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: 根据官方文档（<https://docs.leo-lang.org/language/programs_in_practice/public_state），>
storage vector 声明为 `storage name: [type];`，行为类似动态数组。支持的核心操作包括：

- **`get(idx)`** — 查询指定索引处的元素，返回 `type?`（如果索引越界则返回 `none`）
- **`len()`** — 获取 vector 的当前长度
- **`push(value)`** — 在末尾添加一个元素
- **`pop()`** — 移除并返回最后一个元素（返回 `type?`）
- **`set(idx, value)`** — 设置指定索引处的值（索引必须在范围内）
