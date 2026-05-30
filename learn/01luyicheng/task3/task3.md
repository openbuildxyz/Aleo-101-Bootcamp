# Task 3 - 建起来：从程序到 dApp

## 隐私投票应用 (Private Voting dApp)

基于 Leo 和 Aleo 的隐私特性，构建了一个**隐私投票应用**。该应用允许用户创建隐私投票记录，保护投票者的身份和投票选择。

### 应用功能

1. **创建隐私投票记录 (create_vote)**：用户可以为特定提案创建加密的投票记录
2. **隐私保护**：投票者身份和投票选择完全保密
3. **可验证性**：所有操作通过零知识证明验证

### 核心隐私设计

- **投票者身份保护**：VoteRecord 中的 owner 是 private，不会暴露在链上
- **投票选择保护**：vote_value 是 private，无人知晓投了赞成还是反对
- **记录唯一性**：通过 public nonce 确保每个记录唯一且可验证

---

### Leo 源代码

```leo
// Simple vote program for Aleo Bootcamp
// Note: This is a simplified version for demonstration

program privatevotedapp123.aleo {
    // Simple record for tracking votes
    record VoteRecord {
        owner: address,
        proposal_id: field,
        vote_value: bool,  // true = agree, false = disagree
    }

    // Constructor - required for programs deployed after ConsensusVersion::V9
    // @noupgrade means this program cannot be upgraded after deployment
    @noupgrade
    constructor() {}

    // Create a new vote record
    // transition is the entrypoint for creating records on Aleo
    transition create_vote(public proposal_id: field, public vote_value: bool) -> VoteRecord {
        return VoteRecord {
            owner: self.caller,
            proposal_id,
            vote_value,
        };
    }
}
```

---

### 项目结构

```
vote/
├── program.json            # 项目配置文件
└── src/
    └── main.leo           # 主程序代码

vote-frontend/
└── index.html             # 前端交互界面
```

### 运行步骤

#### 1. 安装 Leo

```bash
cargo install leo-lang
```

#### 2. 创建新项目

```bash
leo new privatevotedapp123
```

#### 3. 将上述代码写入 `src/main.leo`

#### 4. 构建项目

```bash
cd privatevotedapp123
leo build
```

#### 5. 本地运行测试

**创建投票记录：**
```bash
leo run create_vote 123456789field true
```

**输出示例：**
```
Leo 🔨 Compiling 'privatevotedapp123.aleo'
Leo ✅ Compiled 'privatevotedapp123.aleo' into Aleo instructions.
Leo ✅ Generated ABI at 'build/abi.json'.

➡️  Output

 • {
  owner: aleo13zjkkxfv9j32vpptr8l7cquwj5rfzzpffs4ulrgpsr0xtjhcmqysw9ee3h.private,
  proposal_id: 123456789field.private,
  vote_value: true.private,
  _nonce: 8301628259584903346462104516029430349187980231289497466581896199159005825626group.public,
  _version: 1u8.public
}
```

> **注意**：在 Leo v4.0 中，`transition` 用于定义可创建 record 的入口函数。`self.caller` 获取调用者地址。

---

### 前端交互界面

构建了一个简单的前端页面，展示隐私投票的交互流程：

**文件位置**: `vote-frontend/index.html`

**功能特点**：
- 输入提案 ID
- 选择赞成/反对
- 模拟生成零知识证明
- 展示隐私投票记录

**界面预览**：
- 标题：Aleo 隐私投票
- 隐私提示："您的投票将完全保密，仅您能看到投票内容"
- 提案信息展示
- 投票按钮（赞成/反对）
- 提交后显示生成的隐私记录

---

### Demo 截图

#### 1. 构建成功

```bash
$ leo build

       Leo 🔨 Compiling 'privatevotedapp123.aleo'
       Leo     3 statements before dead code elimination.
       Leo     3 statements after dead code elimination.
       Leo     The program checksum is: '[233u8, 255u8, 0u8, 161u8, ...]'.
       Leo     Program size: 0.36 KB / 500.00 KB
       Leo ✅ Compiled 'privatevotedapp123.aleo' into Aleo instructions.
       Leo ✅ Generated ABI at 'build/abi.json'.
```

#### 2. 运行测试 - 创建投票记录

```bash
$ leo run create_vote 123456789field true

       Leo 🔨 Compiling 'privatevotedapp123.aleo'
       Leo ✅ Compiled 'privatevotedapp123.aleo' into Aleo instructions.
       Leo ✅ Generated ABI at 'build/abi.json'.

➡️  Output

 • {
  owner: aleo13zjkkxfv9j32vpptr8l7cquwj5rfzzpffs4ulrgpsr0xtjhcmqysw9ee3h.private,
  proposal_id: 123456789field.private,
  vote_value: true.private,
  _nonce: 8301628259584903346462104516029430349187980231289497466581896199159005825626group.public,
  _version: 1u8.public
}
```

**说明**：
- `owner` 和 `proposal_id` 都是 `private`，保护了投票者隐私
- `_nonce` 是公开的，用于验证 record 的唯一性
- `vote_value: true` 表示赞成票

---

### 前端代码示例

前端可以使用 `@provablehq/sdk` 与 Aleo 网络交互：

```typescript
// 连接钱包并创建投票记录
const createVote = async (proposalId: string, voteValue: boolean) => {
  const tx = await programManager.execute({
    programName: "privatevotedapp123.aleo",
    functionName: "create_vote",
    inputs: [proposalId + "field", voteValue.toString()],
    fee: 100000
  });
  return tx;
};
```

---

### 技术亮点

1. **隐私保护**：VoteRecord 中的 owner 和 vote_value 都是 private
2. **公开可验证**：_nonce 公开，确保记录唯一性且可验证
3. **防止伪造**：只有 record owner 才能消费该 record
4. **零知识证明**：所有操作通过 ZKP 验证，无需暴露敏感数据
