# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A:
函数的输入参数和返回值默认具有 private 可见性，它们在交易中以加密密文形式存在，仅交易相关方（如输入 record 的 owner）能够解密查看。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:
struct Point { x: u32, y: u32 }

// 创建一个包含数组的 tuple
let points: [Point; 2] = [Point { x: 1u32, y: 2u32 }, Point { x: 3u32, y: 4u32 }];
let my_tuple: (u32, [Point; 2]) = (100u32, points);

// 访问 tuple 中的数组：使用 .索引
let arr: [Point; 2] = my_tuple.1;

// 访问数组中的 struct 元素
let first_point: Point = arr[0u32];

// 访问 struct 中的字段：使用 .字段名
let x_coord: u32 = first_point.x;

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A:只有对应此地址的私钥持有者才能在后续 transaction 中花费（consume）该 record，确保同一 record 无法被二次使用

---

**Q4. 程序中的 final 是什么？**

A:final代表链上公开执行阶段。与在链下由用户本地执行并生成零知识证明的 transition 不同，final 函数/块由验证节点在链上执行，专门用于读写公共状态。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:在 program 作用域内使用 function/fn 关键字声明。

---

**Q6. helper functions 能否创建 records？**

A:不能。只有 transition 函数有权创建、消费或返回 records。辅助函数仅用于内部数值计算和逻辑复用。

---

**Q7. constructor 的目的是什么？**

A:constructor 的目的是实例化一个类型，确保所有必要字段（尤其是 record 的 owner）都被正确赋值，从而生成一个有效的、可在后续逻辑中使用的值或链上 record。

---

**Q8. 如何组合多个 interfaces（接口）？**

A:Leo 允许在一个 program 中通过 implements 声明同时实现多个 interface，从而组合不同接口的约束。此外，接口本身可以通过要求 program 提供多种 record 类型、函数签名和 mapping 定义来形成复合契约。编译器会在编译期验证 program 是否满足所有接口声明的要求。

---

**Q9. record interface 中 `..` 的含义是什么？**

A:`..` 是结构子类型（structural subtyping）的"剩余字段"标记。它表示：实现该 interface 的 record 必须包含接口中显式列出的字段（如 owner、balance），但允许额外添加更多字段。

---

**Q10. 何时使用 dyn record（动态 record）？**

A:当需要在运行时处理多种符合同一 interface 但具体类型不同的 record 时使用。

---

**Q11. storage vector 支持的核心操作有哪些？**

A:
vec.push(value);        // 在尾部追加元素
let x = vec.pop();      // 弹出并返回尾部元素
let y = vec.get(i);     // 获取索引 i 处的元素
vec.set(i, value);      // 将索引 i 处的元素设为 value
let n = vec.len();      // 返回元素数量
vec.swap_remove(i);     // 删除索引 i 处元素，并用尾部元素填补空缺