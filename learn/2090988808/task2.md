# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。


## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 默认当作隐私数据处理。Leo 中如果没有显式写public 或 constant，字段/输入默认就是 private，这里的 private 指数据隐私，不是传统访问控制

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:

```
struct Candle {
    open: u64,
    close: u64,
}

program demo.aleo {
    @noupgrade
    constructor() {}

    fn main() -> u64 {
        let c0: Candle = Candle { open: 100u64, close: 110u64 };
        let c1: Candle = Candle { open: 110u64, close: 105u64 };

        let data: ([Candle; 2], u64) = ([c0, c1], 123u64);

        // tuple 第 0 项 -> array 第 1 项 -> struct 的 close 字段
        let close_price: u64 = data.0[1].close;

        return close_price;
    }
}
```

访问规则是：tuple.0[数组下标].字段名，例如 data.0[1].close。Leo 支持 struct 字段访问、array 下标访问和 tuple 的 .0/.1 访问。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: owner 表示这个 record 属于哪个 Aleo 地址，并指定谁有权限消费/花费这个 record。Leo 的 record 必须包含 owner: address 字段。

---

**Q4. 程序中的 final 是什么？**

A:final 是链上最终化逻辑，用来修改公开链上状态，比如 mapping 或 storage。通常 entry fn 如果要改链上状态，会返回 Final 并包含 final { ... } 块；ZK 执行证明通过后，final 逻辑再在链上执行。如果 final 失败，程序逻辑会回滚,final 还是本地和链上相关联的核心操作。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:helper function 写在 program {} 外面，用普通 fn 定义；entry fn 可以调用 helper function

```
fn add(a: u64, b: u64) -> u64 {
    return a + b;
}

program demo.aleo {
    @noupgrade
    constructor() {}

    fn main(a: u64, b: u64) -> u64 {
        return add(a, b);
    }
}
```



---

**Q6. helper functions 能否创建 records？**

A:不能。helper functions 写在 `program {}` 外，而 record 类型必须声明在 program {} 内，所以 helper functions 适合做普通计算，不适合创建/返回 record。创建 record 应该放在 entry fn 里。

---

**Q7. constructor 的目的是什么？**

A:`constructor` 用来定义程序部署和升级规则，是控制程序能否升级、由谁升级、如何升级的入口。比如 `@noupgrade constructor() {}` 表示程序不可升级；`@admin(...)` 可以限制只有指定管理员能升级。constructor 逻辑只在部署或升级时执行，不是在普通函数调用时执行。

---

**Q8. 如何组合多个 interfaces（接口）？**

A:用 `+` 把多个 interface 组合成一个新 interface，然后让 program 实现这个组合后的 interface。

---

**Q9. record interface 中 `..` 的含义是什么？**

A:`..` 表示这个 interface 只要求列出的字段必须存在，具体实现的 record 可以额外添加更多字段。也就是说，它约束 record 的最小形状，而不是完全固定 record 的所有字段。

---

**Q10. 何时使用 dyn record（动态 record）？**

A:当你不知道具体 record 类型或 record 布局，但需要通过 interface / dynamic dispatch 调用不同程序时，用 `dyn record`。它可以表示任意 record，适合路由不同 token 程序、跨程序处理不同 record 结构。注意：已知具体 record 类型并且要真正消费 record 时，优先用静态 record，因为 `record.dynamic` 本身不会验证所有权或自动 nullify。

---

**Q11. storage vector 支持的核心操作有哪些？**

A:storage vector 支持读取长度、读取元素、设置元素、追加、弹出、交换删除和清空。核心操作有：`len()`、`get(idx)`、`set(idx, value)`、`push(value)`、`pop()`、`swap_remove(idx)`、`clear()`。外部程序的 storage vector 只能只读访问，比如 `len()` 和 `get(idx)`。
