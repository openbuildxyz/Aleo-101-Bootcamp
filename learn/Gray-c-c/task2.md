# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。


## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 在 Leo 中，未显式声明为 public 的数据、参数和状态默认都是 private，只能在程序内部使用，不能直接在链上公开展示。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: 
```leo
struct MyStruct {
    a: u32,
    b: u32,
}

program Demo.aleo {
    transition main() -> ([u32; 2], MyStruct) {
        let arr: [u32; 2] = [10u32, 20u32];
        let item: MyStruct = MyStruct { a: 1u32, b: 2u32 };
        let tuple: ([u32; 2], MyStruct) = (arr, item);
        let first = tuple.0[0];
        let second = tuple.1.a;
        return tuple;
    }
}
```

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: owner 字段用于标识该 record 的拥有者，只有持有对应权限的地址才能使用或转移这个 record，它是 Aleo 资产归属和权限控制的核心字段。

---

**Q4. 程序中的 final 是什么？**

A: final 是程序中用于定义最终结果或最终状态的部分，通常用来保证某些计算结果在流程结束时被固定下来，避免后续被修改。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 直接在程序中定义普通函数即可，用 `fn` 编写，不需要声明为 transition，例如：

```leo
fn add(a: u32, b: u32) -> u32 {
    return a + b;
}
```

---

**Q6. helper functions 能否创建 records？**

A: 不能，helper functions 只能进行计算和处理数据，不能直接创建 record。

---

**Q7. constructor 的目的是什么？**

A: constructor 用于初始化程序所需要的配置或状态，通常在部署或初始化阶段执行，帮助程序建立初始运行条件。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 可以通过接口继承来组合多个接口，也可以让程序一次实现多个接口，从而把不同能力整合到一起。

---

**Q9. record interface 中 `..` 的含义是什么？**

A: `..` 表示展开或剩余字段的写法，常用于复用已有 record 的字段，只覆盖需要修改的部分。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当 record 的具体类型在编译时无法确定，或者需要在运行时处理不同来源的 record 时，可以使用 dyn record。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: 常见核心操作包括添加元素、删除元素、读取元素、更新元素和查询长度。