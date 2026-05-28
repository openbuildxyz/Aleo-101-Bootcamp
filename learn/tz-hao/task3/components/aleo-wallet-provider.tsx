"use client";

import { ReactNode, useMemo } from "react";
import { DecryptPermission, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import { WalletProvider } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/aleo-wallet-adapter-reactui";
import { FoxWalletAdapter, LeoWalletAdapter, PuzzleWalletAdapter, SoterWalletAdapter } from "aleo-adapters";
import { PROGRAM_ID } from "@/lib/aleo";

export function AleoWalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: "PrivateResume"
      }),
      new PuzzleWalletAdapter({
        programIdPermissions: {
          [WalletAdapterNetwork.TestnetBeta]: [PROGRAM_ID]
        },
        appName: "PrivateResume",
        appDescription: "Private resume qualification on Aleo Testnet",
        appIconUrl: ""
      }),
      new FoxWalletAdapter({
        appName: "PrivateResume"
      }),
      new SoterWalletAdapter({
        appName: "PrivateResume"
      })
    ],
    []
  );

  return (
    <WalletProvider
      wallets={wallets}
      network={WalletAdapterNetwork.TestnetBeta}
      decryptPermission={DecryptPermission.UponRequest}
      autoConnect
    >
      <WalletModalProvider>{children}</WalletModalProvider>
    </WalletProvider>
  );
}
