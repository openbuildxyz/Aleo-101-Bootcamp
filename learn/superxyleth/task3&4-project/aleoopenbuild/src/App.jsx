import { useState } from "react";
import reactLogo from "./assets/react.svg";
import aleoLogo from "./assets/aleo.svg";
import "./App.css";
import { AleoWorker } from "./workers/AleoWorker.js";

const aleoWorker = AleoWorker();
const transferRecipient =
  "aleo1uvy6a326zq5gm65nc863jq2h062qu49txd85hzlc9z9u57x6ugxqg2hwhf";
const transferAmountCredits = "0.1";
const viteEnv =
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
const defaultNetworkUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/aleo-api/v2`
    : "https://api.provable.com/v2";
const defaultProverUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/aleo-prove/testnet`
    : "https://api.provable.com/prove/testnet";

function envValue(...names) {
  for (const name of names) {
    const value = viteEnv[name];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function stringifyResult(value) {
  return JSON.stringify(
    value,
    (_key, item) => (typeof item === "bigint" ? item.toString() : item),
    2,
  );
}

function App() {
  const [transferring, setTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState(null);

  const transferPrivateKey = envValue("VITE_ALEO_PRIVATE_KEY", "PRIVATE_KEY");
  const apiKey = envValue("VITE_ALEO_API_KEY", "API_KEY");
  const consumerId = envValue("VITE_ALEO_CONSUMER_ID", "CONSUME_ID");
  const networkUrl =
    envValue("VITE_ALEO_NETWORK_URL", "ALEO_NETWORK_URL") || defaultNetworkUrl;
  const proverUrl =
    envValue("VITE_ALEO_PROVER_URL", "ALEO_PROVER_URL") || defaultProverUrl;

  const configIssues = [];
  if (!transferPrivateKey) {
    configIssues.push("Missing PRIVATE_KEY in .env");
  } else if (!transferPrivateKey.startsWith("APrivateKey")) {
    configIssues.push("PRIVATE_KEY must be an Aleo private key, not a view key");
  }

  if (!apiKey) {
    configIssues.push("Missing API_KEY in .env");
  }

  if (!consumerId) {
    configIssues.push("Missing CONSUME_ID in .env");
  }

  const buttonDisabled = transferring || configIssues.length > 0;
  const transferState =
    configIssues.length > 0
      ? "Configuration required"
      : transferring
        ? "Sending"
        : "Ready";

  async function transferCredits() {
    setTransferring(true);
    setTransferResult(null);

    try {
      const result = await aleoWorker.delegatePublicTransfer({
        privateKey: transferPrivateKey,
        amountCredits: transferAmountCredits,
        priorityFeeCredits: 0,
        networkUrl,
        proverUrl,
        consumerId,
        apiKey,
        broadcast: true,
      });

      setTransferResult({
        ok: true,
        sender: result.sender,
        transactionId: result.transactionId,
        broadcastResult: result.broadcastResult,
      });
      console.log("Delegated testnet transfer result:", result);
    } catch (error) {
      console.error(error);
      setTransferResult({
        ok: false,
        message: error?.message ?? "Transfer failed",
      });
    } finally {
      setTransferring(false);
    }
  }

  return (
    <>
      <div>
        <a href="https://provable.com" target="_blank">
          <img src={aleoLogo} className="logo" alt="Aleo logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Aleo + React</h1>

      <section className="transfer-panel">
        <div className="transfer-header">
          <div>
            <span className="eyebrow">Testnet credits.aleo</span>
            <h2>Aleo Testnet Transfer</h2>
            <p>Send 0.1 ALEO to the configured recipient.</p>
          </div>
          <span className="status-pill">{transferState}</span>
        </div>

        <dl className="transfer-summary">
          <div>
            <dt>Network</dt>
            <dd>Testnet</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>{transferAmountCredits} ALEO</dd>
          </div>
          <div>
            <dt>Recipient</dt>
            <dd>{transferRecipient}</dd>
          </div>
          <div>
            <dt>Sender</dt>
            <dd>Loaded from PRIVATE_KEY in .env</dd>
          </div>
          <div>
            <dt>Fee</dt>
            <dd>Paid from public testnet balance</dd>
          </div>
        </dl>

        {configIssues.length > 0 && (
          <div className="notice error">
            {configIssues.map((issue) => (
              <p key={issue}>{issue}</p>
            ))}
          </div>
        )}

        <button
          className="primary-action"
          disabled={buttonDisabled}
          onClick={transferCredits}
        >
          {transferring ? "Sending..." : "Send 0.1 ALEO"}
        </button>

        {transferResult && (
          <div className={transferResult.ok ? "notice success" : "notice error"}>
            {transferResult.ok ? (
              <>
                <p className="notice-title">Transaction submitted</p>
                <dl className="result-details">
                  {transferResult.sender && (
                    <div>
                      <dt>From</dt>
                      <dd>{transferResult.sender}</dd>
                    </div>
                  )}
                  {transferResult.transactionId && (
                    <div>
                      <dt>Transaction</dt>
                      <dd>
                        <a
                          href={`https://explorer.provable.com/transaction/${transferResult.transactionId}`}
                          target="_blank"
                        >
                          {transferResult.transactionId}
                        </a>
                      </dd>
                    </div>
                  )}
                  {transferResult.broadcastResult?.status && (
                    <div>
                      <dt>Broadcast</dt>
                      <dd>{transferResult.broadcastResult.status}</dd>
                    </div>
                  )}
                </dl>
                <pre>{stringifyResult(transferResult.broadcastResult)}</pre>
              </>
            ) : (
              <>
                <p className="notice-title">Transfer failed</p>
                <p>{transferResult.message}</p>
              </>
            )}
          </div>
        )}
      </section>
    </>
  );
}

export default App;
