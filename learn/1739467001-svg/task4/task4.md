# Task 4 - 用起来：真实场景落地

## 项目概述

**项目名称**: Private Voting Application (隐私投票应用)  
**程序 ID**: `private_voting.aleo`  
**部署网络**: Aleo Testnet  
**钱包地址**: `aleo13tau8gfa2ezjtrulffnqsu7vla80xfleazenzzq8azgtqr9sju9q648ntj`

---

## 应用描述

基于 Aleo 零知识证明技术的链上隐私投票应用。核心特性：

| 特性 | 说明 |
|------|------|
| **投票内容隐私** | 投票选择被加密在 Ticket Record 中，链上不可见 |
| **投票人隐私** | 无法从链上数据关联投票人与其选择 |
| **结果透明** | 投票总数通过 Mapping 公开存储，任何人可验证 |
| **防重复投票** | Record 消费机制确保每张票只能计一次 |

---

## Leo 合约代码（Leo 4.1.0）

```leo
program private_voting.aleo {

    @noupgrade
    constructor() {}

    record Ticket {
        owner: address,
        candidate: u32,
    }

    mapping vote_count: u32 => u64;

    fn cast_vote(candidate: u32) -> Ticket {
        assert(candidate == 1u32 || candidate == 2u32);
        return Ticket {
            owner: self.signer,
            candidate: candidate,
        };
    }

    fn tally_vote(ticket: Ticket) -> (bool, Final) {
        assert(ticket.candidate == 1u32 || ticket.candidate == 2u32);
        let candidate: u32 = ticket.candidate;
        return (true, final {
            let current_votes: u64 = vote_count.get_or_use(candidate, 0u64);
            vote_count.set(candidate, current_votes + 1u64);
        });
    }
}
```

---

## 本地编译验证

```bash
leo build
```

**输出：**
```
Leo 🔨 Compiling 'private_voting.aleo'
Leo     26 statements before dead code elimination.
Leo     26 statements after dead code elimination.
Leo     The program checksum is: '[178u8, 225u8, 45u8, 170u8, 3u8, ...]'.
Leo     Program size: 0.88 KB / 500.00 KB
Leo ✅ Compiled 'private_voting.aleo' into Aleo instructions.
Leo ✅ Generated ABI for program 'private_voting.aleo'.
```

```bash
leo run cast_vote 1u32
```

**输出（演示隐私特性）：**
```
➡️  Output

 • {
  owner: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px.private,
  candidate: 1u32.private,
  _nonce: 1498567934026198502068414214150971650202149654046035286397058312265927775751group.public,
  _version: 1u8.public
}
```

> `candidate: 1u32.private` — 投票选择在链上是加密的，第三方无法读取。

---

## 部署到测试网

### 步骤 1：获取测试网积分

前往 Aleo Discord 的 `#faucet` 频道，发送：
```
/faucet aleo13tau8gfa2ezjtrulffnqsu7vla80xfleazenzzq8azgtqr9sju9q648ntj
```

### 步骤 2：部署合约

```bash
# 需要 Leo CLI 4.1.0+
cd task4/contract
leo build

leo deploy \
  --network testnet \
  --private-key <YOUR_PRIVATE_KEY> \
  --endpoint https://api.explorer.provable.com/v1
```

### 步骤 3：执行链上交互

```bash
# 投票给候选人 1
leo execute cast_vote 1u32 \
  --network testnet \
  --private-key <YOUR_PRIVATE_KEY>

# 计票（消耗 Ticket Record）
leo execute tally_vote <TICKET_RECORD> \
  --network testnet \
  --private-key <YOUR_PRIVATE_KEY>
```

### 步骤 4：查询结果

```bash
# 查询候选人 1 的票数
curl https://api.explorer.provable.com/v1/testnet/program/private_voting.aleo/mapping/vote_count/1u32
```

---

## 部署信息

| 项目 | 值 |
|------|-----|
| 程序名称 | private_voting.aleo |
| 网络 | Aleo Testnet |
| 部署者地址 | aleo13tau8gfa2ezjtrulffnqsu7vla80xfleazenzzq8azgtqr9sju9q648ntj |
| Leo 编译器版本 | Leo 4.1.0 |
| 部署交易哈希 | *(部署后填写)* |

---

## 隐私验证

| 数据 | 链上可见性 | 原因 |
|------|-----------|------|
| vote_count Mapping（总票数） | ✅ 公开透明 | Mapping 数据公开存储 |
| Ticket Record 内容（投票选择） | ❌ 加密隐藏 | Record 用 owner 公钥加密 |
| 投票人与选择的关联 | ❌ 不可关联 | ZK 证明保护关联关系 |
| ZK 证明本身 | ✅ 可验证 | 证明正确性但不泄露数据 |

---

## 区块浏览器

- 合约页: https://testnet.explorer.provable.com/program/private_voting.aleo
- 部署者地址: https://testnet.explorer.provable.com/address/aleo13tau8gfa2ezjtrulffnqsu7vla80xfleazenzzq8azgtqr9sju9q648ntj
