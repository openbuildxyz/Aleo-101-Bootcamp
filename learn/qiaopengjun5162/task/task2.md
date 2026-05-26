# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 在 Leo 语言中，“默认隐私”的语义是：所有变量、函数输入和输出在默认情况下都是私有的，计算完全在本地（链下）闭门进行。

链上节点不会看到你的明文数据或执行过程，它们只负责接收并验证你本地生成的零知识证明（ZK Proof）。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: 在 Leo 语言中，一个包含结构体数组（Array of Structs）的元组（Tuple）示例如下：

### 1. 定义与初始化

```leo
// 定义一个基础结构体
struct Point {
    x: u32,
    y: u32,
}

function test_tuple() {
    // 初始化一个元组
    // 第一个元素是一个长度为 2 的 Point 结构体数组
    // 第二个元素是一个普通的 u32 整数
    let my_tuple: ([Point; 2], u32) = (
        [
            Point { x: 10u32, y: 20u32 },
            Point { x: 30u32, y: 40u32 }
        ],
        99u32
    );
}

```

---

### 2. 如何访问其中的元素

在 Leo 中，**不能在一行代码里进行连续的多级深度点选或索引**（例如直接写 `let val = my_tuple.0[0].x;` 会引发编译器解析错误）。

你必须使用**解构（Destructuring）**或者**中间变量**来安全地逐层拆解访问：

#### 方法 A：解构赋值（最推荐，标准的 Leo 写法）

```leo
// 1. 将元组解构，直接提取出里面的数组
let (my_array, _): ([Point; 2], u32) = my_tuple;

// 2. 从数组中获取特定索引的结构体
let first_point: Point = my_array[0u8];

// 3. 访问结构体内部的具体字段
let point_x: u32 = first_point.x; // 返回 10u32

```

#### 方法 B：使用中间变量提取

```leo
// 1. 先用点运算符将整个数组提取到中间变量
let arr_copy: [Point; 2] = my_tuple.0;

// 2. 再通过索引和点运算符访问字段
let point_y: u32 = arr_copy[1u8].y; // 返回 40u32

```

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: 在 Aleo 的 Record 模型中，`owner` 字段的作用是**显式定义该加密记录的绝对所有权**。

具体表现为以下两点：

1. **访问与解密权限**：所有的 Record 数据在链上默认都是加密的。只有 `owner` 字段指定的 `address`（地址）所对应的私钥（PrivateKey）持有人，才能在本地解密并查看该 Record 的明文数据（如余额、属性等）。
2. **消费与状态转换权限**：当需要花费或转换一个 Record 的状态时（例如转账），只有该 Record 的 `owner` 才能对交易进行本地授权并生成零知识证明（ZK Proof）。非 owner 地址试图消耗该 Record 时，在本地或链上共识阶段均无法通过验证。

---

**Q4. 程序中的 final 是什么？**

A: 在 Leo 语言中，`final` 是用于实现**链上状态持久化（更新 Ledger）的延迟执行机制**。

由于 Leo 采用混合虚拟机架构，程序的执行分为两个阶段：

1. **链下（Off-chain）隐私阶段**：代码在用户本地设备上默默执行（`transition`），数据是隐私的，并在这里生成零知识证明（ZK Proof）。**此时无法修改链上的全局状态（比如 `mapping`）。**
2. **链上（On-chain）公开阶段**：当本地计算完成后，通过 `return final` 将需要公开修改状态的代码块“递交”给链上的 Final 节点。

**核心作用：**
当且仅当本地提交的 ZK Proof 在链上通过验证后，Final 节点才会在公链上真正执行 `final` 块内部的代码，去安全地更新链上状态（如修改 `mapping` 或读写 `storage`），从而完成数据的链上持久化。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 在 Leo 语言中，创建 **helper functions（辅助函数）** 只需要使用 `fn` 关键字在程序中定义即可。

### 1. 语法示例

辅助函数可以定义在 `program` 块的内部或外部。

```leo
// 1. 定义辅助函数（计算 x - y）
fn foo(x: u64, y: u64) -> u64 {
    return x - y;
}

program hello.aleo {
    // 2. 在 transition（主入口）中调用它
    fn main(public x: u64, y: u64) -> private u64 {
        let z: u64 = foo(x, y); // 直接调用
        return z;
    }
}

```

### 2. 核心规则与限制

编写辅助函数时，必须遵守以下几个冷酷的硬性规定：

* **不能包含 Transition 逻辑**：辅助函数只能用于纯粹的数值计算、算法逻辑或结构体（Struct）处理。
* **不能读写链上状态**：在 `fn` 内部**不能**操作 `mapping` 或 `storage`，这些活只能由 `final fn` 来干。
* **不能产生/消耗 Record**：由于辅助函数在编译时会被完全内联展开（Inline）到调用它的环境中，它本身**没有**生成全新资产记录（Record）或花费资产的权限。

---

**Q6. helper functions 能否创建 records？**

A: **不能。**

在 Leo 语言中，辅助函数（`fn`）**绝对无法**创建或返回 `record`。

### 为什么不行？

1. **编译机制（Inlining）**：辅助函数在编译时会被完全内联展开到调用它的主程序中。它只负责纯粹的数值计算、算法逻辑或 `struct` 结构体处理，没有独立的零知识证明（ZK）电路上下文来承载状态资产。
2. **权限限制**：在 Leo 的资产模型中，`record` 代表的是链上的加密隐私资产状态。**只有 `transition`（以及被其调用的构造函数）才拥有创建、销毁或修改 `record` 的特权**。

如果你强行在 `fn` 里尝试初始化或返回一个 `record`，Leo 编译器会直接无情地报错。

---

**Q7. constructor 的目的是什么？**

A: 用来定义程序是否可升级，并规定该程序后续升级时必须遵守的验证逻辑与约束条件。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 在声明 `program` 时，使用冒号（`:`）**和**加号（`+`）将多个定义好的接口拼接起来即可。

**示例语法：**

```leo
program my_token.aleo : Transfer + Pausable {
    // 程序内部必须完整实现 Transfer 和 Pausable 接口中要求的所有 Record、Mapping 和函数
}

```

---

**Q9. record interface 中 `..` 的含义是什么？**

A: 在 `record interface` 中，`..` 的含义是**通配符/匿名省略**。

它表示该接口只对业务核心字段（如 `owner`、`amount`）进行硬性约束；而在具体的 `program` 实现中，该 Record 允许包含其他任意数量的自定义额外字段，而不会破坏接口的兼容性。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 在**动态分派（Dynamic Dispatch）**场景下，当程序需要在**运行时**动态调用外部合约，并且需要接收或处理外部合约传来的隐私资产记录时，必须使用 `dyn record`（动态 record）。

它充当了一个**泛型/通配符资产类型**，允许你的函数在编译时不绑定具体的合约，就能安全地接收并处理任何实现了指定接口约束的加密 Record。

**典型场景：**

* 编写聚合器或路由器（如 DEX 路由、跨币种转账），需要处理用户指定的目标代币记录。
* 主程序不知道未来会调用哪个子合约，通过 `dyn record` 保持对底层隐私状态的兼容。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: 在 Leo 语言中，`storage vector`（链上向量）支持以下 6 个核心操作：

* **`.push(value)`**：在向量的末尾添加一个新元素。
* **`.pop()`**：弹出并返回向量的最后一个元素。
* **`.get(index)`**：获取指定索引处的元素。
* **`.set(index, value)`**：将指定索引处的元素修改为新值。
* **`.len()`**：返回当前向量中元素的总数量。
* **`.swap_remove(index)`**：从向量中移除指定索引的元素并返回它。为了保持内存紧凑，被移除的元素会被向量中的**最后一个元素**直接替换补位。
