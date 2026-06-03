// Private Voting Application - 隐私投票应用
// Leo 4.1.0 语法，已通过本地编译验证（leo build ✅）
// 部署到 Aleo Testnet
program private_voting.aleo {

    @noupgrade
    constructor() {}

    // 投票凭证 Record：只有 owner 才能解密查看投票内容
    record Ticket {
        owner: address,
        candidate: u32,
    }

    // 链上公开的投票计数 Mapping
    mapping vote_count: u32 => u64;

    // 发起投票：生成隐私投票凭证（链下执行，ZK 证明保护）
    // candidate: 1 = 候选人A, 2 = 候选人B
    fn cast_vote(candidate: u32) -> Ticket {
        assert(candidate == 1u32 || candidate == 2u32);
        return Ticket {
            owner: self.signer,
            candidate: candidate,
        };
    }

    // 计票：消费 Ticket Record 并更新链上统计
    // Ticket 被消费后即销毁，天然防止重复计票
    fn tally_vote(ticket: Ticket) -> (bool, Final) {
        assert(ticket.candidate == 1u32 || ticket.candidate == 2u32);
        // 提取字段（Final 块中不能直接引用 record 类型）
        let candidate: u32 = ticket.candidate;
        return (true, final {
            let current_votes: u64 = vote_count.get_or_use(candidate, 0u64);
            vote_count.set(candidate, current_votes + 1u64);
        });
    }
}
