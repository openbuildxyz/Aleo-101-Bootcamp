// Private Commit Card 隐私承诺卡。
// 这个程序演示：私密内容不直接上链，只把前端生成的承诺值写进私有 record。
program private_commit_card.aleo {
    record Card {
        // owner 表示这个 record 归哪个 Aleo 地址控制。
        owner: address,
        // label_hash 是公开标签的哈希形式，避免直接把完整标签写入 record。
        label_hash: field,
        // note_commitment 是私密内容生成的承诺值，不包含原始私密文本。
        note_commitment: field,
        // created_at 用来演示业务字段，前端传入 Unix 时间戳。
        created_at: u64,
    }

    transition create_card(
        owner: address,
        label_hash: field,
        note_commitment: field,
        created_at: u64,
    ) -> Card {
        // transition 返回的新 Card 是私有 record，后续只有 owner 能消费。
        return Card {
            owner,
            label_hash,
            note_commitment,
            created_at,
        };
    }

    transition reveal_commitment(card: Card) -> field {
        // 这里不会揭示原始私密内容，只返回承诺值用于外部核对。
        return card.note_commitment;
    }
}
