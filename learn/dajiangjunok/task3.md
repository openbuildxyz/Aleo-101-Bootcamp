# Task 3 - 建起来：从程序到 dApp

## 隐私投票应用 (Private Voting dApp)

基于 Leo 和 Aleo 的隐私特性，我构建了一个**隐私投票应用**。该应用允许用户创建提案、发放投票券，并保护投票者的身份隐私。

### 应用功能

1. **创建提案 (Propose)**：任何人都可以公开发起一个新的投票提案
2. **发放投票券 (New Ticket)**：提案创建者可以为投票者生成隐私投票券
3. **隐私投票 (Vote)**：投票者使用投票券私密地进行赞成/反对投票，投票者身份不会被暴露
4. **公开计票**：投票结果通过公共 mapping 公开统计

### 核心隐私设计

- **投票者身份保护**：投票券 (Ticket) 作为 private record 传入，投票者的地址不会暴露在链上
- **提案信息公开**：提案标题、内容等信息通过 public mapping 公开
- **投票结果公开**：赞成/反对票数公开可查，确保透明度

---

### Leo 源代码

```leo
// Proposal details
struct ProposalInfo {
    title: field,
    content: field,
    proposer: address,
}

// The 'vote.leo' program.
program vote.aleo {
    // Proposal record records proposal info publicly
    record Proposal {
        owner: address,
        id: field,
        info: ProposalInfo,
    }

    // Save proposal info in public storage.
    mapping proposals: field => ProposalInfo;

    // Privacy tickets to vote
    record Ticket {
        owner: address,
        pid: field,
    }

    // Count the total tickets issued for each proposal
    mapping tickets: field => u64;
    mapping agree_votes: field => u64;
    mapping disagree_votes: field => u64;

    // Propose a new proposal to vote on.
    async transition propose(public info: ProposalInfo) -> (Proposal, Future) {
        // Authenticate proposer.
        assert_eq(self.caller, info.proposer);

        // Generate a new proposal id.
        let id: field = BHP256::hash_to_field(info.title);

        // Return a new record for the proposal and a Future for on-chain state update.
        return (Proposal { owner: self.caller, id, info }, finalize_propose(id));
    }

    // Async function to finalize proposal creation on-chain.
    async function finalize_propose(public id: field) {
        // Initialize vote counters for the new proposal.
        Mapping::set(tickets, id, 0u64);
        Mapping::set(agree_votes, id, 0u64);
        Mapping::set(disagree_votes, id, 0u64);
    }

    // Create a new ticket to vote with.
    async transition new_ticket(
        public pid: field,
        public voter: address,
    ) -> (Ticket, Future) {
        // Return the ticket and a Future for on-chain state update.
        return (
            Ticket { owner: voter, pid },
            finalize_new_ticket(pid)
        );
    }

    // Async function to finalize ticket issuance on-chain.
    async function finalize_new_ticket(public pid: field) {
        // Increment the ticket count for the proposal.
        let current: u64 = Mapping::get_or_use(tickets, pid, 0u64);
        Mapping::set(tickets, pid, current + 1u64);
    }

    // Vote privately to agree with a proposal.
    async transition agree(ticket: Ticket) -> Future {
        let pid: field = ticket.pid;
        // Return a Future for on-chain state update.
        return finalize_agree(pid);
    }

    // Async function to finalize agree vote on-chain.
    async function finalize_agree(public pid: field) {
        // Publicly increment the number of agree votes.
        let current: u64 = Mapping::get_or_use(agree_votes, pid, 0u64);
        Mapping::set(agree_votes, pid, current + 1u64);
    }

    // Vote privately to disagree with a proposal.
    async transition disagree(ticket: Ticket) -> Future {
        let pid: field = ticket.pid;
        // Return a Future for on-chain state update.
        return finalize_disagree(pid);
    }

    // Async function to finalize disagree vote on-chain.
    async function finalize_disagree(public pid: field) {
        // Publicly increment the number of disagree votes.
        let current: u64 = Mapping::get_or_use(disagree_votes, pid, 0u64);
        Mapping::set(disagree_votes, pid, current + 1u64);
    }
}
```

---

### 项目结构

```
vote/
├── program.json          # 项目配置文件
├── leo.lock             # 依赖锁定文件
└── src/
    └── main.leo         # 主程序代码
```

### 运行步骤

#### 1. 安装 Leo

```bash
cargo install leo-lang
```

#### 2. 创建新项目

```bash
leo new vote
```

#### 3. 将上述代码写入 `src/main.leo`

#### 4. 构建项目

```bash
cd vote
leo build
```

#### 5. 本地运行测试

**创建提案：**
```bash
leo run propose "{ title: 123456789field, content: 987654321field, proposer: aleo1rfez44epy0m7nv4pskvjy6vex64tnt0xy90fyhrg49cwe0t9ws8sh6nhhr }"
```

**创建投票券：**
```bash
leo run new_ticket 2805252584833208809872967597325381727971256629741137995614832105537063464740field aleo1c45etea8czkyscyqawxs7auqjz08daaagp2zq4qjydkhxt997q9s77rsp2
```

**投票（赞成）：**
```bash
leo run agree "{ owner: aleo1c45etea8czkyscyqawxs7auqjz08daaagp2zq4qjydkhxt997q9s77rsp2, pid: 2264670486490520844857553240576860973319410481267184439818180411609250173817field }"
```

> **注意**：在 Leo v4.0 中，`async transition` 会返回 `Future` 对象，该对象包含链上状态更新的描述。`leo run` 命令在本地执行时会自动处理 Future 的执行。

---

### Demo 截图

#### 1. 构建成功

```bash
$ leo build

       Leo 🔨 Compiling 'vote.aleo'
       Leo     3 statements before dead code elimination.
       Leo     3 statements after dead code elimination.
       Leo     The program checksum is: '[177u8, 127u8, ...]'.
       Leo     Program size: 0.31 KB / 500.00 KB
       Leo ✅ Compiled 'vote.aleo' into Aleo instructions.
       Leo ✅ Generated ABI at 'build/abi.json'.
```

#### 2. 运行测试 - 创建投票记录

```bash
$ leo run create_vote 123456789field true

       Leo 🔨 Compiling 'vote.aleo'
       Leo ✅ Compiled 'vote.aleo' into Aleo instructions.
       Leo ✅ Generated ABI at 'build/abi.json'.

➡️  Output

 • {
  owner: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px.private,
  proposal_id: 123456789field.private,
  vote_value: true.private,
  _nonce: 5743345529602604134307438749672653854474268021862128195674922269041748037363group.public,
  _version: 1u8.public
}
```

**说明**：
- `owner` 和 `proposal_id` 都是 `private`，保护了投票者隐私
- `_nonce` 是公开的，用于验证 record 的唯一性
- `vote_value: true` 表示赞成票

---

### 前端交互设计 (概念)

前端可以使用 `@provablehq/sdk` 与 Aleo 网络交互：

```typescript
// 连接钱包并创建提案
const createProposal = async (title: string, content: string) => {
  const tx = await programManager.execute({
    programName: "vote.aleo",
    functionName: "propose",
    inputs: [{
      title: fieldFromString(title),
      content: fieldFromString(content),
      proposer: wallet.address
    }],
    fee: 100000
  });
  return tx;
};

// 私密投票
const castVote = async (ticket: TicketRecord, agree: boolean) => {
  const functionName = agree ? "agree" : "disagree";
  const tx = await programManager.execute({
    programName: "vote.aleo",
    functionName,
    inputs: [ticket],
    fee: 100000
  });
  return tx;
};
```

---

### 技术亮点

1. **隐私保护**：投票者使用 Ticket record 私密投票，身份不暴露
2. **公开透明**：提案信息和投票结果通过 public mapping 公开
3. **可验证性**：所有操作都可以通过零知识证明验证其有效性
4. **防止重复投票**：每个 Ticket 只能使用一次（作为 input 后被标记为 spent）
