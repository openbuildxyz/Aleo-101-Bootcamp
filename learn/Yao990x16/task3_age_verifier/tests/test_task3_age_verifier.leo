// 'task3_age_verifier' 的单元测试
import task3_age_verifier.aleo;

program test_task3_age_verifier.aleo {

    @noupgrade
    constructor() {}

    // 测试1：用户年龄 = 20，门槛 = 18 → 预期通过 (true)
    @test
    fn test_adult_passes() {
        let result: bool = task3_age_verifier.aleo::verify_age(20u8, 18u8);
        assert_eq(result, true);
    }

    // 测试2：用户年龄 = 18，门槛 = 18 → 恰好等于门槛，预期通过 (true)
    @test
    fn test_exactly_limit_passes() {
        let result: bool = task3_age_verifier.aleo::verify_age(18u8, 18u8);
        assert_eq(result, true);
    }

    // 测试3：用户年龄 = 16，门槛 = 18 → 未成年，预期不通过 (false)
    @test
    fn test_minor_fails() {
        let result: bool = task3_age_verifier.aleo::verify_age(16u8, 18u8);
        assert_eq(result, false);
    }

    // 测试4：用户年龄 = 0，门槛 = 18 → 边界值，预期不通过 (false)
    @test
    fn test_zero_age_fails() {
        let result: bool = task3_age_verifier.aleo::verify_age(0u8, 18u8);
        assert_eq(result, false);
    }
}
