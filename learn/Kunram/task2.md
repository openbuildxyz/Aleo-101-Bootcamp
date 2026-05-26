t# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A:在 Leo 中，所有的变量、函数输入输出默认都是隐私的。这意味着在本地执行和生成零知识证明时，这些数据会被加密和隐藏，不会在公链上泄露。如果你希望某个变量或状态公开可见，必须显式地使用 public 关键字进行声明。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: struct MyStruct {
    id: u64,
}

let my_tuple: ([u8; 2], MyStruct) = ([10u8, 20u8], MyStruct { id: 100u64 });

let array_element: u8 = my_tuple.0[0];   
let struct_element: u64 = my_tuple.1.id; 

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A:owner 字段是 Aleo 隐私状态模型的核心权限控制字段。它指定了该 Record 的所有权归属。只有拥有该 owner 地址对应私钥的用户，才有权限在未来的交易中作为输入去花费或修改这个 Record。

---

**Q4. 程序中的 final 是什么？**

A:在 Leo 的语境中，通常指的是 finalize 块。
一个 Aleo 程序中的 transition 函数是在链下执行并生成零知识证明的，而 finalize 块中的代码是在链上由验证节点执行的。它的主要作用是在证明被验证通过后，更新和改变链上的公开状态。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:inline add_helper(a: u64, b: u64) -> u64 {
    return a + b;
}

---

**Q6. helper functions 能否创建 records？**

A:不能。 在 Leo 的设计规范中，只有 transition 函数可以创建并向外部输出 Records。辅助函数可以处理内部逻辑并返回普通的类型或 Struct，但不能直接返回 Record 类型来供链上铸造。

---

**Q7. constructor 的目的是什么？**

A:数据实例化： 直接使用大括号 {} 以键值对的形式实例化 Struct 或 Record。

合约初始化： 开发者通常会编写一个特定的 transition来充当整个程序的“构造器”，用于在初始阶段发放第一个 Record 或设置初始的公开状态。

---

**Q8. 如何组合多个 interfaces（接口）？**

A:使用 import 关键字导入其他 Leo 程序，然后通过跨程序调用来组合和调用它们的功能。

---

**Q9. record interface 中 `..` 的含义是什么？**

A:.. 是展开运算符，也被称为结构体更新语法。
当你基于一个现有的 Record 或 Struct 创建一个新的实例，并且只想修改其中几个字段时，可以使用 .. 将旧实例中其余未修改的字段直接复制过来。

---

**Q10. 何时使用 dyn record（动态 record）？**

A:并没有原生的 dyn record这一关键字或概念。Leo 是一门强类型、静态编译的语言，Record 的数据结构在编译时必须是严格确定的，这主要是为了满足生成零知识证明的要求。如果需要处理动态长度的数据，通常需要将其放在链上公开状态中处理，而不是放在 Record 内。

---

**Q11. storage vector 支持的核心操作有哪些？**

A:set / insert: 往指定索引位置写入或更新值。

get / get_or_use: 根据索引读取值。

remove: 从指定索引移除值。
