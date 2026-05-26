# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 在leo中，所有变量、函数输入输出默认都是隐私的。这意味着在本地执行和生成零知识证明时，这些数据会被加密和隐藏，不会在公链上泄露。如果你希望某个变量或状态公开可见，必须显式地使用public关键字进行声明。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: 
struct MyStruct{
    id:u64,
    }
    let my_tuple:([u8;2],MyStruct) = ([10u8,20u8], MyStruct {id: 100u64});
    let array_element: u8 = my_tuple.0[0];
    let struct_element: u64 =my_tuple.1.id;

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A:owner字段是Aleo隐私状态模型的核心权限控制字段。它指定了该Record的所有权归属。只有拥有该owner地址对应私钥的用户，才有权限在未来的交易中作为输入去花费或修改这个Record。

---

**Q4. 程序中的 final 是什么？**

A:在Leo的语境中，通常指的是finalize块。
一个Aleo程序中的transition函数是在链下执行并生成零知识证明的，而finalize块中的代码是在链上由验证节点执行的。它的主要作用是在证明被验证通过后，更新和改变链上公开状态。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:fn add_helper(a: u64, b: u64) ->u64 {
    return a + b;
}

---

**Q6. helper functions 能否创建 records？**

A:不能。在Leo的设计规范中，只有transition函数可以创建并向外部输出Records。辅助函数可以处理内部逻辑并返回普通的类型或Struct，但不能直接返回Record类型来供链上铸造。

---

**Q7. constructor 的目的是什么？**

A: 数据实例化： 直接使用大括号{}以键值对形式实例化Struct 或 Record。
合约初始化： 开发者通常会编写一个特定的 transition来充当整个程序的"构造器"，用于在初始阶段发放第一个Record 或设置初始的公开状态。

---

**Q8. 如何组合多个 interfaces（接口）？**

A:使用 import 关键字导入其他Leo程序，然后通过跨程序调用来组合和它们的功能。

---

**Q9. record interface 中 `..` 的含义是什么？**

A: ..是展开运算符，也被称为结构体更新语法。
当你基于一个现有的Record或Struct创建一个新的实例，并且只想修改其中几个字段时，可以使用 ..将旧实例中其余未修改的字段直接复制过来。

---

**Q10. 何时使用 dyn record（动态 record）？**

A:当需要与一个在编译时未知的程序或记录类型进行交互时，与动态调用（Dynamic Call）配合，构建可组合的应用程序。

---

**Q11. storage vector 支持的核心操作有哪些？**

A:vec.len() 返回当前vector中元素的数量
ver.get(index) 获取指定索引位置的元素，返回Option类型
ver.push(value) 在末尾添加一个新元素，长度+1
vec.pop() 移除并返回最后一个元素，长度-1
vec.clear() 删除所有元素，将长度设为0
