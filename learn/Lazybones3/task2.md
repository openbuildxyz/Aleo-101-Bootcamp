# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 当声明函数参数或返回值时，如果不显式指定可见性（visibility），Leo 会默认将其视为 private（私密/隐私）。这意味着该参数或返回值在链上将是加密的，不会公开暴露。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: 在 Leo 中，Tuple（元组） 和 Array（数组） 类似，但 Tuple 使用圆括号 () 来混合不同的类型，而 Array 使用方括号 [] 且所有元素必须是相同类型。

只有 record 可以拥有 struct，但 struct 不能拥有 record。例如：

```
record D {
    owner: address,
    payer: StructName,  // struct 作为 record 的一个字段
}
```

访问 struct 中的元素：使用 点号（.）语法来访问。例如：sender.owner 可以读取 sender 这个 record 中的 owner 字段值，sender.balance 可以读取 balance 字段值。同样，对于 struct 中的字段也用 . 方式访问。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: 在 Aleo 的 record 中，owner 字段是强制且必须的，其作用是：

1. 标识记录的拥有者：每个 record 都必须有一个 owner，通常是用户本身的地址。owner 指定了这个 record 归谁所有。
2. 实现隐私和并发性：由于 record 采用 UTXO 模型，每个用户只使用自己的 record 进行交互并更新自己的 record 状态，因此不会影响其他用户的 record。owner 字段确保了只有对应的拥有者才能读取和消费该 record。
3. 记录归属和权限控制：例如在转账场景中，新生成的 record 的 owner 字段决定了该 record 返回给谁——剩余余额的 record 的 owner 应设为发起方（sender），转账的 record 的 owner 应设为接收方（receiver）。
4. record 的第一行必须是 owner：在声明 record 时，owner 必须是第一个字段，类型为 address。

---

**Q4. 程序中的 final 是什么？**

A: final 是 Leo 中一种延迟调用机制（deferred execution mechanism）。在 final 代码块中的逻辑不会在链下执行，而是会被上传到链上，由链上节点的虚拟机来执行。它的存在原因：

1. 链下虚拟机无法读取链上数据：因为链下执行可以是断线的（为了保护隐私），所以无法读取链上的共享状态。
2. 与链上状态交互：final 允许开发者选择性地让合约包含需要在链上执行的逻辑，从而可以与链上共享数据（如 mapping、storage 等）进行交互和更新。
3. 语法：使用 final fn 来声明一个 final 函数，它会在链上执行。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 在 Leo 中创建 helper functions（辅助函数/内部函数）的方式：

1. 在 program 块外面声明：所有辅助函数都应该在 program 块之外声明。这表示它是一个辅助的（helper/internal）函数，只有程序或合约本身可以调用，外部用户不能调用。
2. 使用 fn 关键字：语法与普通函数相同，使用 fn 加函数名、参数和返回类型。
3. 区分 entry function 和 helper function：
  - Entry function（入口函数）：在 program 块内部声明的 fn，是用户可以与之交互的函数。
  - Helper function（辅助函数）：在 program 块外面声明的 fn，是内部函数，只有程序/合约本身可以调用。

```
program hello.aleo {
    fn main(public x: u64, y: u64) -> u64 {
        return add(x, y);  // 调用辅助函数
    }
}

fn add(x: u64, y: u64) -> u64 {
    return x + y;
}
```

---

**Q6. helper functions 能否创建 records？**

A: helper functions（辅助函数）不能创建 records。只有 entry functions（入口函数） 才能创建和返回 records。

---

**Q7. constructor 的目的是什么？**

A: constructor 的目的是定义程序的可升级逻辑，其特性如下：

1. 定义升级规则：constructor 用于定义合约/程序在什么条件下可以被升级。例如，可以设定只有管理员地址才能升级，或需要通过 DAO 投票的 checksum 验证才能升级。
2. 升级逻辑本身不可升级：constructor 中定义的升级逻辑是永久的，在部署之前就必须确认正确，且部署后不可更改。
3. 内置升级注解：Leo 提供了几种内置的 constructor 注解：
  - no_upgrade：合约不可升级，编译器自动生成 constructor 确保不可升级
  - admin(地址)：只有指定管理员地址可以升级
  - checksum(合约)：需要通过指定合约中记录的 checksum 来验证升级合法性
  - 自定义（custom）：开发者自己编写升级逻辑
4. 版本追踪：程序有 edition 属性，首次部署为 0，每次升级自动加一。

---

**Q8. 如何组合多个 interfaces（接口）？**

A:

1. 使用冒号 : 连接 program 和接口：在 program 名称后加冒号，再写接口名称。
2. 使用加号 + 合并多个接口：如果需要同时实现多个接口，用 + 号将接口名称连接起来。

```
program my_token.aleo : transfer + pausable {
    // 必须同时实现 transfer 和 pausable 接口中定义的所有类型和函数
}
```

这表示该合约必须同时满足 transfer 和 pausable 两个接口的约束——必须拥有两个接口要求的所有 record 类型和函数签名。

---

**Q9. record interface 中 `..` 的含义是什么？**

A: 表示接口只定义了 record 中必须存在的字段（如 owner: address 和 balance: u64），而 .. 表示实现该接口的合约可以在这些必要字段之外，自行添加更多的额外字段或数据。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: dyn record（动态 record） 用于 动态分派（dynamic dispatch） 场景，即合约在运行时才决定调用哪个外部合约的函数。使用 dyn record 的时机：

1. 跨合约动态调用：当你的合约需要在运行时选择调用不同外部合约的函数时，需要使用 dyn record。因为此时你不确定外部合约的 record 具体名称和结构，只知道它符合某个 interface。
2. record 属于外部合约：dyn record 告诉你的合约，这个 record 的输入/输出将是属于外部合约的 record，而不是当前合约自己定义的 record。
3. 配合 interface 和 @target 使用：通过定义 interface（如 ARC20），然后用 接口名@target::函数名 的方式调用外部合约，其中 target 是 identifier 类型的参数，代表目标合约的 ID（如 credits.aleo 或 usdcx.aleo）。
4. 读取外部合约的链上状态：在 finalize 中也可以使用 dyn record 来读取与接口定义兼容的外部合约的链上状态。

---

**Q11. storage vector 支持的核心操作有哪些？**

A:

1. push：在 vector 的尾端加入一个新元素（动态数组追加）。
2. pop：弹出（移除并返回）vector 的最后一个元素，数组长度减一。
3. get：通过索引找出指定位置的元素值，例如 get(5) 获取第5个元素。
4. set：设置指定位置的值为新值，例如 set(3, 5u32) 将第3个位置设为 5。
5. len：获取 vector 的总长度。
6. remove：移除指定位置的元素。
