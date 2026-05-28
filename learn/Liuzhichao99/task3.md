# Task 3 - 建起来：从程序到 dApp

## 项目名称
Private Multiplier Demo（私密乘法小应用）

## 项目说明
这是一个基于 Leo 语言的隐私计算应用示例：
- 使用 Leo 编写 `private_multiply` 逻辑，实现两个私有数的乘法运算；
- 提供前端交互界面，支持私有输入、计算和结果展示；
- 额外实现了结果验证功能 `verify_result`，展示零知识证明的验证能力；
- 前端当前使用本地模拟执行，保留了接入钱包/SDK 的位置，便于未来扩展到真实链上调用。

## 技术亮点
- **隐私计算**：输入值保持私密，只在链下或隐私合约中计算，验证过程不泄露原始数据
- **可验证性**：通过 `verify_result` 函数展示零知识证明的核心特性——证明计算正确性而不暴露输入
- **用户友好**：简洁的前端界面，提供清晰的交互反馈

## 目录结构
```text
task3/
├── leo/
│   └── private_multiplier.leo
├── web/
│   └── index.html
├── demo-screenshot.svg
└── task3.md
```

## Leo 代码文件
- `leo/private_multiplier.leo`

核心函数：
```leo
fn private_multiply(a: u32, b: u32) -> u32 {
    let result: u32 = a * b;
    return result;
}

fn verify_result(a: u32, b: u32, expected: u32) -> bool {
    let actual: u32 = a * b;
    return actual == expected;
}
```

## 前端代码文件
- `web/index.html`

前端功能：
- 输入两个非负整数（模拟私有输入）；
- 点击"执行私密乘法"按钮触发计算；
- 点击"验证结果"按钮进行零知识证明验证；
- 展示计算结果和 demo tx id。

## Demo 截图
- `demo-screenshot.svg`

可在 markdown 中预览：

![demo](./demo-screenshot.svg)

## 运行方式（本地）
在 `task3/web` 目录下直接用浏览器打开 `index.html` 即可看到交互效果。

## 未来扩展
- 集成 Aleo SDK，实现真实的链上交易
- 使用 Shield Wallet 或其他 Aleo 钱包连接
- 添加更多隐私计算功能（如比较、条件判断等）
- 优化UI/UX，增加更多交互特性