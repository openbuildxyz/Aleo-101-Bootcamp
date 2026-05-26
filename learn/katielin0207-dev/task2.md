# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: Leo 里函数的输入、输出和 record 字段默认都是私有的，不会暴露到链上。链上只能看到零知识证明，看不到具体数据。需要公开的话要手动加 `public`。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: Tuple 用 `.0`、`.1` 这样取元素，数组用 `[i]`，struct 用 `.字段名`。比如有个 tuple 里装了一个 Point 数组，要取第一个 Point 的 x 值，就写 `data.0[0].x`，按层级一路点进去。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: owner 是这个 record 的所有者地址。record 的内容会用 owner 的公钥加密，只有持有对应私钥的人才能解密和使用它，用来控制谁能消费这个 record。

---

**Q4. 程序中的 final 是什么？**

A: finalize 是在链上执行的代码块，等 ZK proof 验证通过之后才运行。它能读写链上的 mapping，但不能访问私有数据，主要用来更新需要公开记录的状态。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 用 `function` 关键字定义，只能在程序内部调用，不能作为外部入口。

---

**Q6. helper functions 能否创建 records？**

A: 不行。record 只能在 transition 里创建，helper function 是纯计算逻辑，不具备生成 record 所需的密码学能力。

---

**Q7. constructor 的目的是什么？**

A: 构造函数在程序部署时执行一次，用于设置初始状态或管理员地址，之后不再执行。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 用 `+` 将多个 interface 连接，程序需要实现每个 interface 中定义的所有方法。

---

**Q9. record interface 中 `..` 的含义是什么？**

A: 表示实现这个 interface 的 record 可以有额外的字段，不用和 interface 定义的完全一致。没有 `..` 的话字段必须完全匹配。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当函数在编译期无法确定传入 record 的具体类型时使用，只要满足某个 interface 的 record 都能被接受，实现运行时的类型灵活性。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: Storage vector 是链上的可变长数组，存在 mapping 里。普通数组长度固定，storage vector 可以动态增减元素。核心操作：`push` 添加元素，`pop` 移除末尾元素，`get`/`set` 读写指定位置，`len` 查询长度，`swap_remove` 快速删除（将目标元素与末尾元素交换后删除，速度快但不保持顺序）。
