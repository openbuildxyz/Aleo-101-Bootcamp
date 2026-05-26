# Task 2 - Leo 入门：学会这门语言 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A:`Leo`中所有变量和`record`字段默认都是`private`（私有的），即对链上其他参与者不可见。只有通过显式声明`public` 才会公开。这意味着开发者不需要额外操作就能保护数据隐私，隐私是内建的而非需要额外开启的特性。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:

```leo
struct Point {
  x: u32,
  y: u32,
}

let t: ([Point; 2], u32) = (
  [
​    Point { x: 1u32, y: 2u32 },
​    Point { x: 3u32, y: 4u32 }
  ],
  99u32
);

let val: u32 = t.0[1].x;
```

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A:`owner: address` 是 record 的强制字段，代表record的所有权，只有拥有对应私钥的用户才能解密查看 record 内容，并在后续交易中将其作为输入消费。

---

**Q4. 程序中的 final 是什么？**

A:`final {}`写在fn内部，标记链上的执行逻辑，`final {}`内部的代码在zk证明验证通过后由全网节点在链上执行，用于更新公告状态。`final fn`定义在program外部的可复用的finalization逻辑，编译时内联到`final {}` 块中

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:使用`fn`关键字声明，定义在program块外部，`Helper fn`只能进行纯计算，不能创建record，且输入不能有visibility修饰符

```leo
program my_app.aleo {
  fn main(a: u32, b: u32) -> u32 {
​    return helper_add(a, b);
  }

  fn helper_add(x: u32, y: u32) -> u32 {
​    return x + y; 
  }
}
```

program内部的`fn`可以调用`helper fn`，`helper fn`只能调用其他的`helper fn`。

---

**Q6. helper functions 能否创建 records？**

A:不能，helper fn只能进行计算，无法创建或者返回records，records只能在program内部fn中创建和返回，这是leo的核心约束

---

**Q7. constructor 的目的是什么？**

A:`constructor`是一种特殊的entry `fn`，在程序每次部署和升级时执行，用于初始化链上的状态，并控制程序的升级权限，所有程序必须显示声明`constructor`。通过注解可以配置不同的升级策略

---

**Q8. 如何组合多个 interfaces（接口）？**

A:

```leo
interface Transfer {
​   record Token;
    ​fn transfer(input: Token, to: address, amount: u64) -> Token;
}

interface Balances {
    ​mapping balances: address => u64;
}

// 组合接口
interface Token: Transfer + Balances {}

program my_token.aleo: Token {
    ​// 实现Transfer和Balances的所有要求
}
```

---

**Q9. record interface 中 `..` 的含义是什么？**

A:`..`表示结构化子类型约束，它允许接口约束record的最小形状，同时不限制实现程序扩展额外字段

---

**Q10. 何时使用 dyn record（动态 record）？**

A:当函数需要在运行时处理结构未知的record时使用，dyn record是一种固定大小的通用表示，通过Merkle证明验证对未知字段的访问，实现跨程序的动态互操作

```leo
fn route_private_transfer (
    token_program: field,
    input: dyn record,
    to: address,
    amount: u64
) -> dyn record {
    return TokenStandard@(token_program)::transfer_private(input, to, amount);
}
```

---

**Q11. storage vector 支持的核心操作有哪些？**

A:
`push` -> 在末尾添加元素
`get` -> 按索引获取元素
`set` -> 按索引更新元素
`swap_remove` -> 移除指定索引元素，用末尾元素补填返回
`len` -> 获取当前的长度
`pop` -> 弹出并返回末尾的元素
`clear`-> 清空向量
