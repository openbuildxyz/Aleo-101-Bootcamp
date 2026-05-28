# Private Commit Card 隐私承诺卡

这是 Aleo 101 Bootcamp 的 task3/task4 示例项目。

## 目录

```text
private_commit_card/
├── program.json
├── src/main.leo
├── inputs/private_commit_card.in
├── frontend/
└── screenshots/
```

## 本地运行 Leo

```powershell
leo run create_card aleo1fymf85ullghvzd7av3ajhgfen0875kz9knq7tgna9hr2fswjqsfqxdtvze 2261864389096600field 8229649785376099field 1716652800u64
```

## 本地运行前端

```powershell
cd frontend
npm install
npm run dev
```

## 安全说明

- 仓库里只保存公开地址和承诺值。
- 不提交私钥、助记词或 View Key。
- `frontend/src/commitment.ts` 里的哈希函数只用于 demo，生产环境应换成与 Leo 程序一致的 ZK 友好哈希。
