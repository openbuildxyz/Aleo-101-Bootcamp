"use client";

import { useCallback, useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { PROGRAM_ID, ISSUE_FEE_MICROCREDITS } from "@/lib/constants";
import { nameToField, randomFieldValue, toField, currentEpoch } from "@/lib/field";
import { DEMO_MODE, REAL_MODE, DEMO_TX_ID, sleep } from "@/lib/demo";
import { getServerAddress, executeReal } from "@/lib/realExec";
import { addCred } from "@/lib/credStore";
import { pollTransaction, terminalPhase, type TxPhase } from "@/lib/txpoll";

export type IssueInput = {
  issuerName: string;
  tier: number;
  validityDays: number;
};

export type IssueResult = {
  issuerField: string;
  secret: string;
  expiry: number;
};

export function useIssue() {
  const { connected, address, executeTransaction, transactionStatus } =
    useWallet();
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [txId, setTxId] = useState<string | null>(null);
  const [result, setResult] = useState<IssueResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setTxId(null);
    setResult(null);
    setError(null);
  }, []);

  const issue = useCallback(
    async ({ issuerName, tier, validityDays }: IssueInput) => {
      setError(null);
      setTxId(null);
      try {
        setPhase("building");
        const issuerField = await nameToField(issuerName);
        const secret = randomFieldValue();
        const expiry = currentEpoch() + validityDays;
        setResult({ issuerField, secret, expiry });

        if (REAL_MODE) {
          // The server signs with its .env key; the credential is minted to
          // that same account (self-issued for the demo).
          const holder = await getServerAddress();
          setPhase("pending"); // local ZK proving + broadcast (~1 min)
          const { txId: id, record } = await executeReal("issue", [
            holder,
            toField(issuerField),
            `${tier}u8`,
            `${expiry}u32`,
            toField(secret),
          ]);
          setTxId(id);
          if (record) {
            addCred({ record, tier, issuerField, issuerName, expiry, txId: id });
          }
          setPhase("accepted");
          return;
        }

        if (DEMO_MODE) {
          setPhase("signing");
          await sleep(900);
          setTxId(DEMO_TX_ID);
          setPhase("pending");
          await sleep(1300);
          setPhase("accepted");
          return;
        }

        if (!connected || !address) {
          setError("请先连接钱包");
          setPhase("idle");
          return;
        }

        setPhase("signing");
        const opts = {
          program: PROGRAM_ID,
          function: "issue",
          // issue(holder: address, issuer: field, tier: u8, expiry: u32, secret: field)
          inputs: [
            address,
            toField(issuerField),
            `${tier}u8`,
            `${expiry}u32`,
            toField(secret),
          ],
          fee: ISSUE_FEE_MICROCREDITS,
        };
        console.log("[issue] executeTransaction →", opts);
        const res = await executeTransaction(opts);
        console.log("[issue] result →", res);
        const id = res?.transactionId;
        if (!id) {
          setPhase("rejected");
          setError("钱包未返回交易 id(已取消?)");
          return;
        }
        setTxId(id);
        setPhase("pending");
        const { status } = await pollTransaction(transactionStatus, id, (oc) =>
          setTxId(oc),
        );
        setPhase(terminalPhase(status));
      } catch (e) {
        console.error("[issue] error →", e);
        setPhase("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [connected, address, executeTransaction, transactionStatus],
  );

  return { issue, reset, phase, txId, result, error };
}
