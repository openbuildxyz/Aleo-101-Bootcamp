# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A:在 Leo 语言和 Aleo 网络中，“默认隐私”意味着程序的计算是在链下（用户的本地设备上）执行并生成零知识证明（zk-SNARKs）的。默认情况下，输入变量、状态转移（Records）以及交易细节（发送方、接收方、具体金额等）都是加密且对外界不可见的。开发者必须通过 public 关键字或 final 块显式声明，才能将特定数据公开到链上

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:// 1. 定义一个 struct
struct Point {
    x: u8,
    y: u8,
}

// 2. 定义包含 array 的 tuple，数组内部存放 struct
let my_tuple: (u8, [Point; 2]) = (
    10u8,
    [Point { x: 1u8, y: 2u8 }, Point { x: 3u8, y: 4u8 }]
);

// 3. 访问 tuple 中的第二个元素（数组），取出第一个 struct，再访问它的 x 字段
let val: u8 = my_tuple.1[0].x; // 结果为 1u8

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A:owner 字段（类型为 address）是 Aleo Record（隐私状态记录）中的内置必填字段，用于定义该条加密状态的所有权。只有持有与该地址匹配的私钥的用户，才有权限在未来的交易中解密、授权消费（consume）或花费这个特定的 Record。

---

**Q4. 程序中的 final 是什么？**

A:final {} 代码块（在早期版本中称为 finalize）用于原子化地更新链上（on-chain）的公共状态。当用户的链下零知识证明提交至 Aleo 网络并通过节点验证后，网络会自动执行 final 块内部的逻辑，这是 Aleo 程序修改公开映射（如公开代币余额、公共计数器）的唯一途径

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:在新版 Leo 中，辅助函数可以通过 fn 关键字直接定义在 program {} 代码块的外部。这些函数属于内部逻辑，无法被外部用户直接调用，但可以被 program {} 内部的核心入口函数（entry functions）复用和调用

---

**Q6. helper functions 能否创建 records？**

A:不能。根据 Leo 的执行模型限制，只有定义在 program {} 内部的入口函数（作为 transitions）才具备产生（produce）和消费 Records 的能力。定义在 program {} 外部的 helper functions 无法创建 records

---

**Q7. constructor 的目的是什么？**

A:constructor 是一个特殊的代码块，主要作为程序升级（Program Upgradability）的控制网关。它在程序的初始部署以及随后的每一次升级时在链上通过 AVM 执行。因为其逻辑一旦部署便不可篡改（immutable），开发者利用它来强制执行固定的升级策略（例如使用 @noupgrade 彻底阻止升级，或将其锁定为仅允许特定管理员地址进行升级）

---

**Q8. 如何组合多个 interfaces（接口）？**

A:// Token 接口组合了 Transfer 和 Balances 两个接口的功能
interface Token : Transfer + Balances {
    fn mint(to: address, amount: u64);
}

---

**Q9. record interface 中 `..` 的含义是什么？**

A:在接口的 Record 定义中，.. 代表结构化子类型（structural subtyping）约束。它向编译器表明：“接口里列出的字段是强制必需的，但实现该接口的程序可以在此基础上，向 Record 中添加更多的自定义额外字段。” 这允许了极大的灵活性，无需在接口中完全写死数据形状

---

**Q10. 何时使用 dyn record（动态 record）？**

A:当你需要通过动态分发（Dynamic Dispatch）跨程序传递隐私记录，且在编译时无法确定目标程序 Record 的确切结构时，应当使用 dyn record。例如，在编写一个支持所有合规代币的去中心化交易所（DEX）路由时，它允许程序接收任何来源的 Token Record，并在运行时动态解析和访问所需字段

---

**Q11. storage vector 支持的核心操作有哪些？**

A:storage vector（使用 storage {name}: [{type}] 声明）用于在链上存储特定类型的动态列表。作为链上的动态数组，它主要支持以下核心操作：

push：向 vector 尾部追加新的元素。

pop / remove：移除 vector 末尾或指定位置的元素。

get：根据索引读取指定位置的元素值。

set：更新特定索引位置的元素数据。

len：获取当前 vector 中存储的元素总数
