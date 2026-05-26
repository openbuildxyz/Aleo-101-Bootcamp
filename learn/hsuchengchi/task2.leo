Q1: Leo 中的“Private by Default”(默认隐私) 语义是什么
A:  申明一个变量、输入参数或结构体字段，如果没有显示使用 public 修饰符，那么这些数据结构会默认为 private.

//Q2: Tuple 包含 array structs 的实例，以及如何访问 struct中的元素
//A:
program tuple_nested_example.aleo{
    // 1.定义一个结构体
    struct Point {
        x: u32,
        y: u32,
    }

    // 2.定义一个包含数组和结构体的元组示例
    fn test_nested_access() -> u32 {
        let p1: Point = Point{x: 10u32, y: 20u32};
        let p2: Point = Point{x: 30u32, y: 40u32};

        let my_array: [Point; 2] = [p1, p2];

        let my_tuple: (u32, [Point; 2]) = (1u32, my_array);

        let target_value: u32 = my_tuple.1[1].y;

        return target_value;
    } 
}

Q3: Aleo record 中 owner 字段的作用是什么？
A:  指定当前 record 的所有权属于哪个用户。类型必须是 address
Q4: 程序中的final是什么
A: 一种延迟调用机制，代码将被上传至链上虚拟机并在那里执行
Q5: 如何创建 helper functions (辅助函数)？
A:  fn example(a: u32, b: u32) -> u32 { ... }
Q6: helper functions 能否创建records
A： 不能
Q7: constructs 的目的是什么
A:  constructs 是初始化程序的链上状态
Q8: 如何组合多个interfaces？
A： 在主程序中同时导入并调用
Q9：record interface 中..的含义是什么
A：在结构/读数据时，可以作为一个忽略符，表示在Record 结构体中剩余的所有其他
    字段，不需要显示提取。
Q10：何时使用 dyn record （动态 record）？
A:  有动态负载和不确定数据结构时、复杂的隐私DeFi协议、跨链桥状态锁存、可升级的的隐私协议
Q11: storage vector 支持的核心操作有哪些？
A:  push / pop / get / set 