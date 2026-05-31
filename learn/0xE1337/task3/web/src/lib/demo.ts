// Offline demo mode. When NEXT_PUBLIC_DEMO_MODE=true the app stubs wallet
// signing (fake tx ids) and serves fixture records, so the full UI flow can be
// shown cleanly with no wallet. Never uses a real private key — fixtures only.
//
// The fixtures below mirror a REAL on-chain scenario that was executed via the
// Leo CLI (issuer "Aleo Builders DAO" / gate "VIP Lounge"), so the live public
// counter the page reads (gate_access_count[VIP Lounge] = 1) matches the demo.

// REAL mode drives genuine on-chain execution through the server-side Leo CLI
// backend (no wallet, no key in the browser). It takes precedence over DEMO_MODE
// when both are set. Off by default so the committed app runs anywhere without a
// local `leo` install; the operator enables it via NEXT_PUBLIC_REAL_MODE=true.
export const REAL_MODE = process.env.NEXT_PUBLIC_REAL_MODE === "true";

// Defaults to ON so the submitted app demos end-to-end out of the box.
// Set NEXT_PUBLIC_DEMO_MODE=false to drive a real wallet instead.
export const DEMO_MODE =
  !REAL_MODE && process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export const DEMO_ADDRESS =
  "aleo1ntxq2hsvnh4s5rmh23z2hvdlkd5j97mrxpjutk0ze6nys7ll25zquq3zyr";

// A real, confirmed prove_access tx (CLI) for the VIP Lounge gate.
export const DEMO_TX_ID =
  "at1vd4jfcl3p6l7vcnfex2fy2q6wvx8r7dwd5pjm3hp3r4rklj6pczsytzyvh";

// Mirrors the shape returned by requestRecords for a Credential — a Gold (tier 3)
// "Aleo Builders DAO" membership, which clears the VIP Lounge's tier >= 2 gate.
export const DEMO_CREDENTIALS: Array<Record<string, unknown>> = [
  {
    owner: `${DEMO_ADDRESS}.private`,
    issuer:
      "57465860143019737114708179178075709254043619048013032676401829489845677361field.private",
    tier: "3u8.private",
    expiry: "20969u32.private",
    secret:
      "4242424242424242424242424242424242424242424242424242424242field.private",
    _demo: true,
  },
];

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
