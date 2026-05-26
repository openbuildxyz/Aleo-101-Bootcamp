
<div align="center">
    <h1>Aleo 101 Bootcamp</h1>
</div>

## Introduction

从 0 写出你的第一个 ZK 应用，来这场训练营就够了

我们开发区块链应用时一直在面对一个现实问题：**所有数据都是公开的。** 转账记录是公开的，资产余额是公开的，合约交互也是公开的。这在早期是优点——因为它让系统变得"可信"。**但是用户隐私几乎完全暴露，** 我们开始意识到一件事：**区块链不应该只有"可信"，还需要"可隐藏但可验证"。**

零知识证明（Zero-Knowledge Proof）就是用来解决这个问题：**如何在不暴露数据本身的情况下，证明一件事是真的。** 过去，零知识证明(ZK)更多停留在理论研究和密码学系统中，开发门槛高、工程复杂，很难真正用于日常应用开发。但现在情况正在改变。随着基础设施逐渐成熟，ZK 正在从"密码学工具"走向"可用的开发能力"，开始真正进入可以构建应用的阶段。[了解更多](https://mp.weixin.qq.com/s/0s_4AqQlchntCd387hQcRQ)

![bootcamp](public/bootcamp.jpg)

---

### 免费报名

**📅 时间：** 2026年5月11日 - 6月11日


参加 Bootcamp 需要先在 [OpenBuild 报名](https://openbuild.xyz/learn/challenges/2097505722)，然后按照以下步骤完成基础信息提交：

1. `Fork` 本仓库，然后 `clone` 到你的本地。
2. 进入 [learn](./learn) 文件夹，创建以你的名字(github用户名)命名的文件夹 `YourName`。
3. 复制 [Template.md](./Template.md) 文件到刚才创建的文件夹，并将文件重命名为你的名字：`YourName.md`。
4. 打开 `learn/YourName/YourName.md` 文件，根据文档指引填写你的信息并保存。（**钱包地址用来发奖励，请认真填写**，参考 [Shield Wallet 指南](./Shield_Wallet_guide.md)）
5. 提交一个 PR 到本仓库，等待合并。| [如何提交PR？](https://juejin.cn/post/7021727244124962846)

---

### ⭐ 课程亮点 ⭐

1️⃣ 全程技术导师 + 助教支持，新手友好，手把手带你学 ZK，不怕学不会

2️⃣ 录播课程 + 在线答疑机制，随时开学，问题不过夜

3️⃣ 完成作业还有现金 + 寻宝大奖（$1000 奖金池），这把真的赚到了

4️⃣ 参与即直通 Aleo Hackathon，获得官方深度指导与生态机会

---

### 学习准备

完成报名后扫下方二维码加入学习交流群(必须）。课程从最基础的环境搭建开始，用最直接的方式带你理解并动手写出第一个 Aleo ZK 应用。**不要求你懂 ZK，也不要求你有密码学背景，跟着做就行。**

#### 谁适合学？

👉 想了解 ZK（零知识证明），但不知道从哪里开始

👉 学过 Solidity / Rust / Go 等开发语言，想进入 Web3 新方向

👉 对隐私计算、区块链底层技术感兴趣，但一直停留在"听说过"

👉 想做一点真正能跑起来的 Web3 项目，而不是只看概念

👉 想进入 Aleo 生态，提前卡位新技术方向

---

### ⭐ 课程大纲 ⭐

**第一章：为什么需要隐私？**（2 节课）5.11 - 5.17 | [课程](https://openbuild.xyz/learn/challenges/2097505722/1778499675) | [task1](./task/task1.md)

* 常见的隐私常见介绍和技术背景
* 介绍Aleo的背景和基础信息
* Aleo Concept
  * UTXO

**第二章：Leo 入门：学会这门语言**（1 节课）5.19 - 5.24 | [课程](https://openbuild.xyz/learn/challenges/2097505722) | [task2](./task/task2.md)

* Leo语言语法基础入门和简单Demo

* 融入AI Coding部分

**第三章：建起来：从程序到 dApp**（1 节课）5.26 - 5.31 | [课程](https://openbuild.xyz/learn/challenges/2097505722) | [task3](./task/task3.md)

* 基于Leo+前端+必要的SDK等构建一个有前端界面的隐私小应用
* 融入AI Coding部分

**第四章：用起来：真实场景落地**（1-2 节课）6.2 - 6.7 | [课程](https://openbuild.xyz/learn/challenges/2097505722) | [task4](./task/task4.md)

---

### 任务

每个课程章节对应一个 **task**，可以在 [task](./task) 文件夹中复制对应章节到你的文件夹 `learn/YourName` 中，然后完成作业并提交 PR。**注意：不要修改别人文件夹的内容。 每章课程开课后才可提交本章作业**

<br>

**任何时间都可以提交作业，只是在截止时间之后提交的作业没有奖励**

| Task                     | 对应章节                  | 学习奖励 | **截止提交时间**       | **奖励发放** |
| ------------------------ | ------------------------- | -------- | ---------------------- | ------------ |
| [task1](./task/task1.md) | 1. 为什么需要隐私？       | ¥6       | 5月17日24:00:00(UTC+8) | [奖励发放记录](./reward/task1_bounty.md)  |
| [task2](./task/task2.md) | 2. Leo 入门：学会这门语言 | ¥12      | 5月24日24:00:00(UTC+8) | [奖励发放记录](./reward/task2_bounty.md)  |
| [task3](./task/task3.md) | 3. 建起来：从程序到 dApp  | ¥15      | 5月31日24:00:00(UTC+8) |              |
| [task4](./task/task4.md) | 4. 用起来：真实场景落地   | ¥20      | 6月14日24:00:00(UTC+8) |              |

完成所有 Task 可直通 Aleo Hackathon，获得官方深度指导与生态机会。

---

### 关于学习奖励

奖励分为作业奖励和寻宝大奖（奖励池1000美元）。

- 寻宝大奖为一台 MacBook Neo(价值500美元）, 需要学完课程完成所有课程作业，参与黑客松并提交项目。(根据作业完成度和项目综合评审选取一位中奖者）

- 作业奖励上面task部分已经列出，按时提交作业即可获得作业奖励，如果作业奖励池用完，则晚提交的作业没有奖励

---

### 关于中文文档

Aleo 中文文档已经在加紧翻译中啦 🚀
欢迎大家一起参与翻译共建，无论是补充内容、修正文案，还是完善教程，都会帮助更多开发者更轻松进入 Aleo 生态 💪

后续所有学员都可以直接通过以下地址直接查看中文文档：

* https://openbuildxyz.github.io/Aleo-101-Bootcamp

目前 `docs/` 目录也正在持续补充与翻译官方内容，可参考：

* 官方文档：https://developer.aleo.org/guides/introduction/getting_started/
* 官方文档资源源代码：https://github.com/AleoNet/welcome

---

### 为什么现在选择 Aleo？

**✅ 技术成熟度拐点**

Aleo 完成主网稳定运行、核心版本升级、工具链完善，开发门槛降至历史最低，从"技术验证期"进入"生态爆发期"，**开发者无需应对早期技术漏洞与工具缺失，可专注应用创新。**

**✅ 市场需求爆发**

数据隐私已成为 Web3、AI、金融科技领域的核心刚需，Aleo 凭借合规隐私布局抢占市场先机，先后与 Paxos、Circle 达成合作，推出 USAD、USDCX 两款合规隐私稳定币，精准覆盖机构与普通用户需求；**ZK 隐私应用市场规模预计 2026 年突破百亿美元，Aleo 作为赛道龙头，具备先发与技术双重优势。**

**✅ 开发者红利期**

**Aleo 生态仍处于早期扩张阶段，开发者稀缺、应用空白，此时入局可抢占生态核心位置，成为隐私赛道技术专家，获得生态激励、项目合作、职业发展的多重红利。**

---

### 学习资源

#### Aleo

1. [Aleo 官方文档](https://developer.aleo.org/)
2. [Leo 语言入门](https://leo-lang.org/)
3. [Aleo Studio](https://aleo.studio/)

#### ZK 零知识证明

1. [Zero-Knowledge Proofs 入门](https://zkproof.org/)
2. [ZKP 学习路径](https://github.com/matter-labs/awesome-zero-knowledge-proofs)

#### Web3 通用

1. [Web3 DApp 最佳编程实践指南](https://guoyu.mirror.xyz/RD-xkpoxasAU7x5MIJmiCX4gll3Cs0pAd5iM258S1Ek)
2. [区块链黑暗森林自救手册](https://github.com/slowmist/Blockchain-dark-forest-selfguard-handbook/blob/main/README_CN.md)

---

### 关于 Aleo

Aleo 作为一个定位为"ZK by Design"的 Layer 1 协议，是全球首个默认隐私、可编程、高性能的 Layer1 区块链，专注解决传统公链"透明即公开"的底层缺陷，通过零知识密码学为 Web3 应用提供端到端数据隐私保护，同时保留智能合约的可编程性与区块链的去中心化特性。

### 关于 OpenBuild

OpenBuild 是一个倡导开放协作的开源社区，致力于帮助开发者成长为具备独立产品构建能力的超级个体。社区以开源精神为核心，专注 Web3 与 AI 等前沿技术，支持开发者从想法出发，完成从创意到可用产品的全链路实践。
