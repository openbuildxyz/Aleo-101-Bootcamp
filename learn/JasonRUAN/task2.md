# Task 2 - Leo 入门：学会这门语言 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: Aleo 区块链及其专用编程语言 Leo 的底层设计哲学，其核心理念是：所有数据、交易和状态在默认情况下都是“私有”的，除非开发者通过代码明确将其指定为“公开”。这与我们熟知的以太坊等公链的“Public by Default”（默认公开）模式完全相反。在 Aleo 上，隐私不再是一个可选的附加功能，而是所有应用的默认标准。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:

```leo
struct Point {
    x: u32,
    y: u32,
}

fn tuple_array_struct_example() -> u32 {
    // tuple 的第 0 个元素是一个 Point 数组，第 1 个元素是一个 bool
    let data: ([Point; 2], bool) = (
        [
            Point { x: 1u32, y: 2u32 },
            Point { x: 3u32, y: 4u32 },
        ],
        true,
    );

    // tuple 用 .0 / .1 访问，array 用 [index] 访问，struct 用 .field 访问
    let first_x: u32 = data.0[0u32].x;   // 1u32
    let second_y: u32 = data.0[1u32].y;  // 4u32
    let flag: bool = data.1;             // true

    return first_x + second_y;
}
```

访问顺序可以理解为：先 `data.0` 取出 tuple 中的数组，再 `[0u32]` 取数组元素，最后 `.x` / `.y` 取 struct 字段。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner: address` 是 Aleo record 的内置必需字段，用来表示该 record 归哪个地址所有。

它主要有三个作用：

1. **所有权标识**：说明谁拥有这条 record。
2. **消费权限控制**：只有 `owner` 对应私钥的持有者才能在后续交易中消费这条 record。
3. **隐私解密目标**：record 在链上以密文形式存在，通常只有 owner 才能扫描、解密并识别属于自己的 record。

因此，`owner` 决定了「谁能看见并花费这条 record」。

---

**Q4. 程序中的 final 是什么？**

A: 这里的 `final` 指 Aleo / Leo 程序中的最终化逻辑，也常被称为 `finalize` 阶段；在新版语法中也常与 `async transition` 的链上执行部分对应。

Aleo 的执行模型可以理解为两段：

1. **本地证明阶段**：用户在本地执行私有计算，生成零知识证明。这里可以处理 private 输入、创建或消费 records。
2. **final / finalize 阶段**：证明通过后，由网络节点公开、确定性地执行，用来更新链上公开状态，例如 `mapping` 或 `storage vector`。

`final` 的关键限制：

- 可以读写公开链上状态；
- 不能访问 transition 中的 private witness；
- 适合处理公共余额、计数器、注册表、白名单等全局状态；
- 如果 `final` 中的断言失败，本次状态更新会失败。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: helper function 是用于复用计算逻辑的普通函数。在新版 Leo 中，所有函数（包括入口函数和辅助函数）都定义在 `program {}` 内部，统一使用 `fn` 关键字声明；helper function 与入口函数的区别在于**返回类型 / 是否被外部调用 / 是否产生链上副作用**，而不是关键字本身。

```leo
program helper_example.aleo {
    // helper function：纯计算、无链上副作用、被同 program 内其他 fn 调用
    fn double(x: u32) -> u32 {
        return x * 2u32;
    }

    fn add_then_double(a: u32, b: u32) -> u32 {
        return double(a + b);
    }

    // 入口函数（同样用 fn 声明）调用 helper
    fn main(a: u32, b: u32) -> u32 {
        return add_then_double(a, b);
    }
}
```

helper function 的特点：

- 主要用于计算、校验、格式转换等可复用逻辑；
- 不能被外部用户直接当作程序入口调用；
- 不负责读写链上状态；
- 不能创建或消费 records。

---

**Q6. helper functions 能否创建 records？**

A: **不能**。

helper function 只能做普通计算，不能直接创建、返回或消费 Aleo records。原因是 record 的创建和消费会影响交易的输入输出、commitment、nullifier 等协议层数据，必须发生在 program 的入口函数边界中。

helper function 可以计算创建 record 所需的普通字段值，但真正的 record 字面量应在入口函数中构造并作为输出返回。

---

**Q7. constructor 的目的是什么？**

A: Leo 中的 `constructor` 不是传统面向对象语言里创建对象实例的构造函数，而是用于**程序部署和升级规则**的特殊逻辑。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 在 Leo 中，+ 运算符用于组合多个接口的功能，主要有两种使用场景：

程序实现多个接口：通过在 program 声明后添加 : InterfaceA + InterfaceB，可以要求程序同时实现多个接口的所有要求。

```leo
// 要求 my_token.aleo 必须同时满足 Transfer 和 Pausable 两个接口的所有要求
program my_token.aleo : Transfer + Pausable {
    // ... 必须同时提供 Transfer 和 Pausable 中定义的所有 record、mapping 和函数
}
```

组合成新接口：使用相同的 + 语法，可以将多个接口组合成一个新的接口。这与 Rust 中使用 + 组合 trait bound 或 TypeScript 中使用 & 组合类型的方式类似。

```leo
// 定义一个名为 Token 的新接口，它融合了 Transfer 和 Balances 两个接口的所有要求
interface Token : Transfer + Balances {}
```


---

**Q9. record interface 中 `..` 的含义是什么？**

A: 在 Leo 语言的 record interface 里，`..` 语法定义了一组必需字段，同时明确告诉编译器：实现这个接口的具体 record 可以拥有比这组必需字段更多的字段。


---

**Q10. 何时使用 dyn record（动态 record）？**

A: `dyn record` 表示"运行时才确定具体类型的 record 引用"，主要用于需要**动态分发 / 跨程序处理异构 record** 的场景

---

**Q11. storage vector 支持的核心操作有哪些？**

A: `storage vector` 是存储在链上的动态数组，适合保存公开、可枚举、长度会变化的数据，例如注册列表、白名单、排行榜等。

| 操作 | 作用 |
| --- | --- |
| `push(value)` | 在 vector 末尾追加元素 |
| `pop()` | 移除并返回最后一个元素 |
| `get(index)` | 根据索引读取元素 |
| `get_or_use(index, default)` | 按索引读取，越界时返回默认值 |
| `set(index, value)` | 修改指定索引处的元素 |
| `len()` | 返回当前长度 |
| `clear()` | 清空整个 vector |