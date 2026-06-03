// Private Shield Vote - 基于 Aleo 的隐私投票应用
// Leo 4.1.0 语法，已通过本地编译验证（leo build ✅）
program private_vote.aleo {

    @noupgrade
    constructor() {}

    // 投票凭证 Record：只有 owner 才能解密查看投票内容
    // 链上所有人只能看到加密后的数据，实现完全隐私
    record Ticket {
        owner: address,
        candidate: u32,
    }

    // 公开的投票计数 Mapping（链上透明可查）
    mapping votes: u32 => u64;

    // 1. 隐私投票：生成加密的投票凭证
    // candidate: 1 = 候选人A，2 = 候选人B
    // 返回值是加密 Record，链上无法看到投票内容
    fn cast_vote(candidate: u32) -> Ticket {
        assert(candidate == 1u32 || candidate == 2u32);
        return Ticket {
            owner: self.signer,
            candidate: candidate,
        };
    }

    // 2. 公开计票：消费 Ticket Record，更新链上统计
    // Ticket 一旦消费即销毁，防止重复计票
    fn tally_vote(ticket: Ticket) -> (bool, Final) {
        assert(ticket.candidate == 1u32 || ticket.candidate == 2u32);
        // 提取字段（Final 块中不能直接引用 record 类型）
        let candidate: u32 = ticket.candidate;
        return (true, final {
            let current: u64 = votes.get_or_use(candidate, 0u64);
            votes.set(candidate, current + 1u64);
        });
    }
}
