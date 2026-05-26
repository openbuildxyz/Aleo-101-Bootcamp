# Task 2 - Leo 入门：学会这门语言

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: "Private by Default" 是 Leo 语言的核心设计理念，意味着：
1. **默认隐私**：在 Leo 中，所有变量、记录（record）字段和函数输入默认都是私有的（private），除非显式声明为 `public`
2. **显式公开**：开发者需要主动使用 `public` 关键字来标记需要公开的数据
3. **自动 ZK 证明**：编译器会自动为私有数据生成零知识证明逻辑，开发者无需手动编写电路
4. **隐私与灵活并存**：开发者可以根据业务需求自由选择哪些数据保持私密、哪些数据公开

示例：
```leo
record Token {
    owner: address,        // 默认 private
    amount: u64,           // 默认 private
    public symbol: field,  // 显式 public
}
```

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:
```leo
// 定义 struct
struct Point {
    x: u32,
    y: u32,
}

// Tuple 包含 array 和 struct
let t: ([u8; 3], Point, bool) = (
    [1u8, 2u8, 3u8],
    Point { x: 10u32, y: 20u32 },
    true
);

// 访问方式 1：解构（destructuring）
let (arr, point, flag) = t;

// 访问方式 2：索引访问
let first_array_element: u8 = t.0[0];  // 1u8
let point_x: u32 = t.1.x;              // 10u32
let point_y: u32 = t.1.y;              // 20u32
let flag_value: bool = t.2;            // true
```

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 字段是 Aleo record 的**必需字段**，其作用包括：
1. **所有权标识**：指定谁有权消费（spend）这个 record
2. **授权消费**：只有 record 的 owner 才能将该 record 作为输入传递给 transition function 进行消费
3. **隐私保护**：owner 地址默认是加密的，保护用户身份隐私
4. **序列号生成**：record 的唯一标识（serial number nonce）通过 owner 的地址私钥（ask）和 record 序列号计算得出

每个 record 必须包含 `owner: address` 字段，且当 record 作为函数输入时，还需要 `_nonce: group` 字段。

---

**Q4. 程序中的 final（async function）是什么？**

A: 在 Leo 中，用于链上状态更新的函数经历了语法演变：

- **Leo v3.3 语法**：使用 `final` 或 `final fn` 关键字声明
- **Leo v4.0 语法**：统一改为 `async function`

两者功能相同，都是用于**链上状态更新**的函数：
1. **声明位置**：在 `program {}` 内部声明
2. **功能**：执行链上状态变更（更新 mappings、storage 等）
3. **与 helper function 的区别**：
   - `async function` / `final fn` 可以访问 mappings 和 storage（链上状态）
   - `async function` / `final fn` 在异步上下文中执行，返回 `Future`
   - `helper function` 不能访问链上状态，只能进行纯计算
4. **调用方式**：只能被 `async transition` 调用，不能直接由用户调用
5. **用途**：将公共的链上状态更新逻辑抽象出来，避免代码重复

> **历史演变说明**：`final` / `final fn` 是 Leo v3.3 及之前版本的语法，v4.0 已统一改为 `async function`。两者在语义上完全等价，只是语法关键字不同。

示例：
```leo
program token.aleo {
    mapping balance: address => u64;

    // Async transition 是用户入口
    async transition mint(addr: address, amount: u64) -> Future {
        return update_balance(addr, amount);
    }

    // Async function 执行链上状态更新
    async function update_balance(addr: address, amount: u64) {
        let current: u64 = Mapping::get_or_use(balance, addr, 0u64);
        Mapping::set(balance, addr, current + amount);
    }
}
```

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: Helper function 在 Leo 中使用 `function` 关键字声明，位于 `program {}` 内部：

```leo
program calculator.aleo {
    // Helper function 定义
    function add(a: u64, b: u64) -> u64 {
        return a + b;
    }
    
    function multiply(a: u64, b: u64) -> u64 {
        let result: u64 = 0u64;
        for i: u64 in 0u64..b {
            result = add(result, a);
        }
        return result;
    }
    
    // Transition 可以调用 helper function
    transition calculate(x: u64, y: u64) -> u64 {
        let sum: u64 = add(x, y);
        let product: u64 = multiply(x, y);
        return sum + product;
    }
}
```

Helper function 特点：
- 只能在 program 内部调用
- 不能访问链上状态（mappings/storage）
- 用于封装可复用的计算逻辑

---

**Q6. helper functions 能否创建 records？**

A: **不能**。Helper functions 不能创建 records。

只有 **transition functions** 才能创建和返回 records。这是 Leo 的设计约束：
- Transition functions 是程序的入口点，可以消费和生成 records
- Helper functions 只能进行纯计算，不能产生链上状态变更（包括创建 records）

如果需要在 helper function 中构造 record 数据，可以返回一个 struct，然后在 transition 中将其转换为 record。

---

**Q7. constructor 的目的是什么？**

A: **Leo 没有传统 OOP 语言中的 constructor（构造函数）概念。**

Leo 是一种基于零知识证明的函数式语言，其设计哲学与传统面向对象语言不同：

1. **没有类（class）和对象实例化**：Leo 的核心单元是 `program`，而不是 class。因此不存在通过 constructor 创建对象实例的机制。

2. **程序状态初始化通过 `initialize` transition 完成**：
```leo
program token.aleo {
    mapping total_supply: u8 => u64;

    // 通过 transition 初始化链上状态
    async transition initialize() -> Future {
        return init_state();
    }

    async function init_state() {
        Mapping::set(total_supply, 0u8, 1_000_000u64);
    }
}
```

3. **常量声明**：在 program 作用域中声明的 `const` 是编译期常量，不是运行期状态初始化：
```leo
program token.aleo {
    const DECIMALS: u8 = 6u8;  // 编译期常量，非 constructor
}
```

4. **Record 的构造只是数据创建**：`Token { owner: addr, amount: 100u64 }` 这种语法是 record 字面量（literal），用于创建 record 数据值，与传统 OOP 中通过 constructor 初始化对象实例有本质区别。

> **总结**：Leo 中没有 constructor。如果需要"初始化"程序状态，应通过用户调用的 `initialize` 或 `init` transition 来完成链上状态（如 mappings）的首次设置。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: Leo 支持通过 **interface 组合** 来实现类似多重继承的功能：

```leo
interface IERC20 {
    function total_supply() -> u64;
    function balance_of(owner: address) -> u64;
}

interface IERC721 {
    function owner_of(token_id: field) -> address;
    function transfer(to: address, token_id: field);
}

// 组合多个 interface（概念性语法，具体语法请参考 Leo 官方文档）
interface IHybridToken : IERC20, IERC721 {
    function hybrid_mint(to: address, amount: u64, token_id: field);
}

// 实现组合后的 interface
program hybrid.aleo : IHybridToken {
    // 必须实现所有父 interface 的方法
    function total_supply() -> u64 { ... }
    function balance_of(owner: address) -> u64 { ... }
    function owner_of(token_id: field) -> address { ... }
    function transfer(to: address, token_id: field) { ... }
    function hybrid_mint(to: address, amount: u64, token_id: field) { ... }
}

> **注意**：`interface IHybridToken : IERC20, IERC721` 这种组合语法为概念性示例。Leo interface 的具体语法（尤其是组合/继承语法）可能随版本变化，建议以 [Leo 官方文档](https://docs.leo-lang.org/) 为准。
```

---

**Q9. record interface 中 `..` 的含义是什么？**

A: 在 record interface 中，`..` 是**记录更新语法（record update syntax）**，用于基于现有 record 创建新 record，同时修改部分字段：

```leo
let old_token: Token = Token {
    owner: addr1,
    amount: 100u64,
};

// 使用 .. 基于 old_token 创建新 record，只修改 amount 字段
let new_token: Token = Token {
    ..old_token,
    amount: 50u64,  // 覆盖原 amount
};
// new_token 的 owner 仍然是 addr1，amount 变为 50
```

`..` 的作用：
- 复制原 record 中未显式指定的所有字段
- 避免重复书写所有字段
- 特别适用于只需要修改少数字段的场景

---

**Q10. 何时使用 dyn record（动态 record）？**

A: `dyn record` 用于需要**运行时多态**的场景，当程序需要在运行时处理不同类型的 records 时使用：

使用场景：
1. **异构集合**：需要存储不同类型的 records（如不同类型的 NFT）
2. **动态分发**：运行时根据条件决定处理哪种类型的 record
3. **跨程序交互**：与其他程序交互时，对方返回的 record 类型在编译时不确定

示例：
```leo
// 定义基础 record interface
record BaseToken {
    owner: address,
    amount: u64,
}

// 动态 record 类型
transition process_dyn_token(token: dyn BaseToken) -> u64 {
    // 可以在运行时接受任何符合 BaseToken 接口的 record
    return token.amount;
}
```

> **注意**：`dyn record` 语法为概念性示例。Leo 中 record 和 interface 的具体多态语法可能随版本变化，建议以 [Leo 官方文档](https://docs.leo-lang.org/) 为准。如果该特性存在，使用时需注意其可能带来的运行时开销。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: Storage vector（存储向量）是 Leo v3.3+ 引入的持久化存储结构，支持以下核心操作：

```leo
program storage_demo.aleo {
    storage users: [address];  // 声明 storage vector
    
    async transition demo() -> Future {
        return async {
            // 1. push - 在末尾添加元素
            users.push(aleo1rhgdu77wep2vmlz0sy9hgz3zmr29t6cwxzd0q6q3qqr5c0sxyuqxj0r9x);
            
            // 2. pop - 移除并返回最后一个元素
            let last: address = users.pop();
            
            // 3. get - 获取指定索引的元素（返回 optional）
            let user: address? = users.get(0u32);
            let first: address = users.get(0u32).unwrap();
            
            // 4. set - 设置指定索引的元素
            users.set(0u32, aleo1rhgdu77wep2vmlz0sy9hgz3zmr29t6cwxzd0q6q3qqr5c0sxyuqxj0r9x);
            
            // 5. len - 获取 vector 长度
            let count: u32 = users.len();
            
            // 6. swap_remove - 移除指定索引元素，用最后一个元素替换
            let removed: address = users.swap_remove(2u32);
            
            // 7. clear - 清空所有元素
            users.clear();
        };
    }
}
```

**核心操作总结**：
| 操作 | 说明 |
|------|------|
| `push(value)` | 在末尾添加元素 |
| `pop()` | 移除并返回最后一个元素 |
| `get(index)` | 获取指定索引元素（返回 optional） |
| `set(index, value)` | 设置指定索引的值 |
| `len()` | 返回元素数量 |
| `swap_remove(index)` | 移除元素并用末尾元素填补 |
| `clear()` | 清空所有元素 |

注意：storage vector 操作只能在 `async function` 或 `async` 块中执行。
