// The 'task3_age_verifier' program.
// 这是一个基于零知识证明的隐私年龄验证器。
// 核心理念：向外界证明"我满足年龄要求"，但绝不暴露我的真实年龄。
//
// transition 参数说明：
//   - age       : 用户的真实年龄（private），仅在本地参与证明生成，不上链不传播
//   - age_limit : 系统设定的公开年龄门槛（public），对所有人可见
//
// 返回值：
//   - bool : true = 年龄达标，false = 年龄不达标
//
// ZK 特性：即使返回 true，观察者也无法从交易数据反推出用户的真实年龄。
program task3_age_verifier.aleo {

    @noupgrade
    constructor() {}

    fn verify_age(private age: u8, public age_limit: u8) -> bool {
        return age >= age_limit;
    }
}
