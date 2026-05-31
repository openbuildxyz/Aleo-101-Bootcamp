"use client";

import { useCallback, useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { PROGRAM_ID } from "@/lib/constants";
import { DEMO_MODE, REAL_MODE, DEMO_CREDENTIALS, sleep } from "@/lib/demo";
import { useStoredCreds } from "@/lib/credStore";

export type RawRecord = Record<string, unknown> | string;

export type ParsedCredential = {
  raw: RawRecord;
  plaintext: string; // best-effort string to pass back to prove_access
  issuer: string | null; // raw field value (no suffix)
  tier: number | null;
  expiry: number | null;
};

function getProp(obj: Record<string, unknown>, key: string): unknown {
  const sub = (k: string): unknown => {
    const s = obj[k];
    return s && typeof s === "object" ? (s as Record<string, unknown>)[key] : undefined;
  };
  return obj[key] ?? sub("data") ?? sub("plaintext") ?? sub("recordData");
}

function pickField(rec: RawRecord, key: string): string | null {
  if (typeof rec === "string") return null;
  const v = getProp(rec, key);
  return v == null ? null : String(v);
}

function clean(v: string | null): string | null {
  if (v == null) return null;
  return v
    .replace(/\.(private|public)$/, "")
    .replace(/(field|u8|u32|u64|group)$/, "");
}

function recordPlaintext(rec: RawRecord): string {
  if (typeof rec === "string") return rec;
  const p = rec["plaintext"] ?? rec["recordPlaintext"];
  if (typeof p === "string") return p;
  return JSON.stringify(rec);
}

// Reads the connected user's PRIVATE Credential records. The wallet decrypts
// them with the owner's view key — the key never leaves it, and the public REST
// API cannot see these records at all.
export function useCredentials() {
  const { connected, requestRecords } = useWallet();
  const stored = useStoredCreds();
  const [creds, setCreds] = useState<ParsedCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      // REAL mode: the records were minted by the server this session and kept
      // in the in-memory store (the public API can't read private records).
      if (REAL_MODE) {
        setCreds(
          stored.map((s) => ({
            raw: s.record,
            plaintext: s.record,
            issuer: s.issuerField,
            tier: s.tier,
            expiry: s.expiry,
          })),
        );
        setLoaded(true);
        return;
      }

      let recs: RawRecord[];
      if (DEMO_MODE) {
        await sleep(700);
        recs = DEMO_CREDENTIALS as RawRecord[];
      } else {
        if (!connected) {
          setError("请先连接钱包");
          return;
        }
        recs = ((await requestRecords(PROGRAM_ID, true, "unspent")) ??
          []) as RawRecord[];
        console.log("[credentials] requestRecords →", recs);
        console.log(
          "[credentials] shape →",
          JSON.stringify(recs?.[0] ?? null, null, 2),
        );
      }
      const parsed = recs.map((rec): ParsedCredential => {
        const tier = clean(pickField(rec, "tier"));
        const expiry = clean(pickField(rec, "expiry"));
        return {
          raw: rec,
          plaintext: recordPlaintext(rec),
          issuer: clean(pickField(rec, "issuer")),
          tier: tier ? Number(tier) : null,
          expiry: expiry ? Number(expiry) : null,
        };
      });
      setCreds(parsed);
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [connected, requestRecords, stored]);

  return { creds, load, loading, loaded, error };
}
