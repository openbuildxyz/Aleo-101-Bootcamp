// Private Notes 隐私笔记应用
// 这个程序演示：私密笔记内容不直接上链，只把前端生成的承诺值写进私有 record。
program private_notes.aleo {
    // 笔记记录，存储在链上但内容不公开
    record Note {
        // owner 表示这个 record 归哪个 Aleo 地址控制
        owner: address,
        // title_hash 是笔记标题的哈希形式，避免直接把完整标题写入 record
        title_hash: field,
        // content_commitment 是笔记内容生成的承诺值，不包含原始笔记内容
        content_commitment: field,
        // created_at 用来演示业务字段，前端传入 Unix 时间戳
        created_at: u64,
    }

    // 创建新笔记的 transition
    transition create_note(
        owner: address,
        title_hash: field,
        content_commitment: field,
        created_at: u64,
    ) -> Note {
        // transition 返回的新 Note 是私有 record，后续只有 owner 能消费
        return Note {
            owner,
            title_hash,
            content_commitment,
            created_at,
        };
    }

    // 查看笔记承诺值的 transition（不暴露原始内容）
    transition view_note_commitment(note: Note) -> field {
        // 这里不会揭示原始笔记内容，只返回承诺值用于外部核对
        return note.content_commitment;
    }
}