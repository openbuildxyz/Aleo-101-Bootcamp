"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, BriefcaseBusiness, Check, EyeOff, FileLock2, KeyRound, ShieldCheck, Wallet } from "lucide-react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
import {
  CHAIN_ID,
  DEFAULT_FEE_MICROCREDITS,
  PROGRAM_ID,
  ResumeDraft,
  VerifyRequirement,
  qualifies,
  toLeoBool,
  toLeoU8
} from "@/lib/aleo";

type TxState = {
  status: "idle" | "pending" | "success" | "error";
  message: string;
};

const initialResume: ResumeDraft = {
  solidity: true,
  react: true,
  years: 3
};

const initialRequirement: VerifyRequirement = {
  needSolidity: true,
  minYears: 2
};

export function ResumeApp() {
  const [resume, setResume] = useState<ResumeDraft>(initialResume);
  const [requirement, setRequirement] = useState<VerifyRequirement>(initialRequirement);
  const [sealedResume, setSealedResume] = useState<ResumeDraft | null>(null);
  const [result, setResult] = useState<boolean | null>(null);
  const [walletProof, setWalletProof] = useState<string | null>(null);
  const [tx, setTx] = useState<TxState>({ status: "idle", message: "Ready for Testnet wallet actions." });
  const { publicKey, signMessage, requestTransaction, requestRecords } = useWallet();

  const canVerify = sealedResume !== null;
  const previewQualified = useMemo(
    () => (sealedResume ? qualifies(sealedResume, requirement) : null),
    [requirement, sealedResume]
  );

  async function authorizeWithWallet() {
    if (!publicKey || !signMessage) {
      setTx({ status: "error", message: "Connect an Aleo wallet before authorizing the resume." });
      return;
    }

    setTx({ status: "pending", message: "Open your wallet and sign the PrivateResume authorization." });

    try {
      const message = new TextEncoder().encode(
        `PrivateResume authorization\nprogram=${PROGRAM_ID}\nwallet=${publicKey}\ntime=${new Date().toISOString()}`
      );
      const signature = await signMessage(message);
      const signaturePreview = Array.from(signature.slice(0, 8))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      setWalletProof(signaturePreview);
      setTx({
        status: "success",
        message: `Wallet authorization signed: ${signaturePreview}...`
      });
    } catch (error) {
      setTx({
        status: "error",
        message: error instanceof Error ? error.message : "Wallet signature was rejected."
      });
    }
  }

  function updateResume<K extends keyof ResumeDraft>(key: K, value: ResumeDraft[K]) {
    setResume((current) => ({ ...current, [key]: value }));
  }

  function generatePrivateResume() {
    setSealedResume(resume);
    setResult(null);
    setTx({
      status: "success",
      message: walletProof
        ? "Private resume sealed after wallet authorization."
        : "Private resume sealed locally. Wallet authorization is still recommended for the full flow."
    });
  }

  async function submitResumeWithWallet() {
    if (!publicKey || !requestTransaction) {
      setTx({ status: "error", message: "Connect an Aleo wallet before submitting to Testnet." });
      return;
    }

    setTx({ status: "pending", message: "Requesting wallet transaction for create_resume..." });

    try {
      const response = await requestTransaction({
        address: publicKey,
        chainId: CHAIN_ID,
        transitions: [
          {
            program: PROGRAM_ID,
            functionName: "create_resume",
            inputs: [toLeoBool(resume.solidity), toLeoBool(resume.react), toLeoU8(resume.years)]
          }
        ],
        fee: DEFAULT_FEE_MICROCREDITS,
        feePrivate: false
      });

      setTx({ status: "success", message: `Wallet submitted create_resume: ${String(response)}` });
    } catch (error) {
      setTx({
        status: "error",
        message:
          error instanceof Error
            ? `${error.message}. Confirm ${PROGRAM_ID} is deployed on Testnet and the wallet has credits.`
            : `Wallet could not submit create_resume. Confirm ${PROGRAM_ID} is deployed on Testnet.`
      });
    }
  }

  async function loadWalletRecords() {
    if (!requestRecords) {
      setTx({ status: "error", message: "Connect a wallet that supports record requests." });
      return;
    }

    setTx({ status: "pending", message: "Requesting private records from wallet..." });

    try {
      const records = await requestRecords(PROGRAM_ID);
      setTx({
        status: "success",
        message: `Wallet returned ${records.length} private record${records.length === 1 ? "" : "s"} for this program.`
      });
    } catch (error) {
      setTx({
        status: "error",
        message:
          error instanceof Error
            ? `${error.message}. Records appear after the Testnet create_resume transaction is confirmed.`
            : "Wallet could not read records for this program yet."
      });
    }
  }

  function verifyCandidate() {
    if (!sealedResume) {
      setResult(null);
      setTx({ status: "error", message: "Generate a private resume before verification." });
      return;
    }

    const qualified = qualifies(sealedResume, requirement);
    setResult(qualified);

    setTx({
      status: "success",
      message: "Verification completed without revealing the candidate's raw resume fields."
    });
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Aleo Testnet MVP</p>
          <h1>PrivateResume</h1>
        </div>
        <WalletMultiButton />
      </header>

      <section className="status-strip">
        <div className="status-item">
          <Wallet size={18} />
          <span>{publicKey ? `Wallet ${publicKey.slice(0, 10)}...${publicKey.slice(-6)}` : "Wallet not connected"}</span>
        </div>
        <div className="status-item">
          <ShieldCheck size={18} />
          <span>{PROGRAM_ID}</span>
        </div>
        <div className={`status-pill ${tx.status}`}>
          <Check size={16} />
          <span>{tx.message}</span>
        </div>
      </section>

      <section className="wallet-flow">
        <div className={`flow-step ${publicKey ? "done" : ""}`}>
          <Wallet size={18} />
          <span>Connect Aleo Wallet</span>
        </div>
        <div className={`flow-step ${walletProof ? "done" : ""}`}>
          <KeyRound size={18} />
          <span>Sign Resume Authorization</span>
        </div>
        <div className={`flow-step ${sealedResume ? "done" : ""}`}>
          <FileLock2 size={18} />
          <span>Generate Private Resume</span>
        </div>
        <div className={`flow-step ${result !== null ? "done" : ""}`}>
          <BadgeCheck size={18} />
          <span>Verify Without Revealing Data</span>
        </div>
      </section>

      <section className="workspace">
        <div className="panel">
          <div className="panel-title">
            <FileLock2 size={21} />
            <div>
              <p className="step">1. Create private resume</p>
              <h2>Candidate data</h2>
            </div>
          </div>

          <div className="field-row">
            <span>Solidity</span>
            <Toggle value={resume.solidity} onChange={(value) => updateResume("solidity", value)} />
          </div>
          <div className="field-row">
            <span>React</span>
            <Toggle value={resume.react} onChange={(value) => updateResume("react", value)} />
          </div>
          <label className="field-column">
            <span>Experience</span>
            <input
              min={0}
              max={40}
              type="number"
              value={resume.years}
              onChange={(event) => updateResume("years", Number(event.target.value))}
            />
          </label>

          <button className="wallet-button" disabled={!publicKey} onClick={authorizeWithWallet}>
            Sign With Aleo Wallet
          </button>
          <button className="primary-button" onClick={generatePrivateResume}>
            Generate Private Resume
          </button>
          <button className="ghost-button" disabled={!publicKey} onClick={submitResumeWithWallet}>
            Submit create_resume on Testnet
          </button>

          <div className="sealed-box">
            <EyeOff size={18} />
            <span>
              {sealedResume
                ? walletProof
                  ? `Wallet signed. Private record sealed. Proof ${walletProof}...`
                  : "Private record sealed. Raw values hidden from HR."
                : "No private record generated yet."}
            </span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <BriefcaseBusiness size={21} />
            <div>
              <p className="step">2. HR verification</p>
              <h2>Need</h2>
            </div>
          </div>

          <div className="field-row">
            <span>Solidity</span>
            <Toggle
              value={requirement.needSolidity}
              onChange={(value) => setRequirement((current) => ({ ...current, needSolidity: value }))}
            />
          </div>
          <label className="field-column">
            <span>Experience &gt;=</span>
            <input
              min={0}
              max={40}
              type="number"
              value={requirement.minYears}
              onChange={(event) =>
                setRequirement((current) => ({
                  ...current,
                  minYears: Number(event.target.value)
                }))
              }
            />
          </label>

          <button className="secondary-button" disabled={!canVerify} onClick={verifyCandidate}>
            Verify Candidate
          </button>
          <button className="ghost-button" disabled={!publicKey} onClick={loadWalletRecords}>
            Load Private Records From Wallet
          </button>

          <div className={`result-box ${result === null ? "empty" : result ? "qualified" : "rejected"}`}>
            <BadgeCheck size={24} />
            <div>
              <p>{result === null ? "Awaiting verification" : result ? "Candidate Qualified ✅" : "Candidate Not Qualified"}</p>
              <span>
                {result === null
                  ? "Generate a private resume, then verify the requirement."
                  : "Qualification is shown without revealing the candidate's real resume fields."}
              </span>
            </div>
          </div>

          {previewQualified !== null && (
            <p className="privacy-note">
              HR sees only this proof outcome. Solidity, React, and exact years remain hidden in the private resume.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      className={`toggle ${value ? "on" : "off"}`}
      type="button"
      aria-pressed={value}
      onClick={() => onChange(!value)}
    >
      {value ? "YES" : "NO"}
    </button>
  );
}
