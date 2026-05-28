# Task 3 - 建起来：从程序到 dApp

基于 Leo 和前端完成一个可交互的隐私小应用, 请提交代码文件和demo截图。

## 项目概述

**项目名称**：Aleo 私密计数器 (Private Counter)

**项目简介**：基于 Aleo 零知识证明技术的隐私保护计数器应用，所有计数操作在链下执行，仅提交零知识证明到链上，确保用户数据完全私密。

## 技术实现

### 1. 智能合约 (Leo 语言)

```leo
program counter_app.aleo {
    // 私密计数器 record
    record Counter {
        owner: address,
        value: u32,
    }

    // 创建计数器
    transition mint -> Counter {
        return Counter {
            owner: self.caller,
            value: 0u32,
        } then finalize mint();
    }

    // 增加计数（私密操作）
    transition increment(counter: Counter) -> Counter {
        assert_eq(counter.owner, self.caller);
        let new_value: u32 = counter.value + 1u32;
        return Counter {
            owner: self.caller,
            value: new_value,
        } then finalize increment();
    }

    // 查看数值
    transition get_value(counter: Counter) -> u32 {
        assert_eq(counter.owner, self.caller);
        return counter.value;
    }
}
```

### 2. 前端界面 (HTML5/CSS3/JS)

- 现代化响应式设计
- 模拟 Aleo 钱包交互流程
- 实时状态反馈
- 私密/公开模式切换

### 3. 核心功能

| 功能 | 描述 | 隐私级别 |
|------|------|----------|
| 创建计数器 | 生成新的私密计数器 record | 🔒 私密 |
| 增加计数 | 在本地执行并生成 ZK 证明 | 🔒 私密 |
| 查看数值 | 临时解密显示当前值 | 🔓 可选公开 |

## Demo 截图

### 主界面
![主界面截图](screenshot_main.png)

### 创建计数器
![创建计数器截图](screenshot_mint.png)

### 增加计数
![增加计数截图](screenshot_increment.png)

### 查看数值
![查看数值截图](screenshot_value.png)

## 代码文件

完整代码已提交至：`learn/Lukeknow0/private-counter/`

- `counter_app/main.leo` - Leo 智能合约
- `index.html` - 前端界面
- `README.md` - 项目说明文档

## 隐私特性说明

1. **默认隐私**：所有计数操作在链下执行，链上仅存储加密的 commitment
2. **零知识证明**：验证者无法获取实际计数值，只能验证计算正确性
3. **所有权保护**：只有 record 所有者持有 view key 可解密数据
4. **可选公开**：用户可选择临时公开数值，3秒后自动重新加密

## 学习收获

通过本项目，深入理解了：
- Aleo 的 record 模型和隐私保护机制
- Leo 语言的 transition/finalize 两段式执行模型
- 零知识证明在 dApp 中的实际应用
- 前端与 Aleo 程序的交互方式

---

**提交人**：luke不吃面 (Lukeknow0)  
**日期**：2026年5月21日  
**Aleo 钱包地址**：aleo15xrzy5rp2rz8xadnv8htm267k7tt3q3gmkh7nqqfva5kt02v6yyqpdnu8e
