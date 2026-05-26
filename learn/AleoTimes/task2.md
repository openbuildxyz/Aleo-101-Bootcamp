# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 在 Leo 中，所有数据、状态与函数参数若不显式标记 public，则自动视为 private  加密存储、链上不可见、仅授权方（拥有者 / 持视图密钥者）可解密访问。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: 
struct MyStruct {
    a: u32,
    b: u32
}

program SimpleTuple {
    transition test() -> ([u32;2], MyStruct) {
        let arr: [u32;2] = [10, 20];		
        let s: MyStruct = MyStruct {a: 1, b: 2};        
        let tuple: ([u32;2], MyStruct) = (arr, s);
        let arr_0 = tuple.0[0];
        
        let struct_a = tuple.1.a;
        let struct_b = tuple.1.b;

        return tuple;
    }
}

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: owner字段是Aleo隐私模型的核心权限控制字段。所有 Record 必须写 owner: address，它的核心作用包括标记归属、权限控制、隐私加密。

---

**Q4. 程序中的 final 是什么？**

A: final 是 Aleo 实现「隐私计算 + 公共状态」结合的关键机制，让开发者能安全地将隐私计算结果同步到链上公共存储，同时保证数据一致性与公开可验证性。 final 代码块/函数在链上由验证节点执行，所有输入和操作完全公开。


---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 
fn add(a: u32, b: u32) -> u32 {
  return a + b;
}

---

**Q6. helper functions 能否创建 records？**

A: 不能，官方文档中有描述Helper functions contain expressions and statements that can compute values, but cannot produce records。

---

**Q7. constructor 的目的是什么？**

A: gatekeeper 特殊系统函数，通过不可变的验证逻辑，管控程序的部署与升级权限，为程序可升级性提供基础保障。它不负责创建 Record、初始化状态或实例化结构体。 

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 通过 extends 让一个接口继承多个接口（组合成新接口），或程序直接实现多个接口（直接组合）。
Leo 接口仅定义函数签名（无代码实现），组合后程序必须实现所有接口的函数。
// 接口1：转账功能
interface ITransfer {
    fn transfer(public to: address);
}

// 接口2：铸造功能
interface IMint {
    fn mint(public amount: u64);
}

interface IToken extends ITransfer, IMint {
    // 可额外新增函数
    fn burn(public amount: u64);
}

---

**Q9. record interface 中 `..` 的含义是什么？**

A: ..是结构体展开 / 更新语法，即展开运算符。
作用：复用一个已有的 Record/Struct 实例的所有字段，只覆盖手动写的字段，快速创建新实例。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 跨程序传递未知结构的记录、例如当需要与一个在编译时未知的程序或记录类型进行交互时，与动态调用（Dynamic Call）配合，构建可组合的应用程序。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: vec.push(value)、vec.pop()、vec.get(index)、vec.set(index, value)、vec.clear()
