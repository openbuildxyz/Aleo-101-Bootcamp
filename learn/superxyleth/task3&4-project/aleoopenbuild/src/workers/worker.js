import {
  Account,
  ProgramManager,
  PrivateKey,
  initThreadPool,
  AleoKeyProvider,
  AleoNetworkClient,
  NetworkRecordProvider,
} from "@provablehq/sdk";
import { expose, proxy } from "comlink";

await initThreadPool();

const DEFAULT_RECIPIENT =
  "aleo1uvy6a326zq5gm65nc863jq2h062qu49txd85hzlc9z9u57x6ugxqg2hwhf";
const DEFAULT_NETWORK_URL = "https://api.provable.com/v2";

function creditsToMicrocreditsLiteral(amountCredits) {
  const value = String(amountCredits ?? "").trim();

  if (!/^\d+(\.\d{1,6})?$/.test(value)) {
    throw new Error("Amount must be a positive credit value with up to 6 decimals.");
  }

  const [wholeCredits, fractionalCredits = ""] = value.split(".");
  const microcredits =
    BigInt(wholeCredits) * 1_000_000n +
    BigInt(fractionalCredits.padEnd(6, "0"));

  if (microcredits <= 0n) {
    throw new Error("Amount must be greater than 0.");
  }

  return `${microcredits}u64`;
}

function optionalTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function localProgramExecution(program, aleoFunction, inputs) {
  const programManager = new ProgramManager();

  // Create a temporary account for the execution of the program
  const account = new Account();
  programManager.setAccount(account);

  const executionResponse = await programManager.run(
    program,
    aleoFunction,
    inputs,
    false,
  );
  return executionResponse.getOutputs();
}

async function getPrivateKey() {
  const key = new PrivateKey();
  return proxy(key);
}

async function deployProgram(program) {
  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache(true);

  // Create a record provider that will be used to find records and transaction data for Aleo programs
  const networkClient = new AleoNetworkClient("https://api.provable.com/v2");

  // Use existing account with funds
  const account = new Account({
    privateKey: "user1PrivateKey",
  });

  const recordProvider = new NetworkRecordProvider(account, networkClient);

  // Initialize a program manager to talk to the Aleo network with the configured key and record providers
  const programManager = new ProgramManager(
    "https://api.provable.com/v2",
    keyProvider,
    recordProvider,
  );

  programManager.setAccount(account);

  // Define a fee to pay to deploy the program
  const fee = 1.9; // 1.9 Aleo credits

  // Deploy the program to the Aleo network
  const tx_id = await programManager.deploy(program, fee);

  // Optional: Pass in fee record manually to avoid long scan times
  // const feeRecord = "{  owner: aleo1xxx...xxx.private,  microcredits: 2000000u64.private,  _nonce: 123...789group.public}";
  // const tx_id = await programManager.deploy(program, fee, undefined, feeRecord);

  return tx_id;
}

async function delegatePublicTransfer({
  privateKey,
  amountCredits,
  priorityFeeCredits = 0,
  networkUrl = DEFAULT_NETWORK_URL,
  proverUrl,
  apiKey,
  consumerId,
  broadcast = true,
}) {
  const senderPrivateKey = optionalTrim(privateKey);
  if (!senderPrivateKey) {
    throw new Error("Sender private key is required.");
  }

  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache(true);

  const networkClient = new AleoNetworkClient(networkUrl);
  const account = new Account({ privateKey: senderPrivateKey });
  networkClient.setAccount(account);

  const recordProvider = new NetworkRecordProvider(account, networkClient);
  const programManager = new ProgramManager(networkUrl, keyProvider, recordProvider);
  programManager.setAccount(account);

  const provingRequest = await programManager.provingRequest({
    programName: "credits.aleo",
    functionName: "transfer_public",
    priorityFee: Number(priorityFeeCredits) || 0,
    privateFee: false,
    privateKey: account.privateKey(),
    inputs: [DEFAULT_RECIPIENT, creditsToMicrocreditsLiteral(amountCredits)],
    broadcast,
  });

  const result = await networkClient.submitProvingRequestSafe({
    provingRequest,
    url: optionalTrim(proverUrl) || undefined,
    apiKey: optionalTrim(apiKey) || undefined,
    consumerId: optionalTrim(consumerId) || undefined,
  });

  if (!result.ok) {
    throw new Error(
      `Delegated proving failed (${result.status}): ${result.error.message}`,
    );
  }

  return {
    sender: account.address().to_string(),
    recipient: DEFAULT_RECIPIENT,
    transactionId: result.data.transaction?.id,
    transaction: result.data.transaction,
    broadcastResult: result.data.broadcast_result,
  };
}

async function getPublicTransferAccountStatus({
  privateKey,
  networkUrl = DEFAULT_NETWORK_URL,
}) {
  const senderPrivateKey = optionalTrim(privateKey);
  if (!senderPrivateKey) {
    throw new Error("Sender private key is required.");
  }

  const account = new Account({ privateKey: senderPrivateKey });
  const networkClient = new AleoNetworkClient(networkUrl);
  const address = account.address().to_string();
  const balanceMicrocredits = await networkClient.getPublicBalance(address);

  return {
    address,
    balanceMicrocredits: Number(balanceMicrocredits),
    balanceCredits: Number(balanceMicrocredits) / 1_000_000,
  };
}

const workerMethods = {
  localProgramExecution,
  getPrivateKey,
  deployProgram,
  delegatePublicTransfer,
  getPublicTransferAccountStatus,
};
expose(workerMethods);
