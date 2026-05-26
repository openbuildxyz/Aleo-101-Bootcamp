# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A:所有变量、输入和状态在默认情况下都是私有的，除非开发者显式声明为 public，否则外界无法看到其具体值

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:

```leo
struct User {
    id: u32,
    balance: u64,
}

program demo.aleo {
    transition main() -> (User, [User; 2]) {

        let u1: User = User { id: 1u32, balance: 100u64 };
        let u2: User = User { id: 2u32, balance: 200u64 };

        let arr: [User; 2] = [u1, u2];

        // tuple：包含 struct + array
        let t: (User, [User; 2]) = (u1, arr);

        // 访问 struct 字段
        let id1: u32 = t.0.id;

        // 访问 array 中 struct 的字段
        let bal2: u64 = t.1[1u8].balance;

        return t;
    }
}
```

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A:在 Record 模型中绑定资产所有权，并作为验证“谁能消费该 record”的密码学凭证，同时保持隐私隐藏真实身份

---

**Q4. 程序中的 final 是什么？**

A:表示“不可改变”的限制关键字，可以用于变量、方法或类，以防止修改、重写或继承

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:

```leo
struct User {
    id: u32,
    balance: u64,
}

program demo.aleo {

    // helper function（辅助函数）
    function is_sufficient_balance(u: User, amount: u64) -> bool {
        return u.balance >= amount;
    }

    transition main(u: User, amount: u64) -> bool {

        // 调用 helper function
        let ok: bool = is_sufficient_balance(u, amount);

        return ok;
    }
}
```

---

**Q6. helper functions 能否创建 records？**

A:在 Leo 中，helper function 只能做纯计算，不能创建 record；只有 transition 才能生成或操作 record，因为 record 属于链上状态变更的一部分

---

**Q7. constructor 的目的是什么？**

A:在程序部署时执行一次初始化逻辑，用于设置初始状态和基础配置

---

**Q8. 如何组合多个 interfaces（接口）？**

A:通过多个 impl 实现同一类型，并在泛型约束中用 A + B 表示同时满足多个接口能力

---

**Q9. record interface 中 `..` 的含义是什么？**

A:表示省略未声明的字段，用于支持部分字段匹配与扩展性，同时保持 record 结构的隐私与灵活性

---

**Q10. 何时使用 dyn record（动态 record）？**

A:dyn record 用于在运行时以接口方式统一处理多种不同类型的 record，实现灵活的资产抽象与模块化设计，但牺牲了部分静态类型的具体性

---

**Q11. storage vector 支持的核心操作有哪些？**

A:storage vector 支持 push、pop、get、set、length、is_empty 和 clear 等核心操作，用于在链上以可证明方式管理动态数组状态
