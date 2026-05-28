export type Commitment = {
  labelHash: string;
  noteCommitment: string;
};

const FIELD_MODULUS_DEMO_LIMIT = 9_007_199_254_740_991n;
const FNV_OFFSET = 14_695_981_039_346_656_037n;
const FNV_PRIME = 1_099_511_628_211n;

export function createCommitment(label: string, note: string): Commitment {
  const normalizedLabel = normalizeInput(label || '未命名标签');
  const normalizedNote = normalizeInput(note || '空内容');

  return {
    labelHash: toDemoField(`label:${normalizedLabel}`),
    noteCommitment: toDemoField(`note:${normalizedLabel}:${normalizedNote}`),
  };
}

export function buildLeoCommand(
  owner: string,
  commitment: Commitment,
  createdAt = Math.floor(Date.now() / 1000),
): string {
  const safeCreatedAt = Number.isFinite(createdAt) && createdAt > 0 ? Math.floor(createdAt) : 1;

  return [
    'leo run create_card',
    owner.trim(),
    commitment.labelHash,
    commitment.noteCommitment,
    `${safeCreatedAt}u64`,
  ].join(' ');
}

export function buildLeoInputFile(owner: string, commitment: Commitment, createdAt: number): string {
  return [
    '// 本文件只包含公开地址和承诺值，不包含私钥、助记词或 View Key。',
    owner.trim(),
    commitment.labelHash,
    commitment.noteCommitment,
    `${Math.floor(createdAt)}u64`,
  ].join('\n');
}

function normalizeInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function toDemoField(value: string): string {
  // 这是前端 demo 用的轻量哈希，方便把任意文本变成 Leo field 字面量。
  // 真实生产环境应使用与电路一致的 Pedersen/BHP/Poseidon 等 ZK 友好哈希。
  const bytes = new TextEncoder().encode(value);
  let hash = FNV_OFFSET;

  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = (hash * FNV_PRIME) % FIELD_MODULUS_DEMO_LIMIT;
  }

  return `${hash + 1n}field`;
}
