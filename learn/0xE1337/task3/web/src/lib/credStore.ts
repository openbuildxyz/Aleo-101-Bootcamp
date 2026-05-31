"use client";

// Session-scoped store of credentials minted in REAL mode this session.
//
// A private Credential lives encrypted in its owner's wallet; the public REST
// API cannot read it. With no wallet in the loop (the server signs via the Leo
// CLI), the browser keeps the freshly-issued record plaintext in memory so the
// gate step can spend it. This is intentionally session-only — refreshing the
// page clears it, exactly like an un-persisted wallet.

import { useSyncExternalStore } from "react";

export type StoredCred = {
  record: string; // full record plaintext, passed verbatim to prove_access
  tier: number;
  issuerField: string; // raw field value (no suffix)
  issuerName: string;
  expiry: number;
  txId: string;
};

const EMPTY: StoredCred[] = [];
let creds: StoredCred[] = EMPTY;
const listeners = new Set<() => void>();

export function addCred(c: StoredCred): void {
  creds = [c, ...creds]; // immutable: new array, newest first
  listeners.forEach((l) => l());
}

function getSnapshot(): StoredCred[] {
  return creds;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reactively read this session's minted credentials. */
export function useStoredCreds(): StoredCred[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
