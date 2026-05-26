# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 在Leo中，所有函数的输入、输出以及局部变量，默认都是隐私（private）的。除非你显式地使用 public 关键字进行修饰，否则 Aleo 编译器和运行时都会将其视为加密状态。程序在用户的本地（链下）执行。由于默认隐私，输入的数据不会泄露给网络，链上节点最终接收到的只是一个零知识证明（ZKP）和状态转换结果。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:
```
// 1. 定义一个简单的结构体
struct Point {
    x: u32,
    y: u32,
}

program test_tuple.aleo {
    transition main() {
        // 2. 创建结构体实例
        let p1 = Point { x: 1u32, y: 2u32 };
        let p2 = Point { x: 3u32, y: 4u32 };

        // 3. 创建一个包含结构体数组的元组
        // 元组格式为：([Point; 2], u64)
        let my_tuple: ([Point; 2], u64) = ([p1, p2], 42u64);

        // 4. 访问元组中数组的结构体元素
        // 访问元组第一个元素（数组），再访问数组索引 1 的结构体，最后访问其属性 x
        let x_val: u32 = my_tuple.0[1u32].x; // 结果为 3u32
    }
}
```
---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: 指定了该 Record 的所有者。只有该地址对应的私钥持有者才能在 transition 中消费（consume）这个 Record。

---

**Q4. 程序中的 final 是什么？**

A:
1、在program 内部的入口函数后面写 -> Final（或者作为元组的一部分，如 -> (Record, Final)）时，你在告诉编译器：“这个交易没有结束，它还附带了一个必须在链上广播并执行的任务”。

2、final { ... } 执行块是入口函数的最后一步，用来包含所有涉及修改或读取 mapping 的代码

3、final fn 最终化辅助函数

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:
```

// 辅助函数（Helper Function）
fn calculate_interest(principal: u64, rate: u64) -> u64 {
    let interest = (principal * rate) / 100u64;
    return interest;
}

// ==========================================
// 2. 主程序块
// ==========================================
program bank_v2.aleo {

    // 入口函数（Entry Function，相当于以前的 transition）
    // 规则：使用 `fn`，写在 program 块的【里面】
    fn deposit_and_calculate(amount: u64) -> u64 {
        let rate = 5u64;
        
        // 直接调用外部定义的辅助函数
        let total_interest = calculate_interest(amount, rate);
        
        return amount + total_interest;
    }
}
```
---

**Q6. helper functions 能否创建 records？**

A: 不能 Helper functions（普通 fn）不允许创建或返回 Record。只有 transition 函数才能创建/消费 Record。
这是为了保证 Record 的创建必须经过 ZK 证明流程。
---

**Q7. constructor 的目的是什么？**

A: 制定合约升级相关的规则。逻辑不可变

---

**Q8. 如何组合多个 interfaces（接口）？**

A:  通过+运算符进行多接口组合继承

---

**Q9. record interface 中 `..` 的含义是什么？**

A: 
1、隐式传递所有该接口未显式声明的隐藏字段。
2、除了我已经显式写出的字段外，其余所有字段直接复制自后面的那个 record 实例

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当编写的函数或合约，需要兼容并处理未来由其他程序定义的、未知具体字段结构的隐私资产（Record）时，就必须使用 dyn record

---

**Q11. storage vector 支持的核心操作有哪些？**

A:
set(key, value)：在链上全局存储中插入或更新一个键值对。

get(key)：从链上存储中读取指定键的值。

get_or_use(key, default_value)：读取指定键的值，如果不存在则返回默认值。

remove(key)：从链上存储中删除指定的键值对。
