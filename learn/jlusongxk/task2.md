# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: Leo 中所有变量、函数输入参数和 record 字段默认都是私有的（private），不会被公开到链上。链上仅存储零知识证明，具体数据对外不可见。如果某个值需要公开可见，必须显式使用 `public` 关键字声明。这种设计使得开发者默认就能保护用户隐私，减少数据泄露风险。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: 在 Leo 中，tuple 可以包含不同类型的数据，包括数组和 struct。例如：

```
struct Point {
    x: u32,
    y: u32,
}

// 一个 tuple 包含一个 Point 数组和一个 u32
let data: ([Point; 3], u32) = ([Point { x: 1, y: 2 }, Point { x: 3, y: 4 }, Point { x: 5, y: 6 }], 100u32);
```

访问方式：通过 `.索引` 访问 tuple 元素，通过 `[索引]` 访问数组元素，通过 `.字段名` 访问 struct 字段。例如 `data.0[1].y` 表示访问 tuple 的第一个元素（数组）中第二个元素的 `y` 字段。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 字段存储 record 所有者的 Aleo 地址（address）。record 的内容使用 owner 的公钥加密，只有持有对应私钥的人才能解密和使用该 record。它决定了谁能"消费"（consume）这个 record，是 Aleo 隐私数据所有权模型的核心。在 transition 中创建 record 时，通常需指定 owner。

---

**Q4. 程序中的 finalize 是什么？**

A: `finalize` 是 transition 后面的可选代码块，在零知识证明验证通过后在链上执行。与 transition 不同，finalize 运行在链上虚拟机中，可以读写 on-chain mapping（链上状态），但不能访问 transition 中的私有输入数据。它主要用于更新需要公开记录或全局可见的状态（如代币总供应量、公共计数器等）。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 使用 `function` 关键字定义（区别于 transition 使用 `transition` 关键字）。helper function 只能在程序内部被 transition 或其他 function 调用，不能作为外部 entry point。语法如下：

```
function add(a: u32, b: u32) -> u32 {
    return a + b;
}
```

helper function 是纯计算逻辑，不能创建 records 或访问链上状态。

---

**Q6. helper functions 能否创建 records？**

A: 不能。record 只能在 `transition` 中创建，因为创建 record 需要进行密码学承诺（commitment）生成，这是 transition 在生成零知识证明过程中完成的工作。helper function 是纯函数，运行在 ZK 电路内但无权限生成 record 所需的密码学材料。

---

**Q7. constructor 的目的是什么？**

A: `constructor` 是程序部署时自动执行一次的特殊函数，用于初始化程序的初始状态。常见用途包括：设置合约管理员地址、初始化 mapping 中的默认值、设定初始参数等。构造函数在程序整个生命周期中只执行一次，部署完成后不可再次调用。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 使用 `+` 运算符将多个 interface 连接起来。例如：

```
program foo.aleo;

interface I1 { function f1(); }
interface I2 { function f2(); }

// 组合多个 interface
transition bar(r: I1 + I2) {
    // r 必须同时满足 I1 和 I2 接口
}
```

程序必须实现组合中每个 interface 定义的所有方法。

---

**Q9. record interface 中 `..` 的含义是什么？**

A: `..` 表示该 record interface 允许实现它的 record 包含额外的字段，不要求字段完全匹配。例如 `interface I { owner: address, amount: u64, .. }` 表示任何包含 `owner` 和 `amount` 字段的 record 都可满足此接口，即使还有其他字段。如果没有 `..`，则 record 的字段必须与 interface 定义完全一致。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当函数或 transition 在编译期无法确定 incoming record 的具体类型，但知道它满足某个 interface 时使用。例如一个函数需要处理多种不同类型的 record，只要它们都实现了 `Token` interface。使用 `dyn` 关键字声明参数类型，使函数具备多态性，在运行时根据实际传入的 record 类型进行分发。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: Storage vector 是存储在链上 mapping 中的动态数组，支持以下核心操作：

- `push` / `push_back`：在末尾添加元素
- `pop` / `pop_back`：移除并返回末尾元素
- `get`：根据索引读取元素
- `set`：根据索引修改元素
- `len`：返回当前元素个数
- `swap_remove`：将目标元素与末尾元素交换后删除末尾（O(1) 删除，不保持顺序）
- `contains`：检查是否包含某个元素
- `remove`：移除指定索引的元素（保持顺序，但 O(n) 复杂度）
