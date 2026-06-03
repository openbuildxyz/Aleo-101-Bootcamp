# 部署指南

## 前置准备

1. 安装 Leo CLI: https://docs.leo-lang.org/
2. 获取测试网 Aleo credits（通过水龙头）
3. 创建或导入 Aleo 钱包

## 部署步骤

```bash
# 1. 编译
cd contract
leo build

# 2. 部署
leo deploy --network testnet --private-key <YOUR_PRIVATE_KEY>

# 3. 初始化
leo execute init_voting --network testnet --private-key <YOUR_PRIVATE_KEY>

# 4. 投票
leo execute cast_vote 1u32 --network testnet --private-key <YOUR_PRIVATE_KEY>

# 5. 计票
leo execute tally_vote "<TICKET_RECORD>" --network testnet --private-key <YOUR_PRIVATE_KEY>

# 6. 查询结果（通过 API）
curl https://api.explorer.provable.com/v1/testnet/program/private_voting.aleo/mapping/vote_count/1u32
```
