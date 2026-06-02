// Private Shield Vote - 基于 Aleo 的隐私投票应用
program private_vote.aleo {
    // 投票凭证 Record：包含投票人身份和候选人选择
    // 只有 owner 才能解密查看投票内容
    record Ticket {
        owner: address,
        candidate: u32,
    }

    // 公开的投票计数 Mapping
    // 链上所有人可见的汇总结果
    mapping votes: u32 => u64;

    // 1. 隐私投票：生成加密的投票凭证
    // 候选人编号 1 或 2
    // 返回值是一个隐私 Record，链上看不到投票内容
    transition vote_private(candidate: u32) -> Ticket {
        // 确保候选人编号有效
        assert(candidate == 1u32 || candidate == 2u32);
        return Ticket {
            owner: self.caller,
            candidate: candidate,
        };
    }

    // 2. 公开计票：消费 Ticket Record，更新链上统计
    // 通过 finalize 在链上原子性更新票数
    transition tally_vote(ticket: Ticket) {
        assert(ticket.candidate == 1u32 || ticket.candidate == 2u32);
        return then finalize(ticket.candidate);
    }

    finalize tally_vote(candidate: u32) {
        let current_votes: u64 = Mapping::get_or_use(votes, candidate, 0u64);
        Mapping::set(votes, candidate, current_votes + 1u64);
    }
}
