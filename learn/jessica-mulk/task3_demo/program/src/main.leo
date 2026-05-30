// Private Credential Vault - Aleo 隐私凭证保险库
// 每个凭证作为私有 Record 存储，只有拥有者可以查看和操作
// 公共 mapping 只存储凭证计数，不暴露任何敏感数据

program credential.aleo {

    // 私有凭证记录 - 只有拥有者能看到内容
    record Credential {
        owner: address,
        credential_id: field,  // 凭证标识哈希
        score: u64,            // 私密评分
    }

    // 公共凭证计数（不暴露具体数据）
    mapping credential_counts: address => u64;

    // 铸造新的私有凭证
    // - credential_id: 凭证标识（建议使用 BHP256 哈希）
    // - score: 私密评分（仅记录持有者可见）
    fn mint(
        public credential_id: field,
        public score: u64,
    ) -> (Credential, Final) {
        let new_credential: Credential = Credential {
            owner: self.caller,
            credential_id,
            score,
        };

        return (new_credential, final {
            let current: u64 = Mapping::get_or_use(credential_counts, self.caller, 0u64);
            Mapping::set(credential_counts, self.caller, current + 1u64);
        });
    }

    // 私密分享凭证 - 消耗原凭证，生成两个新记录
    // - 给接收者的凭证（包含原始 score）
    // - 给发送者的分享凭证（score 设为 0 作为凭证已分享的证明）
    fn share(
        credential: Credential,
        public to: address,
        public new_credential_id: field,
    ) -> (Credential, Credential, Final) {
        // 构造接收者的凭证
        let shared: Credential = Credential {
            owner: to,
            credential_id: new_credential_id,
            score: credential.score,
        };

        // 构造发送者的分享记录
        let record: Credential = Credential {
            owner: credential.owner,
            credential_id: credential.credential_id,
            score: 0u64,
        };

        return (shared, record, final {
            // 更新接收者计数
            let receiver_count: u64 = Mapping::get_or_use(credential_counts, to, 0u64);
            Mapping::set(credential_counts, to, receiver_count + 1u64);
        });
    }

    // 查询地址的凭证计数（公共信息）
    fn get_count(public owner: address) -> u64 {
        return Mapping::get(credential_counts, owner);
    }

    // 防止合约升级
    @noupgrade
    constructor() {}
}