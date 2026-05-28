import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@demox-labs/aleo-wallet-adapter-base",
    "@demox-labs/aleo-wallet-adapter-react",
    "@demox-labs/aleo-wallet-adapter-reactui",
    "aleo-adapters"
  ],
  turbopack: {
    root: projectRoot
  }
};

export default nextConfig;
