# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。


## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A:leo中的所以程序状态默认是私有的，除非使用public标记为公开状态。私有状态链上不可见。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:示例如下：
```leo
struct Point {
        x:u32,
        y:u32
    }
    fn main() ->u32{
      let numbers:[u32;3] = [3u32,4u32,5u32];
      let data :(u32,Point,[u32;3]) = (1u32,Point{x:1u32,y:3u32},numbers);
      let first = data.0;
      let point = data.1;
      let point_x= point.x;
      let point_y=point.y;
      let arr = data.2;
      let arr1 = arr[0];
      return first + point_x + arr1;
    }
```
---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A:owner 字段指定谁拥有该record：

1. **所有权控制**：只有owner对应的私钥持有者才能消费该字段指定谁拥有该record；
2. **隐私保护**：owner默认是私有的，链上不可见；
3. **访问控制**：转移时必须证明拥有者的签名。
---

**Q4. 程序中的 final 是什么？**

A:在 Leo 中，`final` 用于标记**程序状态的最终变更**，表示该操作会**消耗（consume）旧 record 并创建新 record**。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:在 program 块外面用 fn 关键字声明。
```leo
// The 'hello' program.
fn add()->u32{
        let a:u32 = 4u32;
        let b:u32 = 4u32;
        return a+b;
    }
program hello.aleo {
    @noupgrade
    constructor() {}
    struct Point {
        x:u32,
        y:u32
    }
    fn main() ->u32{
      let numbers:[u32;3] = [3u32,4u32,5u32];
      let data :(u32,Point,[u32;3]) = (1u32,Point{x:1u32,y:3u32},numbers);
      let first = data.0;
      let point = data.1;
      let point_x= point.x;
      let point_y=point.y;
      let arr = data.2;
      let arr1 = arr[0];
      return first + point_x + arr1;
    }
}
```

---

**Q6. helper functions 能否创建 records？**

A:不能,helper functions只能做纯计算，不能创建（也不能消耗）record。

---

**Q7. constructor 的目的是什么？**

A:它是用来定义这个程序的可升级逻辑:能不能升级、谁能升级、什么条件下能升级。

---

**Q8. 如何组合多个 interfaces（接口）？**

A:如下示例：
```leo
// The 'hello' program.
interface Transfer {
    record Token;
    fn transfer(input: Token, to: address, amount: u64) -> Token;
}

interface Pausable {
    mapping paused: address => bool;
    fn pause() -> (bool, Final);
}
program hello.aleo : Transfer + Pausable{
    @noupgrade
    constructor() {}
    struct Point {
        x:u32,
        y:u32
    }
    fn main() ->u32{
      let numbers:[u32;3] = [3u32,4u32,5u32];
      let data :(u32,Point,[u32;3]) = (1u32,Point{x:1u32,y:3u32},numbers);
      let first = data.0;
      let point = data.1;
      let point_x= point.x;
      let point_y=point.y;
      let arr = data.2;
      let arr1 = arr[0];
      return first + point_x + arr1;
    }
}
```

---

**Q9. record interface 中 `..` 的含义是什么？**

A:.. 表示这个 interface 只要求实现方"至少包含"这些字段，允许再添加更多字段——本质是"开放式约束 / 最小要求"。

---

**Q10. 何时使用 dyn record（动态 record）？**

A:用于在编译时无法确定具体 record 类型的场景

---

**Q11. storage vector 支持的核心操作有哪些？**

A:存储向量的行为类似于给定类型的值动态数组
1. get：查询元素;
2. *set**:修改元素;
3. **push**:将元素添加到末尾;
4. **swap_remove**:要删除元素.
