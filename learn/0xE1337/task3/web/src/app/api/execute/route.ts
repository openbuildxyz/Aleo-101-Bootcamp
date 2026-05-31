import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

// Real on-chain execution, server-side, by shelling out to the Leo CLI (native
// snarkVM — fast + reliable, unlike the WASM SDK in Node). The signing key lives
// in the Leo program's own .env (server-side) — the browser never sends a key.
// Returns the freshly-created Credential record so the next call (prove_access)
// can spend it.
//
// LOCAL ONLY: requires `leo` installed + the program dir (with its .env) on the
// machine running the server. Set LEO_DIR to the program path.

export const runtime = "nodejs";
export const maxDuration = 300;

const execFileAsync = promisify(execFile);
// Required in REAL mode — set LEO_DIR in .env.local (see .env.example). No
// hardcoded fallback: an absolute dev path would leak into the public repo.
const LEO_DIR = process.env.LEO_DIR;
// A dedicated RPC (e.g. QuickNode) broadcasts far more reliably than the public
// Cloudflare-fronted endpoint, which intermittently 522s. Set ALEO_ENDPOINT
// (server-side secret, never NEXT_PUBLIC) to use it; falls back to the public one.
const ENDPOINT = process.env.ALEO_ENDPOINT || "https://api.explorer.provable.com/v1";

// Defense in depth: leo can echo .env contents on some failures. Strip any Aleo
// key material before an error reaches a log or HTTP response.
const redact = (s: string) =>
  s.replace(/A(Private|View)Key1[1-9A-HJ-NP-Za-km-z]+/g, "A$1Key1***");

const FUNCTIONS = new Set(["issue", "prove_access"]);
const INPUT_RE = /^(aleo1[a-z0-9]+|[0-9]+(field|u8|u32|u64|group)|\{[\s\S]+\})$/;

function parseTxId(out: string): string | null {
  return (out.match(/transaction ID:\s*'(at1[a-z0-9]+)'/) || [])[1] ?? null;
}
function parseRecord(out: string): string | null {
  const m = out.match(/\{\s*owner:[\s\S]*?_version:\s*\d+u8\.public\s*\}/);
  return m ? m[0].replace(/\s+/g, " ").trim() : null;
}

export async function POST(req: Request) {
  let body: { functionName?: string; inputs?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const { functionName, inputs } = body;
  if (
    !functionName ||
    !FUNCTIONS.has(functionName) ||
    !Array.isArray(inputs) ||
    !inputs.every((i) => typeof i === "string" && INPUT_RE.test(i.trim()))
  ) {
    return NextResponse.json({ error: "bad functionName / inputs" }, { status: 400 });
  }
  if (!LEO_DIR) {
    return NextResponse.json({ error: "服务器未配置 LEO_DIR" }, { status: 500 });
  }

  const args = [
    "execute", functionName, ...inputs,
    "--broadcast", "-y",
    "--network", "testnet",
    "--endpoint", ENDPOINT,
    "--network-retries", "8",
    "--max-wait", "45",
  ];

  // Provable's testnet RPC is intermittently 522/timeout on broadcast — retry
  // transient failures (proving keys cache after the first run).
  const isTransient = (m: string) =>
    /522|503|504|fetch|broadcast|timed?\s*out|timeout|reqwest|decoding|block\/height|stateRoot|connection|ECONN|network request/i.test(
      m,
    );

  let lastErr = "";
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const { stdout, stderr } = await execFileAsync("leo", args, {
        cwd: LEO_DIR,
        timeout: 280_000,
        maxBuffer: 16 * 1024 * 1024,
      });
      const out = `${stdout}\n${stderr}`;
      const txId = parseTxId(out);
      if (txId) return NextResponse.json({ txId, record: parseRecord(out) });
      lastErr = redact(`no tx id: ${out.slice(-300)}`);
    } catch (e) {
      // execFile errors carry the CLI's real stdout/stderr — read those, not the
      // generic "Command failed" message. The tx may have broadcast even if leo
      // exited non-zero on the confirmation search.
      const err = e as { message?: string; stdout?: string; stderr?: string };
      const out = `${err.stdout ?? ""}\n${err.stderr ?? ""}`;
      const txId = parseTxId(out);
      if (txId) return NextResponse.json({ txId, record: parseRecord(out) });
      lastErr = redact((err.stderr || err.stdout || err.message || String(e)).trim());
      console.error(`[api/execute] attempt ${attempt}:`, lastErr.slice(0, 500));
      if (!isTransient(lastErr)) break;
    }
  }
  return NextResponse.json({ error: lastErr.slice(0, 500) }, { status: 500 });
}
