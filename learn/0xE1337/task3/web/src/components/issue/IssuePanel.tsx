"use client";

import { useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import {
  DEMO_ISSUER_NAME,
  DEMO_VALIDITY_DAYS,
  EXPLORER_TX,
  TIERS,
  tierLabel,
} from "@/lib/constants";
import { DEMO_MODE, REAL_MODE } from "@/lib/demo";
import { useIssue } from "@/hooks/useIssue";
import { WalletButton } from "@/components/wallet/WalletButton";
import styles from "./IssuePanel.module.css";

const PHASE_LABEL: Record<string, string> = {
  building: "构造凭证…",
  signing: "等待钱包签名…",
  pending: REAL_MODE
    ? "本地零知识出证 + 广播上链中（约 1 分钟，请稍候）…"
    : "已提交，钱包出证 + 链上确认中…",
  accepted: "已签发上链",
  failed: "交易失败",
  rejected: "已取消",
  error: "出错",
};

function short(v: string, n = 10) {
  return v.length > n * 2 ? `${v.slice(0, n)}…${v.slice(-6)}` : v;
}

export function IssuePanel() {
  const { connected } = useWallet();
  const [issuerName, setIssuerName] = useState(DEMO_ISSUER_NAME);
  const [tier, setTier] = useState(3);
  const [validityDays, setValidityDays] = useState(DEMO_VALIDITY_DAYS);
  const { issue, reset, phase, txId, error } = useIssue();

  const busy = phase === "building" || phase === "signing" || phase === "pending";
  const done = phase === "accepted";
  const pending = phase === "pending";
  const failed = phase === "failed" || phase === "rejected" || phase === "error";
  const onChainId = txId && txId.startsWith("at1") ? txId : null;
  const ready = DEMO_MODE || REAL_MODE || connected;

  return (
    <section className="section" id="issue">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">第 1 步 · 领取凭证</span>
          <h2>
            {REAL_MODE ? "把一张私密会员凭证签发上链" : "把一张私密会员凭证签发到你的钱包"}
          </h2>
          <p className="lede">
            凭证以加密 record 形式存在——<strong>只有持有者能解密</strong>。
            {REAL_MODE
              ? "实时模式由服务器演示账户代签并自发自持，点击即真实广播到测试网。"
              : "本 demo 你既是发证方也是持有者(自发自持)。"}
          </p>
        </div>

        <div className={`panel ${styles.panel}`}>
          {!ready && (
            <div className={styles.connect}>
              <span>先连接钱包再签发：</span>
              <WalletButton />
            </div>
          )}

          <div className={styles.form}>
            <div className="field">
              <label htmlFor="issuer">发证方</label>
              <input
                id="issuer"
                value={issuerName}
                onChange={(e) => setIssuerName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="tier">等级 (tier)</label>
              <select
                id="tier"
                value={tier}
                onChange={(e) => setTier(Number(e.target.value))}
              >
                {TIERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} · {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="validity">有效期(天)</label>
              <input
                id="validity"
                type="number"
                min={1}
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className="btn btn--primary"
              disabled={busy || (!ready && !DEMO_MODE)}
              onClick={() => issue({ issuerName, tier, validityDays })}
            >
              {busy ? PHASE_LABEL[phase] : `签发 ${tierLabel(tier)} 凭证 →`}
            </button>

            {phase !== "idle" && (
              <div
                className={`${styles.status} ${done ? styles.ok : ""} ${
                  failed ? styles.bad : ""
                }`}
              >
                <span>{PHASE_LABEL[phase] ?? phase}</span>
                {onChainId ? (
                  <a
                    href={`${EXPLORER_TX}/${onChainId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mono"
                  >
                    {short(onChainId)} ↗
                  </a>
                ) : (
                  txId && <span className={`mono ${styles.dim}`}>{short(txId)}</span>
                )}
                {error && <span className={styles.err}>{error}</span>}
                {(done || failed || pending) && (
                  <button className="btn btn--ghost btn--sm" onClick={reset}>
                    再签一张
                  </button>
                )}
              </div>
            )}
          </div>

          {done && (
            <p className={styles.next}>
              ✓ 凭证已上链。去<a href="#gate"> 第 2 步 </a>用它过门禁——
              证明你够格，但不暴露任何细节。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
