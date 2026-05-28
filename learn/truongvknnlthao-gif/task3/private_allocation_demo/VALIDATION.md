# Validation

验证时间：2026-05-27

环境：

```text
leo 4.0.2
node v22.22.0
npm 10.9.4
```

## 命令

```bash
leo build
leo test
```

## 结果

`leo build` 成功，程序可以编译并生成 ABI。

`leo test` 在编译主程序和测试程序后触发本机 `Segmentation fault: 11`。在崩溃前，Leo 已成功完成：

- `private_allocation_demo.aleo` 编译；
- `test_private_allocation_demo.aleo` 编译；
- import checksum 校验输出。

因此当前保留测试文件作为 Task 3 的本地验证依据，但不把 `build/` 产物提交到仓库。后续如果需要更强验证，可在另一台机器或 Leo 后续版本中复跑 `leo test`。

## build 摘要

```text
Leo ✅ Compiled 'private_allocation_demo.aleo' into Aleo instructions.
Leo ✅ Generated ABI at 'build/abi.json'.
Program size: 0.90 KB / 500.00 KB
```

## test 崩溃边界

```text
Leo ✅ Compiled 'test_private_allocation_demo.aleo' into Aleo instructions.
Leo     Import 'private_allocation_demo.aleo': checksum = '[222u8, 70u8, ...]'
Segmentation fault: 11  leo test
```
