program private_multiplier;

/*
 * Private Multiplier - 实现私密乘法运算
 * 输入：两个私密值 a 和 b
 * 输出：私密乘法结果 c = a * b
 */

// 主函数：执行私密乘法
function private_multiply:
    input a as private field,
    input b as private field
    output c as field
{
    // 执行私密乘法运算
    c = a * b;

    // 返回结果
    return c;
}

// 测试函数（可选）
function test_multiply:
    input test_a as private field,
    input test_b as private field
    output result as field
{
    result = test_a * test_b;
    return result;
}