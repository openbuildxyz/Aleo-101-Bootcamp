# Task 2 - Leo 入门：学会这门语言 

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。
 

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A:
默认私有，没有修饰符的字段被视为私有字段

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:
```
struct Bar {
    data: u8,
}
function hello(a: u32) {
    let a_tuple = (a, false, Bar{data: 2u8}, [Bar{data: 1u8}]);
    let b = a_tuple.3[0].data;
}
```
---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A:
权限控制	只有 owner 指定的地址才能spend这个 Record

加密依据	Record 中 private 可见性的字段，会用 owner 的 viewKey 加密

唯一性标识	nonce 通过 owner 的地址密钥 + 序列号计算得出，保证每个 Record 唯

---

**Q4. 程序中的 final 是什么？**

A:
在 transition 执行完后在链上执行final{}，用于更新链上状态（如 mapping storage），更新的是公开可见的数据

---

**Q5. 如何创建 helper functions（辅助函数）？**

A:
在program{}之外创建

```
program hello_leo.aleo {
    @noupgrade
    constructor() {}

    fn main(public a: u32, b: u32) -> u32 {
        let c: u32 = a + b;
        return c;
    }
}

fn compute(a: u64, b: u64) -> u64 {
    return a + b;
}

```


---

**Q6. helper functions 能否创建 records？**

A:
不能，只能纯计算

---

**Q7. constructor 的目的是什么？**

A:
每次部署和升级之前运行，初始化，控制部署/升级权限

---

**Q8. 如何组合多个 interfaces（接口）？**

A:
```
program hello_leo.aleo: C {
    @noupgrade
    constructor() {}

    fn main(public a: u32, b: u32) -> u32 {
        let c: u32 = a + b;
        return c;
    }
    fn a() -> u32{
        return 1u32;
    }
    fn b() -> bool{
        return true;
    }
}

interface A{
    fn a() -> u32;
}

interface B{
    fn b() -> bool;
}

interface C: A+B{}

```
---

**Q9. record interface 中 `..` 的含义是什么？**

A:
让实现去补充额外的字段
---

**Q10. 何时使用 dyn record（动态 record）？**

A:
编译期不知道具体字段，需要运行时确定具体的record

---

**Q11. storage vector 支持的核心操作有哪些？**

A:
```
storage vec: [u8];

// Querying
let len_vec: u32 = vec.len();
let val: u8? = vec.get(idx);

// Modifying
vec.set(idx, value);
vec.push(value);
vec.pop();
vec.swap_remove(idx);
vec.clear();

// External storage vectors (read-only)
let ext_len: u32 = external_program.aleo::vec.len();
let ext_val: u8? = external_program.aleo::vec.get(idx);
```