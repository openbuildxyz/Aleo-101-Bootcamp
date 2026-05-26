# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 除非用户设置为public，否则所有字段默认都是私有（加密）的。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: 
```leo
struct Bar {
    data: u8,
}
struct Foo {
    data: u8,
}

fn main() {
    let tuple: (Bar, [Foo;2]) = (Bar { data: 42 }, [Foo { data: 42 }, Foo { data: 41 }]);
    let bar = tuple.0;
    let foo = tuple.1;
    let bar_data = bar.data;
    let foo1_data = foo[0].data;  
    let foo2_data = foo[1].data;
}

```

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 是 `address`类型，用于标识记录的所有者。

---

**Q4. 程序中的 final 是什么？**

A: 公开的链上计算，包含代码块和fn

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 在`program {}` 外，定义的函数称为 helper functions（辅助函数），可以在程序中调用。定义如下`fn {name}({arguments}) {}`

---

**Q6. helper functions 能否创建 records？**

A: 不能

---

**Q7. constructor 的目的是什么？**

A: 一个特殊功能，在每次部署和升级过程中链上运行。定义升级的逻辑。逻辑具有不可变性

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 可以使用 `+` 号，将多个接口组合成一个接口。
```leo
interface Transfer {
    record Token;
    fn transfer(input: Token, to: address, amount: u64) -> Token;
}

interface Balances {
    mapping balances: address => u64;
}

// Token requires everything from both Transfer and Balances
interface Token : Transfer + Balances {}

program my_token.aleo : Token { /* ... */ }
```

---

**Q9. record interface 中 `..` 的含义是什么？**

A: 表示实现者可以声明超出要求的额外字段

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 在进行动态调用时，所有`record`参数在底层都被视为 `dyn record` ，所有`record`返回值返回为 `dyn record`

四种场景用例如下：
1.Interface expects `dyn record`, caller has `dyn record`. 直接传递动态记录，无需转换。
2. Interface expects `dyn record`, caller has `record`. 调用者有静态记录，需要转换为动态记录。
3. Interface expects a static record, caller has a static record. 编译器在底层自动将静态记录转换为 `dyn record` 再传递
4. Interface expects a static record, caller has a dyn record. 隐式转换 将caller的`dyn record`转换为`record`。

涉及记录的动态调用的返回类型总是 `dyn record`

---

**Q11. storage vector 支持的核心操作有哪些？**

A: 1. 查询 `get` 、 `len` 2. 修改 `set`、`push`、`pop`、`swap_remove` 、`clear`
