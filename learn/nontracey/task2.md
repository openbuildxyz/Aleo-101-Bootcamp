# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: Leo 中的 "Private by Default" 意味着所有变量、Record 字段和函数输入默认都是私有的，除非显式标注 `public` 或 `constant`。Record 中的字段如果未提供可见性修饰符，Leo 默认将其设为 `private`。私有数据在链上以加密形式存储（ciphertext），只有持有相应 view key 的地址才能解密查看。Aleo 通过这种设计实现了对用户隐私的天然保护——开发者不需要刻意"选择"隐私，隐私是内置的、默认开启的。此外，函数输入默认也是私有的，只有被声明为 `public` 的输入才会公开到链上。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: 以下是一个 Tuple 嵌套包含 Array 和 Struct 的完整示例：

```
struct Bar {
    data: (u8, u8),
}

struct Baz {
    value: u64,
}

// 声明：一个包含 struct 的数组，每个 struct 中包含 tuple
let arr: [Bar; 2] = [
    Bar { data: (1u8, 2u8) },
    Bar { data: (3u8, 4u8) },
];

// 声明：一个 tuple，包含不同类型的 struct
let tup: (Bar, Baz) = (
    Bar { data: (10u8, 20u8) },
    Baz { value: 100u64 },
);

// 访问 struct 中的元素使用点号 `.`
let bar: Bar = tup.0;          // 通过索引 0 访问 tuple 中的第一个 struct
let baz: Baz = tup.1;          // 通过索引 1 访问 tuple 中的第二个 struct
let x: u8 = bar.data.0;        // 访问 struct 中 tuple 的第一个元素
let y: u8 = bar.data.1;        // 访问 struct 中 tuple 的第二个元素

// 访问数组元素
let first: Bar = arr[0u8];     // 常量索引访问数组
let val: u8 = arr[1u8].data.0; // 链式访问
```

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 字段是 Aleo Record 的**必选字段**，类型为 `address`。它指定了该 Record 的**所有者**，即**唯一有权消费（spend/使用）该 Record 的地址**。Record 被消费者的私钥所控制，只有持有对应私钥的地址才能将 Record 作为输入传入程序的过渡函数中，以此来改变程序状态。`owner` 字段确保了：1) 只有 Record 的所有者才能授权状态转换；2) Record 的数据（payload）使用所有者的地址进行加密，使得链上数据即使公开存储，也只有所有者能解密查看其内容。

---

**Q4. 程序中的 final 是什么？**

A: `final` 是用于定义**链上公开执行逻辑**的机制，有两种形式：

1. **`final { }` 块**：嵌在 entry `fn` 内部，返回 `Final` 类型。其中的代码在链上公开执行，用于读写公共状态（mapping、storage 变量、storage vector）。Final 块是原子性的——要么全部成功，要么全部回滚。

2. **`final fn`**：声明在 `program {}` 块外部，用于封装可复用的链上逻辑。`final fn` 的代码在编译时会被**内联（inline）**到调用者的 `final { }` 块中，不存在共享函数的概念。

关键规则：
- 只有 `final { }` 和 `final fn` 内可以操作 mapping、storage 变量和 storage vector。
- Record 的创建和消费只能在 entry `fn` 的函数体内（proof context）进行，不能在 `final { }` 块中。
- `final fn` 只能调用其他 `final fn`，不能调用 helper `fn` 或 entry `fn`。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: Helper function 声明在 `program { }` 块**外部**，语法为：

```
fn foo(a: field, b: field) -> field {
    return a + b;
}
```

关键规则：
- 输入参数**不能**有可见性修饰符（如 `public`），因为它们只在内部使用。
- Helper function 只能调用其他 helper function，不能调用 entry `fn` 或 `final fn`。
- Helper function **不能**创建或生成 Record。
- 支持 const generics：`fn sum_first_n_ints::[N: u32]() -> u32 { ... }`
- 如果被多处调用且希望保持函数边界，可使用 `@no_inline` 注解防止编译器自动内联。

---

**Q6. helper functions 能否创建 records？**

A: **不能**。根据 Leo 官方文档，helper function 可以执行计算、返回值，但**不能创建（produce）records**。Record 的创建只能在 entry `fn` 的函数体内（proof context）进行。这是因为 Record 代表链上私有状态，其创建需要涉及零知识证明的生成，这部分逻辑被限定在程序的公共接口（entry function）中。

---

**Q7. constructor 的目的是什么？**

A: `constructor` 是一个**特殊的函数**，在每次程序部署和升级时在链上执行。它的核心目的是**控制程序的可升级性**，充当程序升级的"守门员"。

关键特性：
- **强制存在**：所有程序部署时必须带有 `constructor`。如果 constructor 逻辑失败（如 `assert` 失败），整个部署/升级交易将被拒绝。
- **不可变性**：constructor 中的逻辑在首次部署后**永久锁定**，后续升级也无法修改其逻辑。

四种升级模式：
| 模式 | 描述 |
|------|------|
| `@noupgrade` | 程序不可升级 |
| `@admin(address="...")` | 只有指定的管理员地址可升级 |
| `@checksum(mapping="...", key="...")` | 由链上治理程序管理的 checksum 决定 |
| `@custom` | 完全自定义可升级逻辑 |

constructor 中可以访问 `self.edition`（版本号）、`self.program_owner`（部署者地址）、`self.checksum`（程序校验码）等程序元数据。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 使用 `+` 运算符组合多个接口。有两种场景：

**程序实现多个接口：**
```
program my_token.aleo : Transfer + Pausable {
    mapping paused: address => bool;
    record Token {
        owner: address,
        balance: u64,
    }
    fn transfer(input: Token, to: address, amount: u64) -> Token {
        return Token { owner: to, balance: input.balance - amount };
    }
    fn pause() -> (bool, Final) {
        return (true, final {
            Mapping::set(paused, self.caller, true);
        });
    }
}
```

**接口继承/组合：**
```
interface Transfer {
    record Token;
    fn transfer(input: Token, to: address, amount: u64) -> Token;
}

interface Balances {
    mapping balances: address => u64;
}

// Token 接口继承了 Transfer 和 Balances 的所有要求
interface Token : Transfer + Balances {}

// 实现 Token 接口即需满足 Transfer 和 Balances 两者
program my_token.aleo : Token { /* ... */ }
```

---

**Q9. record interface 中 `..` 的含义是什么？**

A: `..` 表示**实现者可声明额外字段**。它告诉编译器：接口要求的字段是必需的，但实现该接口的程序可以在此基础上添加更多字段。

```
interface Foo {
    record Bar {
        owner: address,  // 所有 record 必须有 owner 字段
        baz: u64,        // Bar 还必须包含 baz 字段，类型为 u64
        ..               // 实现者可以添加更多字段
    }
}
```

例如，实现 `Foo` 的程序可以声明 `record Bar { owner: address, baz: u64, extra_field: bool, ... }`，只要满足了 `owner` 和 `baz` 的基本要求即可。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当 Record 的具体结构在**编译时不可知**时使用 `dyn record`。常见场景：

1. **配合动态调用（Dynamic Call）**：当通过接口调用一个运行时才确定的程序时，传入或返回的 Record 类型是不确定的。即使接口中声明了具体的静态 Record 类型，动态调用的实际输入和返回也都是 `dyn record`。

2. **通用性场景**：编写能够接受、检查和转发来自任意程序的 Record 的通用逻辑，而不需要预先知道 Record 的字段结构。

```
fn get_memo(rec: dyn record) -> u64 {
    return rec.memo; // 运行时检查 rec 是否有 memo 字段
}
```

注意：`dyn record` 保留所有常规 Record 的所有权和隐私属性。访问不存在的字段会在**运行时失败**，而非编译时。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: Storage vector 支持以下核心操作（所有操作只能在 `final { }` 块或 `final fn` 中使用）：

| 操作 | 语法 | 返回值 | 说明 |
|------|------|--------|------|
| 查询长度 | `vec.len()` | `u32` | 总是成功返回当前元素数量 |
| 按索引获取 | `vec.get(idx)` | `Option<T>` | 越界返回 `none` |
| 设置元素 | `vec.set(idx, value)` | - | 设置指定索引位置的值 |
| 追加元素 | `vec.push(value)` | - | 在末尾添加一个元素 |
| 弹出末尾 | `vec.pop()` | `T`（隐式） | 移除并返回最后元素，将长度减 1 |
| 交换移除 | `vec.swap_remove(idx)` | `T`（隐式） | 移除 idx 处元素，用最后元素替换该位置，将长度减 1 |
| 清空 | `vec.clear()` | - | 将长度设为 0（实际数据未物理删除） |

声明语法：
```
storage vec: [u64];  // 声明一个 u64 类型的 storage vector
```

注意：`pop()` 和 `swap_remove()` 并不真正删除值，只是将长度减 1，使最后元素不再可访问。外部程序对 storage vector 的访问是**只读**的（可通过 `.get()` 和 `.len()` 查询，但不可修改）。
