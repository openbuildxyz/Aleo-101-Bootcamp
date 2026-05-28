# Task 3 - 建起来：从程序到 dApp

## 项目：ZK Treasure Hunt 🪄

基于 Leo（Aleo）和 HTML/CSS/JS 构建的零知识证明互动游戏。

**GitHub 仓库：** https://github.com/katielin0207-dev/zk-treasure-hunt

---

## 应用简介

游戏主在 5×5 地图上秘密藏好宝藏，玩家有 5 次机会猜测坐标。每次猜测都会生成一个 ZK 证明，验证猜测结果（命中/未命中），但**不暴露宝藏的位置**。宝藏坐标只在游戏结束时才被揭晓。

## ZK 特性

- **Private**：宝藏坐标 `(x, y)` 存储在 Leo 的 private record 中，始终不上链
- **Public**：每次猜测的 hit/miss 结果通过 ZK proof 公开验证
- **finalize**：链上记录每位玩家的尝试次数，防止超过 5 次

## 文件结构

```
zk-treasure-hunt/
├── index.html              # 前端（Harry Potter 主题，含完整游戏逻辑）
├── leo/
│   ├── program.json
│   └── src/main.leo        # Leo 合约：hide_treasure + verify_guess
└── README.md
```

## Demo 截图

### 游戏初始状态
![demo](https://raw.githubusercontent.com/katielin0207-dev/zk-treasure-hunt/main/demo_screenshot.png)

### 胜利画面
![win](https://raw.githubusercontent.com/katielin0207-dev/zk-treasure-hunt/main/demo_win.png)
