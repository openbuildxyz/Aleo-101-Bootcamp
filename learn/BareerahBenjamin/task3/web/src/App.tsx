import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
import { PROPOSALS, type ProposalEntry } from "./proposals";
import { getMapping, parseU64 } from "./lib/aleo";
import { claimTicket, findTicket, propose, vote } from "./lib/program";
import "./App.css";

const POLL_INTERVAL_MS = 8_000;

type Tallies = { agree: number; disagree: number; tickets: number };

function useTallies(pid: string): Tallies {
  const [tallies, setTallies] = useState<Tallies>({ agree: 0, disagree: 0, tickets: 0 });
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const [agree, disagree, tickets] = await Promise.all([
        getMapping("agree_votes", pid),
        getMapping("disagree_votes", pid),
        getMapping("tickets", pid),
      ]);
      if (cancelled) return;
      setTallies({
        agree: parseU64(agree),
        disagree: parseU64(disagree),
        tickets: parseU64(tickets),
      });
    };
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pid]);
  return tallies;
}

function ProposalCard({ proposal }: { proposal: ProposalEntry }) {
  const wallet = useWallet();
  const tallies = useTallies(proposal.title);
  const [busy, setBusy] = useState<null | "propose" | "claim" | "agree" | "disagree">(null);
  const [message, setMessage] = useState("");
  const connected = Boolean(wallet.publicKey);

  const run = useCallback(
    async (label: NonNullable<typeof busy>, action: () => Promise<string>) => {
      setBusy(label);
      setMessage("Generating proof and signing — this can take 30+ seconds.");
      try {
        const txId = await action();
        setMessage(`Submitted: ${txId}. Tally will refresh in a few seconds once finalized.`);
      } catch (err) {
        console.error(err);
        setMessage(`Failed: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const onPropose = () => run("propose", () => propose(wallet, proposal));
  const onClaim = () => run("claim", () => claimTicket(wallet, proposal));
  const onVote = (choice: "agree" | "disagree") =>
    run(choice, async () => {
      if (!wallet.requestRecordPlaintexts) throw new Error("Wallet cannot read records");
      const plaintext = await findTicket(wallet.requestRecordPlaintexts, proposal.title);
      if (!plaintext) throw new Error("No unspent ticket for this proposal — claim one first.");
      return vote(wallet, choice, plaintext);
    });

  return (
    <article className="proposal-card">
      <header>
        <h2>{proposal.displayTitle}</h2>
        <code className="proposal-pid">pid {proposal.title}</code>
      </header>
      <p>{proposal.displayContent}</p>
      <div className="tally">
        <span><strong>{tallies.agree}</strong> agree</span>
        <span><strong>{tallies.disagree}</strong> disagree</span>
        <span className="tickets-issued">({tallies.tickets} tickets issued)</span>
      </div>
      <div className="actions">
        <button disabled={!connected || busy !== null} onClick={onPropose}>
          {busy === "propose" ? "Submitting…" : "Propose (proposer only)"}
        </button>
        <button disabled={!connected || busy !== null} onClick={onClaim}>
          {busy === "claim" ? "Submitting…" : "Claim ticket"}
        </button>
        <button disabled={!connected || busy !== null} onClick={() => onVote("agree")}>
          {busy === "agree" ? "Submitting…" : "Vote agree"}
        </button>
        <button disabled={!connected || busy !== null} onClick={() => onVote("disagree")}>
          {busy === "disagree" ? "Submitting…" : "Vote disagree"}
        </button>
      </div>
      {message && <p className="status">{message}</p>}
    </article>
  );
}

function App() {
  const { publicKey } = useWallet();
  return (
    <div className="app">
      <header className="app-header">
        <h1>Anonymous Voting on Aleo</h1>
        <WalletMultiButton />
      </header>
      <p className="lede">
        Proposals and tallies are public on testnet. Your ballot — which proposal
        you voted on and whether you agreed — stays private inside the spent
        record. Each address can claim at most one ticket per proposal.
      </p>
      {!publicKey ? (
        <p className="hint">Connect a wallet on TestnetBeta to get started.</p>
      ) : (
        <p className="hint">Connected: <code>{publicKey}</code></p>
      )}
      <main>
        {PROPOSALS.map((p) => (
          <ProposalCard key={p.title} proposal={p} />
        ))}
      </main>
    </div>
  );
}

export default App;
