program private_calc.aleo {
    transition private_add(a: u32, b: u32) -> u32 {
        let result: u32 = a + b;
        return result;
    }
}
