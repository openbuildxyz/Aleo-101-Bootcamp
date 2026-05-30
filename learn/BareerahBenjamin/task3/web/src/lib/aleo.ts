import { AleoNetworkClient } from "@provablehq/sdk";
import { WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";

export const PROGRAM_ID = "vote.aleo";
export const NETWORK_ENDPOINT = "https://api.explorer.provable.com/v1";
export const CHAIN_ID = WalletAdapterNetwork.TestnetBeta; // "testnetbeta"

export const networkClient = new AleoNetworkClient(NETWORK_ENDPOINT);

const TYPE_SUFFIX_RE = /(u8|u16|u32|u64|u128|i8|i16|i32|i64|i128|field|group|scalar)$/;

export function stripTypeSuffix(value: string): string {
  return value.replace(TYPE_SUFFIX_RE, "");
}

export function parseU64(value: string | null): number {
  if (value == null) return 0;
  const n = Number(stripTypeSuffix(value));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Read a single mapping value. Returns null when the key is absent.
 * Aleo's API returns type-suffixed strings ("3u64", "true", "aleo1..."), which we leave intact —
 * call parseU64 / stripTypeSuffix at the use site.
 */
export async function getMapping(
  mappingName: string,
  key: string,
): Promise<string | null> {
  try {
    const raw = await networkClient.getProgramMappingValue(
      PROGRAM_ID,
      mappingName,
      key,
    );
    if (raw == null) return null;
    return String(raw);
  } catch (err) {
    console.warn(`getMapping(${mappingName}, ${key}) failed:`, err);
    return null;
  }
}
