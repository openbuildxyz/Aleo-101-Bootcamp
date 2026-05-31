"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { Network } from "@provablehq/aleo-types";
import { WalletReadyState } from "@provablehq/aleo-wallet-standard";
import { getShortAddress } from "@provablehq/aleo-wallet-adaptor-core";
import { DEMO_MODE, REAL_MODE, DEMO_ADDRESS } from "@/lib/demo";
import { getServerAddress } from "@/lib/realExec";
import styles from "./WalletButton.module.css";

export function WalletButton() {
  const {
    wallets,
    wallet,
    address,
    connected,
    connecting,
    selectWallet,
    connect,
    disconnect,
  } = useWallet();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [serverAddr, setServerAddr] = useState<string | null>(null);

  useEffect(() => {
    if (REAL_MODE) getServerAddress().then(setServerAddr).catch(() => {});
  }, []);

  // REAL mode: the server signs with its .env key — show that live account.
  if (REAL_MODE) {
    return (
      <span className="tag tag--live">
        <span className="dot" /> LIVE ·{" "}
        {serverAddr ? getShortAddress(serverAddr) : "连接中…"}
      </span>
    );
  }

  if (DEMO_MODE) {
    return (
      <span className="tag tag--private">
        <span className="dot" /> DEMO · {getShortAddress(DEMO_ADDRESS)}
      </span>
    );
  }

  if (connected && address) {
    return (
      <div className={styles.wrap}>
        <button
          className="btn btn--sm"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className="dot" />
          <span className="mono">{getShortAddress(address)}</span>
        </button>
        {open && (
          <div className={styles.menu} role="menu">
            <div className={styles.menuHead}>
              {wallet?.adapter.name ?? "Connected"}
            </div>
            <button
              className="btn btn--ghost btn--sm"
              onClick={async () => {
                await disconnect();
                setOpen(false);
              }}
            >
              断开连接
            </button>
          </div>
        )}
      </div>
    );
  }

  async function pick(name: Parameters<typeof selectWallet>[0]) {
    try {
      setErr(null);
      selectWallet(name);
      await connect(Network.TESTNET);
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className={styles.wrap}>
      <button
        className="btn btn--primary btn--sm"
        disabled={connecting}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {connecting ? "连接中…" : "连接钱包"}
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHead}>选择 Aleo 钱包</div>
          {wallets.map((w) => {
            const installed = w.readyState === WalletReadyState.INSTALLED;
            return (
              <button
                key={w.adapter.name}
                className={styles.walletRow}
                onClick={() => pick(w.adapter.name)}
              >
                {w.adapter.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.adapter.icon} alt="" width={18} height={18} />
                ) : (
                  <span className={styles.iconFallback} />
                )}
                <span className={styles.walletName}>{w.adapter.name}</span>
                <span className={installed ? styles.ok : styles.muted}>
                  {installed ? "已安装" : "未检测"}
                </span>
              </button>
            );
          })}
          {err && <div className={styles.err}>{err}</div>}
        </div>
      )}
    </div>
  );
}
