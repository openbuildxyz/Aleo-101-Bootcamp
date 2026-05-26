# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。


## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: Leo 的默认语义是“默认私有”。在 record 组件声明里，如果没有显式写 `public`、`private` 或 `constant`，编译器会默认按 `private` 处理；在实际使用上，这也体现为 Leo 更偏向把敏感状态放在私有 record 里，由 owner 持有并通过 view key 查看，而不是默认公开暴露到链上。只有当开发者明确声明为 `public` 时，相关输入、字段或状态才会公开可见。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: Leo 允许把 tuple、array 和 struct 组合使用。比如：

```leo
struct Point {
    x: u16,
    y: u16,
}

let points: [Point; 2] = [
    Point { x: 1u16, y: 2u16 },
    Point { x: 3u16, y: 4u16 },
];

let data: ([Point; 2], u8) = (points, 9u8);
```

访问方式分三层：

1. tuple 用 `.索引` 访问，例如 `data.0` 取出第一个元素，也就是 `[Point; 2]`。
2. array 用 `[索引]` 访问，例如 `data.0[1]` 取出第二个 `Point`。
3. struct 用 `.字段名` 访问，例如 `data.0[1].x` 取出第二个 `Point` 的 `x` 字段。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 是 Aleo record 里必须存在的字段，类型必须是 `address`。它的作用主要有三点：

1. 标识这条 record 归谁所有，谁有权消费这条私有状态。
2. 支撑 Aleo 的私有 UTXO/Record 模型，让状态可以按 owner 分散持有，而不是都堆在公开账户状态里。
3. 配合加密和承诺机制，让 record 能以私有状态形式存在链上，但只有对应 owner 能真正查看和使用。

简单说，`owner` 决定了这条 record 属于谁，也决定了谁能把它作为后续 transition 的输入。

---

**Q4. 程序中的 final 是什么？**

A: `final` 是 Leo 里专门用于“链上最终执行”的机制。Leo 的很多计算先在链下完成，生成证明；但涉及 `mapping`、`storage` 这类公共链上状态时，就需要把相应逻辑放到 `final { }` 或 `final fn` 中，由链上节点继续执行。

所以 `final` 的核心作用是：

1. 承接链下执行完成后的链上状态更新。
2. 让程序可以安全地读写公共状态，而不是只处理私有 record。
3. 把“链下隐私计算”和“链上状态变更”分开，符合 Aleo 混合虚拟机的设计。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: Leo 里的 helper function 用普通 `fn` 声明，并且要写在 `program {}` 块之外。例如：

```leo
fn add_fee(amount: u64, fee: u64) -> u64 {
    return amount + fee;
}

program demo.aleo {
    fn main(amount: u64) -> u64 {
        return add_fee(amount, 1u64);
    }
}
```

它的特点是：

1. 只能被程序内部调用，不能作为外部入口直接运行。
2. 参数没有 `public/private` 这类可见性修饰符，因为它不是外部接口。
3. 主要用于封装重复逻辑、提升可读性。

---

**Q6. helper functions 能否创建 records？**

A: 不能。Helper functions 只能做内部计算，不能创建 record。创建或返回 record 的权限属于 entry function，因为 record 代表的是链上的私有状态单元，它的生成和消费必须由真正的程序入口来管理。

---

**Q7. constructor 的目的是什么？**

A: 这里的 constructor 不是普通面向对象语言里的“初始化函数”，而是 Leo 里用于定义**程序升级规则**的机制。它的目的是提前规定这个程序：

1. 是否允许升级；
2. 如果允许升级，由谁升级；
3. 升级时要满足什么约束。

例如课程里提到的 `no_upgrade`，就是一个内置注解，表示这个程序不可升级。对应地，也可以有管理员控制、校验 checksum 等升级策略。也就是说，constructor 的核心目的，是把“程序升级的治理规则”写死在部署逻辑里。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 组合多个 interface 的方式，是在新接口定义里用 `:` 继承、用 `+` 叠加。例如：

```leo
interface Transfer {
    record Token;
    fn transfer(input: Token, to: address, amount: u64) -> Token;
}

interface Balances {
    mapping balances: address => u64;
}

interface Token : Transfer + Balances {}
```

这表示 `Token` 同时包含 `Transfer` 和 `Balances` 两个接口要求。对应的程序如果声明自己实现 `Token`，就必须同时满足这两部分约束。

---

**Q9. record interface 中 `..` 的含义是什么？**

A: `..` 的意思是：“这些字段是必须的，但实现方可以再额外加字段。”  
例如：

```leo
interface TokenStandard {
    record Token {
        owner: address,
        balance: u64,
        ..
    }
}
```

这表示任何实现这个接口的 `Token` record，至少必须有 `owner` 和 `balance`，但不要求 record 只能有这两个字段。它允许实现者在满足接口最低要求的前提下，继续扩展自己的 record 结构。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当程序要在**运行时**决定调用哪个外部程序，而且事先并不知道对方 record 的精确布局时，就应该使用 `dyn record`。典型场景是：

1. 做动态分派，目标程序在运行时才确定；
2. 需要处理多个兼容同一接口、但 record 具体结构不同的外部程序；
3. 想写一个可复用的“路由型”逻辑，而不是为每个外部程序单独写一套静态调用。

简单说，`dyn record` 适合“接口已知，但具体 record 形状在编译时未知”的场景。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: `storage vector` 可以理解为链上可增长的数组，核心操作包括：

1. `get(idx)`：读取指定位置的元素，如果越界返回 `none`。
2. `len()`：返回当前长度。
3. `set(idx, value)`：修改指定索引上的值。
4. `push(value)`：在尾部追加一个元素。
5. `pop()`：弹出并返回最后一个元素。
6. `swap_remove(idx)`：删除指定位置元素，并用最后一个元素补到这个位置。
7. `clear()`：清空整个 vector。

这些操作让 `storage vector` 很适合处理链上需要动态增删的有序数据集合。
