# Task 3 - 建起来：从程序到 dApp

基于 Leo 和前端完成一个可交互的隐私小应用, 请提交代码文件和demo截图。

ZK Airdrop Claim 是一个基于 Aleo 的隐私保护空投领取 Demo。项目围绕 Web3 空投场景设计，用户可以根据任务完成进度获得不同等级的领取资格，并在本地 devnet 上完成资格签发和奖励领取流程。

与传统空投直接公开领取名单、用户等级和奖励金额不同，本项目将用户的 Eligibility 资格记录和 Reward 奖励记录设计为私有 record，只在链上公开必要的 campaign 统计数据和 claimed mapping，用于防止同一用户重复领取。前端支持多个本地 devnet 测试账户切换，可以演示“同一账户只能领取一次，不同账户可分别领取”的完整流程。

项目包含 Aleo/Leo 智能合约、Next.js 前端、本地 devnet 调用接口和多账户测试流程。代码文件和应用截图均放在 task3_demo 文件夹中，便于评审查看项目实现、运行效果和演示截图。

项目GitHub地址： https://github.com/Maimai10808/zk-airdrop-claim
