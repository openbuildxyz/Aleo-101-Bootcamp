import React, { useMemo } from "react";
import ReactDOM from "react-dom/client";
import { WalletProvider } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/aleo-wallet-adapter-reactui";
import {
  DecryptPermission,
  WalletAdapterNetwork,
} from "@demox-labs/aleo-wallet-adapter-base";
import {
  LeoWalletAdapter,
  PuzzleWalletAdapter,
  FoxWalletAdapter,
  SoterWalletAdapter,
} from "aleo-adapters";
import App from "./App";
import "./index.css";
import "@demox-labs/aleo-wallet-adapter-reactui/styles.css";

const APP_NAME = "Aleo Anonymous Voting Demo";

function Root() {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({ appName: APP_NAME }),
      new PuzzleWalletAdapter({
        programIdPermissions: {
          [WalletAdapterNetwork.TestnetBeta]: ["vote.aleo"],
        },
        appName: APP_NAME,
        appDescription: "Privacy-preserving voting on Aleo testnet.",
        appIconUrl: "",
      }),
      new FoxWalletAdapter({ appName: APP_NAME }),
      new SoterWalletAdapter({ appName: APP_NAME }),
    ],
    [],
  );

  return (
    <React.StrictMode>
      <WalletProvider
        wallets={wallets}
        network={WalletAdapterNetwork.TestnetBeta}
        decryptPermission={DecryptPermission.UponRequest}
        programs={["vote.aleo"]}
        autoConnect
      >
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Root />,
);
