import { Transaction } from "@demox-labs/aleo-wallet-adapter-base";
import type { WalletContextState } from "@demox-labs/aleo-wallet-adapter-react";
import { CHAIN_ID, PROGRAM_ID } from "./aleo";
import type { ProposalEntry } from "../proposals";

// Flat fee in microcredits (1 credit = 1_000_000). Generous for a small demo —
// `propose` and `new_ticket` only mutate mappings; `agree`/`disagree` spend a record too.
const FEE_MICROCREDITS = 300_000;

type Wallet = Pick<WalletContextState, "publicKey" | "requestExecution">;

function buildTx(address: string, functionName: string, inputs: unknown[]): Transaction {
  return Transaction.createTransaction(
    address,
    CHAIN_ID,
    PROGRAM_ID,
    functionName,
    inputs,
    FEE_MICROCREDITS,
    false, // public fee — simpler for the demo
  );
}

function requireWallet(w: Wallet): asserts w is { publicKey: string; requestExecution: NonNullable<WalletContextState["requestExecution"]> } {
  if (!w.publicKey) throw new Error("Wallet not connected");
  if (!w.requestExecution) throw new Error("Wallet does not support requestExecution");
}

export async function propose(
  wallet: Wallet,
  proposal: ProposalEntry,
): Promise<string> {
  requireWallet(wallet);
  const info = `{title: ${proposal.title}, content: ${proposal.content}, proposer: ${wallet.publicKey}}`;
  const tx = buildTx(wallet.publicKey, "propose", [info]);
  return wallet.requestExecution(tx);
}

export async function claimTicket(
  wallet: Wallet,
  proposal: ProposalEntry,
): Promise<string> {
  requireWallet(wallet);
  const tx = buildTx(wallet.publicKey, "new_ticket", [proposal.title]);
  return wallet.requestExecution(tx);
}

export type VoteChoice = "agree" | "disagree";

export async function vote(
  wallet: Wallet,
  choice: VoteChoice,
  ticketPlaintext: string,
): Promise<string> {
  requireWallet(wallet);
  const tx = buildTx(wallet.publicKey, choice, [ticketPlaintext]);
  return wallet.requestExecution(tx);
}

/**
 * Find an unspent Ticket record matching `pid`. Returns the record's plaintext string
 * (ready to pass to `vote`), or null if the user holds no matching ticket.
 *
 * Each Aleo wallet exposes records as objects with at minimum: `spent: boolean`, `plaintext: string`,
 * and `data` (parsed fields). We filter on spent + pid match. Shape varies slightly between
 * wallets, so we tolerate both `data.pid` and a parsed substring of plaintext.
 */
export async function findTicket(
  requestRecordPlaintexts: NonNullable<WalletContextState["requestRecordPlaintexts"]>,
  pid: string,
): Promise<string | null> {
  const records = await requestRecordPlaintexts(PROGRAM_ID);
  const match = records.find((r: { spent?: boolean; data?: { pid?: string }; plaintext?: string }) => {
    if (r.spent) return false;
    if (r.data?.pid === pid) return true;
    if (typeof r.plaintext !== "string") return false;
    const re = new RegExp(`pid:\\s*${pid}(?:[^0-9a-z]|$)`);
    return re.test(r.plaintext);
  });
  return match?.plaintext ?? null;
}
