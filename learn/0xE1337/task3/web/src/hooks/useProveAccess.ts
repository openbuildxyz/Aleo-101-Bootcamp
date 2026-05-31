"use client";

import { useCallback, useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { PROGRAM_ID, PROVE_FEE_MICROCREDITS } from "@/lib/constants";
import { nameToField, toField, currentEpoch } from "@/lib/field";
import { DEMO_MODE, REAL_MODE, DEMO_TX_ID, sleep } from "@/lib/demo";
import { executeReal } from "@/lib/realExec";
import { pollTransaction, terminalPhase, type TxPhase } from "@/lib/txpoll";

export type ProveInput = {
  credentialPlaintext: string;
  issuerName: string;
  minTier: number;
  gateName: string;
};

export function useProveAccess() {
  const { connected, executeTransaction, transactionStatus } = useWallet();
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setTxId(null);
    setError(null);
  }, []);

  const prove = useCallback(
    async ({ credentialPlaintext, issuerName, minTier, gateName }: ProveInput) => {
      setError(null);
      setTxId(null);
      try {
        setPhase("building");
        const issuerField = await nameToField(issuerName);
        const gateField = await nameToField(gateName);
        const epoch = currentEpoch();

        if (REAL_MODE) {
          setPhase("pending"); // local ZK proving + broadcast (~1 min)
          const { txId: id } = await executeReal("prove_access", [
            credentialPlaintext,
            toField(issuerField),
            `${minTier}u8`,
            toField(gateField),
            `${epoch}u32`,
          ]);
          setTxId(id);
          setPhase("accepted");
          return true;
        }

        if (DEMO_MODE) {
          setPhase("signing");
          await sleep(900);
          setTxId(DEMO_TX_ID);
          setPhase("pending");
          await sleep(1300);
          setPhase("accepted");
          return true;
        }

        if (!connected) {
          setError("请先连接钱包");
          setPhase("idle");
          return false;
        }

        setPhase("signing");
        const opts = {
          program: PROGRAM_ID,
          function: "prove_access",
          // prove_access(cred: Credential, issuer_req: field, min_tier: u8, gate_id: field, epoch: u32)
          inputs: [
            credentialPlaintext,
            toField(issuerField),
            `${minTier}u8`,
            toField(gateField),
            `${epoch}u32`,
          ],
          fee: PROVE_FEE_MICROCREDITS,
        };
        console.log("[prove] executeTransaction →", opts);
        const res = await executeTransaction(opts);
        console.log("[prove] result →", res);
        const id = res?.transactionId;
        if (!id) {
          setPhase("rejected");
          setError("钱包未返回交易 id(已取消?)");
          return false;
        }
        setTxId(id);
        setPhase("pending");
        const { status } = await pollTransaction(transactionStatus, id, (oc) =>
          setTxId(oc),
        );
        setPhase(terminalPhase(status));
        return status === "accepted";
      } catch (e) {
        console.error("[prove] error →", e);
        setPhase("error");
        setError(e instanceof Error ? e.message : String(e));
        return false;
      }
    },
    [connected, executeTransaction, transactionStatus],
  );

  return { prove, reset, phase, txId, error };
}
