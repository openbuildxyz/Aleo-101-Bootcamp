# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 在 Leo 中，transition 的输入、输出以及 record 字段如果没有显式写 `public`，默认就是 `private`。也就是说，开发者不用每次都声明“我要保护这个字段”，语言默认会把数据当成私有数据处理。只有确实需要链上公开验证或公开存储时，才写 `public`。

```leo
program privacy_example.aleo {
    transition add(public a: u32, b: u32) -> u32 {
        // a 是公开输入，b 是默认私有输入，返回值默认也是私有。
        return a + b;
    }
}
```

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: Tuple 可以把不同类型组合在一起；array 可以保存同类型元素；struct 用字段名组织数据。访问时先用 tuple 下标取出元素，再用数组下标或 struct 字段名继续访问。

```leo
program tuple_array_struct.aleo {
    struct Score {
        // user_id 用来标识用户，score 表示分数。
        user_id: u32,
        score: u32,
    }

    transition read_score() -> u32 {
        // scores 是一个包含 2 个 Score struct 的数组。
        let scores: [Score; 2] = [
            Score { user_id: 1u32, score: 88u32 },
            Score { user_id: 2u32, score: 96u32 },
        ];

        // data 的第 0 项是标签，第 1 项是 Score 数组。
        let data: (field, [Score; 2]) = (123field, scores);

        // 先用 .1 取出 tuple 的第二项，再用 [1u32] 取数组元素，最后访问 struct 字段。
        return data.1[1u32].score;
    }
}
```

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 表示这个 record 归哪个 Aleo 地址控制。只有 owner 对应账户能解密、消费或继续转移这个 record。它是 record 模型里连接“私有状态”和“账户控制权”的关键字段。

```leo
record Token {
    // owner 控制这个 record 的使用权。
    owner: address,
    // amount 默认私有，不直接暴露余额。
    amount: u64,
}
```

---

**Q4. 程序中的 final 是什么？**

A: 这里的 final 可以理解为 finalize / async function 阶段：transition 先在链下执行并生成零知识证明；证明通过后，finalize 相关逻辑由网络节点在链上公开、确定性地执行，通常用来更新 `mapping`、`storage`、`storage vector` 等公开链上状态。

```leo
program counter.aleo {
    mapping counts: address => u64;

    async transition increase() -> Future {
        // transition 负责生成证明，并返回一个未来要在链上执行的任务。
        return finalize_increase(self.caller);
    }

    async function finalize_increase(user: address) {
        // finalize 阶段可以读写公开 mapping。
        let current: u64 = counts.get_or_use(user, 0u64);
        counts.set(user, current + 1u64);
    }
}
```

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 用 `function` 关键字定义 helper function。它只能被当前程序内部调用，不能像 transition 一样被外部直接调用；它的参数不能写 `public/private` 可见性，因为它不是外部接口。

```leo
program helper_example.aleo {
    function double(value: u64) -> u64 {
        // 辅助函数只做内部计算。
        return value * 2u64;
    }

    transition main(input: u64) -> u64 {
        // transition 可以调用 helper function。
        return double(input);
    }
}
```

---

**Q6. helper functions 能否创建 records？**

A: 不能。helper function 只能做内部计算，不能直接创建 record。需要创建或返回 record 时，应放在 `transition` 中完成。

```leo
program record_example.aleo {
    record Card {
        owner: address,
        value: u64,
    }

    function normalize(value: u64) -> u64 {
        // helper function 可以计算字段值，但不能返回 Card record。
        return value + 1u64;
    }

    transition create_card(value: u64) -> Card {
        // record 创建放在 transition 中。
        return Card {
            owner: self.caller,
            value: normalize(value),
        };
    }
}
```

---

**Q7. constructor 的目的是什么？**

A: Leo 中的 `constructor` 主要用于程序部署和升级规则，不是普通面向对象里的“创建对象”。它会在部署或升级相关流程中执行，用来声明程序是否可升级、由谁升级、如何校验升级等。比如 `@noupgrade constructor() {}` 表示程序不可升级。

```leo
program upgrade_rule.aleo {
    @noupgrade
    constructor() {
        // 这里表示程序部署后不允许升级。
    }
}
```

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 可以让一个 interface 继承或组合多个已有 interface，从而要求实现者同时满足多组能力。实际理解时，可以把它看成“接口能力的叠加”：一个程序如果声明实现组合接口，就要提供组合后所有要求的函数、record 或类型约束。

```leo
// 下面是概念示例，用来说明组合接口的写法思路。
interface Ownable {
    // 要求实现方能返回 owner。
    function owner() -> address;
}

interface Transferable {
    // 要求实现方能执行转移逻辑。
    function transfer(to: address, amount: u64);
}

interface OwnableToken: Ownable, Transferable {
    // OwnableToken 同时具备 Ownable 和 Transferable 的约束。
}
```

---

**Q9. record interface 中 `..` 的含义是什么？**

A: `..` 表示“允许还有其他字段”。在 record interface 中，我们可能只关心某些必要字段，例如 `owner`，但不想限制具体 record 只能有这些字段。写上 `..` 后，符合接口的 record 可以包含更多字段。

```leo
// 概念示例：只要求 record 至少有 owner 字段。
record interface OwnedRecord {
    owner: address,
    // .. 表示实现该接口的 record 还可以有其他字段。
    ..
}
```

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当程序需要处理“编译时不知道具体 record 类型，但知道它满足某个 record interface”的场景时使用 `dyn record`。典型场景是 DEX、路由器或通用资产协议：程序想接收任意符合接口的 token record，而不是为每一种具体 token 写一套逻辑。

```leo
// 概念示例：token 的具体 record 类型运行时才确定。
transition route(token: dyn record) -> dyn record {
    // 这里只依赖 token 满足的接口约束，而不依赖某个固定 record 名称。
    return token;
}
```

---

**Q11. storage vector 支持的核心操作有哪些？**

A: storage vector 是链上动态数组，适合保存公开、可增长、可删改的同类型数据。核心操作包括：

- `len()`：读取当前长度。
- `get(idx)`：读取指定位置元素。
- `set(idx, value)`：设置指定位置元素。
- `push(value)`：追加元素。
- `pop()`：弹出最后一个元素。
- `swap_remove(idx)`：删除指定位置元素，并用最后一个元素补位。
- `clear()`：把长度清零。

```leo
program vector_example.aleo {
    storage ids: [u64];

    async transition add_id(public id: u64) -> Future {
        // storage vector 的修改放到链上执行阶段。
        return finalize_add_id(id);
    }

    async function finalize_add_id(id: u64) {
        // 追加一个元素。
        ids.push(id);
    }

    async transition remove_id(public index: u32) -> Future {
        // 删除指定位置元素。
        return finalize_remove_id(index);
    }

    async function finalize_remove_id(index: u32) {
        // swap_remove 会用最后一个元素补到被删除的位置。
        ids.swap_remove(index);
    }
}
```
