"use client";

// Client for the server-side Leo CLI backend (/api/address, /api/execute).
// In REAL mode the browser never holds a key: it posts function + inputs and
// the server shells out to `leo execute --broadcast`, returning the on-chain
// transaction id (and, for issue, the freshly-minted Credential record).

let addressCache: string | null = null;

/** Address of the server's signing account (the .env key). Cached. */
export async function getServerAddress(): Promise<string> {
  if (addressCache) return addressCache;
  const res = await fetch("/api/address", { cache: "no-store" });
  const json = (await res.json()) as { address?: string; error?: string };
  if (!res.ok || !json.address) {
    throw new Error(json.error || "无法获取签名账户地址");
  }
  addressCache = json.address;
  return json.address;
}

export type ExecResult = { txId: string; record: string | null };

/** Run a program function on-chain via the server. Resolves once broadcast. */
export async function executeReal(
  functionName: "issue" | "prove_access",
  inputs: string[],
): Promise<ExecResult> {
  const res = await fetch("/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ functionName, inputs }),
  });
  const json = (await res.json()) as {
    txId?: string;
    record?: string | null;
    error?: string;
  };
  if (!res.ok || !json.txId) {
    throw new Error(json.error || "链上执行失败，请重试");
  }
  return { txId: json.txId, record: json.record ?? null };
}
