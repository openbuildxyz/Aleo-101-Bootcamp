# Private Notes 隐私笔记应用

这是 Aleo 101 Bootcamp 的 task3 示例项目。

## 目录

```text
task3_demo/
├── program.json
├── src/main.leo
├── inputs/private_notes.in
├── frontend/
└── screenshots/
```

## 本地运行 Leo

```powershell
leo run create_note aleo1fymf85ullghvzd7av3ajhgfen0875kz9knq7tgna9hr2fswjqsfqxdtvze 2261864389096600field 8229649785376099field 1716652800u64
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
- `frontend/src/workers/worker.js` 里的哈希函数只用于 demo，生产环境应换成与 Leo 程序一致的 ZK 友好哈希。

## 功能说明

1. **生成账户**：创建新的 Aleo 账户用于隐私操作
2. **创建笔记**：创建私密笔记，内容被加密存储在链上
3. **笔记列表**：查看已创建的笔记（只显示交易ID，不显示内容）

## 隐私特性

- 笔记内容通过承诺值存储，原始内容不公开
- 使用 Aleo 的 record 机制确保数据隐私
- 只有笔记所有者能查看完整内容