program private_calc.aleo {
    // 输入默认是 private，这里实现一个最小可演示的私密加法。
    fn private_add(a: u32, b: u32) -> u32 {
        let result: u32 = a + b;
        return result;
    }
}
