import { describe, expect, it } from 'vitest';
import { buildLeoCommand, createCommitment } from './commitment';

describe('createCommitment', () => {
  it('同样的标签和私密内容会生成稳定结果', () => {
    const first = createCommitment('学习 Aleo', '我的第一张隐私卡');
    const second = createCommitment('学习 Aleo', '我的第一张隐私卡');

    expect(second).toEqual(first);
  });

  it('不同私密内容会改变承诺值', () => {
    const first = createCommitment('学习 Aleo', '内容 A');
    const second = createCommitment('学习 Aleo', '内容 B');

    expect(second.noteCommitment).not.toBe(first.noteCommitment);
  });

  it('可以生成 Leo create_card 命令参数', () => {
    const commitment = createCommitment('学习 Aleo', '我的第一张隐私卡');
    const command = buildLeoCommand(
      'aleo1fymf85ullghvzd7av3ajhgfen0875kz9knq7tgna9hr2fswjqsfqxdtvze',
      commitment,
    );

    expect(command).toContain('leo run create_card');
    expect(command).toContain('aleo1fymf85ullghvzd7av3ajhgfen0875kz9knq7tgna9hr2fswjqsfqxdtvze');
    expect(command).toContain(commitment.labelHash);
    expect(command).toContain(commitment.noteCommitment);
  });
});
