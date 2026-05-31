"use client";

import { useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { GATES, DEMO_ISSUER_NAME, EXPLORER_TX, tierLabel } from "@/lib/constants";
import { DEMO_MODE, REAL_MODE } from "@/lib/demo";
import { useCredentials } from "@/hooks/useCredentials";
import { useProveAccess } from "@/hooks/useProveAccess";
import { WalletButton } from "@/components/wallet/WalletButton";
import { GateCard } from "./GateCard";
import styles from "./GatePanel.module.css";

const PHASE_LABEL: Record<string, string> = {
  building: "构造证明…",
  signing: "等待钱包签名…",
  pending: REAL_MODE
    ? "本地零知识出证 + 广播上链中（约 1 分钟，请稍候）…"
    : "已提交，钱包出证 + 链上确认中…",
  accepted: "通行已记录上链",
  failed: "交易失败",
  rejected: "已取消",
  error: "出错",
};

function short(v: string, n = 10) {
  return v.length > n * 2 ? `${v.slice(0, n)}…${v.slice(-6)}` : v;
}

export function GatePanel() {
  const { connected } = useWallet();
  const { creds, load, loading, loaded, error: credErr } = useCredentials();
  const { prove, reset, phase, txId, error: proveErr } = useProveAccess();
  const [gateIdx, setGateIdx] = useState(1); // default VIP Lounge
  const [selected, setSelected] = useState<number | null>(null);
  // Optimistic per-gate pass count (so a successful pass shows up immediately;
  // in DEMO_MODE nothing hits the chain, so this is what makes the counter move).
  const [bumps, setBumps] = useState<Record<string, number>>({});

  const gate = GATES[gateIdx];
  const ready = DEMO_MODE || REAL_MODE || connected;
  const sel = selected != null ? creds[selected] : null;
  const credTier = sel?.tier ?? null;
  const eligible = sel ? sel.tier == null || sel.tier >= gate.minTier : false;

  const busy = phase === "building" || phase === "signing" || phase === "pending";
  const done = phase === "accepted";
  const pending = phase === "pending";
  const failed = phase === "failed" || phase === "rejected" || phase === "error";
  const onChainId = txId && txId.startsWith("at1") ? txId : null;

  return (
    <section className="section" id="gate">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">第 2 步 · 过门禁</span>
          <h2>证明你够格——而不暴露任何细节</h2>
          <p className="lede">
            同一张凭证、不同门槛的门禁：选一个门禁，向它证明你满足要求。链上只留下
            「一个合法会员通过了」+ 一个不可关联的 nullifier。
          </p>
        </div>

        {/* gate picker */}
        <div className={styles.gates}>
          {GATES.map((g, i) => (
            <GateCard
              key={g.name}
              gate={g}
              selected={i === gateIdx}
              onSelect={() => {
                setGateIdx(i);
                reset();
              }}
              credTier={credTier}
              bump={bumps[g.name] || 0}
            />
          ))}
        </div>

        {/* prove flow */}
        <div className={`panel ${styles.action}`}>
          <div className={styles.gateLine}>
            正在通行 <b>{gate.emoji} {gate.name}</b> · 要求{" "}
            <span className="tag tag--private">
              {DEMO_ISSUER_NAME} · tier ≥ {gate.minTier}（{tierLabel(gate.minTier)}）
            </span>
          </div>

          {!ready ? (
            <div className={styles.connect}>
              <span>连接钱包以读取你的私密凭证：</span>
              <WalletButton />
            </div>
          ) : (
            <>
              <div className={styles.toolbar}>
                <button className="btn btn--sm" onClick={load} disabled={loading}>
                  {loading ? "解密中…" : loaded ? "刷新凭证" : "加载我的凭证"}
                </button>
                {loaded && (
                  <span className={styles.count}>
                    {creds.length} 张（{REAL_MODE ? "本会话签发的私密 record" : "钱包内解密"}）
                  </span>
                )}
              </div>
              {credErr && <p className={styles.err}>{credErr}</p>}

              {loaded && creds.length === 0 && !credErr && (
                <p className={styles.hint}>
                  还没有凭证——回<a href="#issue"> 第 1 步 </a>先签发一张。
                </p>
              )}

              <div className={styles.list}>
                {creds.map((c, i) => {
                  const ok = c.tier == null || c.tier >= gate.minTier;
                  return (
                    <button
                      key={i}
                      className={`${styles.cred} ${selected === i ? styles.credSel : ""}`}
                      onClick={() => {
                        setSelected(i);
                        reset();
                      }}
                    >
                      <span className={styles.credTier}>
                        {c.tier != null ? `${tierLabel(c.tier)} · tier ${c.tier}` : "tier ?"}
                      </span>
                      <span className={styles.credMeta}>
                        issuer {c.issuer ? short(c.issuer, 6) : "—"} · 仅你可见
                      </span>
                      <span className={ok ? styles.okBadge : styles.noBadge}>
                        {ok ? "够格" : "不够格"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {sel && (
                <div className={styles.proveRow}>
                  <button
                    className="btn btn--primary"
                    disabled={busy || !eligible}
                    onClick={async () => {
                      const ok = await prove({
                        credentialPlaintext: sel.plaintext,
                        issuerName: DEMO_ISSUER_NAME,
                        minTier: gate.minTier,
                        gateName: gate.name,
                      });
                      if (ok) {
                        setBumps((b) => ({
                          ...b,
                          [gate.name]: (b[gate.name] || 0) + 1,
                        }));
                      }
                    }}
                  >
                    {busy
                      ? PHASE_LABEL[phase]
                      : eligible
                        ? `生成通行证明（证明 tier ≥ ${gate.minTier}）→`
                        : `该凭证不满足 ${gate.name}`}
                  </button>
                </div>
              )}

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
                  {proveErr && <span className={styles.err}>{proveErr}</span>}
                  {(done || failed || pending) && (
                    <button className="btn btn--ghost btn--sm" onClick={reset}>
                      再过一次
                    </button>
                  )}
                </div>
              )}

              {done && (
                <div className={styles.reveal}>
                  <p>
                    ✓ <b>{gate.name}</b> <strong>知道</strong>：有一个 {DEMO_ISSUER_NAME}{" "}
                    的 tier ≥ {gate.minTier} 合法会员通过了，计数 +1。
                  </p>
                  <p className={styles.hidden}>
                    它<strong>不知道</strong>：你是谁、你的真实等级、这是不是你第二次来。
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
