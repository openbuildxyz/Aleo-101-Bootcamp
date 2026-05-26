# Task 2 - Leo 入门：学会这门语言 
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A:在 Leo 中，如果函数参数或返回值没有显式标注可见性，编译器会默认将其视为 private。开发者无需显式声明 private，数据默认不会在链上公开暴露。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:以隐私拍卖结算系统为例
```leo
program auction.aleo {
    // 拍卖结果结构体：包含获胜者信息和物品详情
    struct AuctionResult {
        winner: address,
        winning_bid: u64,
        item_id: u32
    }

    // 隐私出价记录（加密存储在链上）
    record Bid {
        owner: address,
        bidder: address,
        amount: u64,
        item_id: u32
    }

    // ============================================
    // 返回 Tuple = (出价金额数组, 拍卖结果struct)
    // ============================================
    transition settle_auction(
        bids: [Bid; 3]          // 3个隐私出价记录作为输入
    ) -> ([u64; 3], AuctionResult) {   // Tuple: (数组, Struct)
        
        // ---- 提取所有出价金额到数组（用于公开验证）----
        let amounts: [u64; 3] = [
            bids[0].amount, 
            bids[1].amount, 
            bids[2].amount
        ];

        // ---- 确定获胜者（简化逻辑：假设 bids[1] 出价最高）----
        let result: AuctionResult = AuctionResult {
            winner: bids[1].bidder,
            winning_bid: bids[1].amount,
            item_id: bids[1].item_id
        };

        // 返回 Tuple：左边是明细数组，右边是汇总struct
        return (amounts, result);
    }
}
```

**访问方式：**
```leo
// 假设接收 settle_auction 的返回值
let receipt: ([u64; 3], AuctionResult) = settle_auction(bids);

// 访问数组：获取第2个出价者的金额
let second_bid: u64 = receipt.0[1];       // → bids[1].amount

// 访问struct：获取获胜者地址
let winner_addr: address = receipt.1.winner;  // → AuctionResult.winner

// 链式访问：从 Tuple → Struct → Field
let price: u64 = receipt.1.winning_bid;      // → 最终成交价
```
---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A:owner是record 的强制首字段，用于标识该记录的拥有者地址。确保了：只有拥有者才能查询并解密该 record 的隐私数据；只有拥有者才能将该 record 作为输入进行消费（如转账、销毁），防止伪造，拒绝同一record的重复提交。

---

**Q4. 程序中的 final 是什么？**

A:在链上公开执行的代码逻辑，用于更新 mapping、storage 等链上存储公共共享状态的数据。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:旧版 Leo 文档中辅助函数需要在 program 外部声明，现行版本通常在 program 内通过 function / inline 定义。

---

**Q6. helper functions 能否创建 records？**

A:不能。record 的创建和消费均发生在entry function（program 内的函数）中，且 entry function 会生成零知识证明。Helper functions 仅作为辅助纯计算逻辑被调用，不能创建records，没有链上状态和生成证明的操作权限。

---

**Q7. constructor 的目的是什么？**

A:它是 Aleo 程序必须包含的内置注解，用于定义程序的初始化属性与升级规则。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 在program声明后使用冒号 + 逗号分隔多个接口名称。例如：

```leo
program my_program: interface1, interface2 {
    // 必须同时满足所有接口的约束
}
```

---

**Q9. record interface 中 `..` 的含义是什么？**

A:表示该record必须支持接口中声明的字段类型，但允许开发者实现时扩展更多自定义字段。

---

**Q10. 何时使用 dyn record（动态 record）？**

A:在跨合约动态调用时使用，当 record 属于外部合约、编译时无法确定其具体 program ID 时，需要声明为动态 record。

---

**Q11. storage vector 支持的核心操作有哪些？**

A:storage vector（动态数组）支持以下操作：

| 操作 | 作用 |
|---|---|
| **`push`** | 在 vector 尾端加入一个新元素 |
| **`pop`** | 弹出并移除最后一个元素 |
| **`get`** | 读取指定位置元素的值 |
| **`set`** | 将指定位置的素设置为新值 |
| **`len` / `length`** | 获取 vector 的总长度，即元素数量|
| **`swap_remove`** | 移除指定位置的元素，并将最后一个元素移至该位置|
