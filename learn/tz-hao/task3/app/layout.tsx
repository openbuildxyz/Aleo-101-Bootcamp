import type { Metadata } from "next";
import "@demox-labs/aleo-wallet-adapter-reactui/dist/styles.css";
import "./globals.css";
import { AleoWalletProvider } from "@/components/aleo-wallet-provider";

export const metadata: Metadata = {
  title: "PrivateResume",
  description: "Private resume qualification on Aleo"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AleoWalletProvider>{children}</AleoWalletProvider>
      </body>
    </html>
  );
}
