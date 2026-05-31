import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Returns the address of the signing account whose private key lives in the Leo
// program's .env (server-side). The key never leaves the server. Used so the UI
// can show "who is acting" and set the credential holder, without a wallet.

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
// Required in REAL mode — set LEO_DIR in .env.local (see .env.example). No
// hardcoded fallback: an absolute dev path would leak into the public repo.
const LEO_DIR = process.env.LEO_DIR;

// `leo account import <key>` puts the key in the command line, so a failure
// message can contain the private key verbatim. Strip any Aleo key material
// before it ever reaches a log or HTTP response.
const redact = (s: string) =>
  s.replace(/A(Private|View)Key1[1-9A-HJ-NP-Za-km-z]+/g, "A$1Key1***");

let cached: string | null = null;

export async function GET() {
  if (cached) return NextResponse.json({ address: cached });
  if (!LEO_DIR) {
    return NextResponse.json({ error: "服务器未配置 LEO_DIR" }, { status: 500 });
  }
  try {
    const env = await readFile(join(LEO_DIR, ".env"), "utf8");
    const key = env.match(/^PRIVATE_KEY=(\S+)/m)?.[1];
    if (!key) {
      return NextResponse.json({ error: "no PRIVATE_KEY in .env" }, { status: 500 });
    }
    const { stdout } = await execFileAsync("leo", ["account", "import", key], {
      cwd: LEO_DIR,
      timeout: 20_000,
    });
    const address = stdout.match(/Address\s+(aleo1[a-z0-9]+)/)?.[1] ?? null;
    if (!address) {
      return NextResponse.json({ error: "could not derive address" }, { status: 500 });
    }
    cached = address;
    return NextResponse.json({ address });
  } catch (e) {
    // NEVER return the raw error: it can embed the private key (it's a CLI arg).
    console.error("[api/address] derive failed:", redact(String(e)).slice(0, 300));
    return NextResponse.json(
      { error: "无法派生账户地址（详见服务器日志）" },
      { status: 500 },
    );
  }
}
