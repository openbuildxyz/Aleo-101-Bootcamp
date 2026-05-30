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

const NETWORK_URL = "https://api.explorer.provable.com/v1";

/**
 * 本地执行程序（不需要链上交易）
 */
async function localProgramExecution(program, aleoFunction, inputs) {
  const programManager = new ProgramManager();
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

/**
 * 生成新的 Aleo 账户
 */
async function generateAccount() {
  const key = new PrivateKey();
  return proxy(key);
}

/**
 * 从私钥导入账户
 */
async function getAccountFromKey(privateKeyStr) {
  const key = new PrivateKey(privateKeyStr);
  const account = new Account({ privateKey: key });
  return proxy(account);
}

/**
 * 创建私密笔记
 */
async function createNote(program, privateKeyStr, titleHash, contentCommitment, createdAt) {
  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache(true);

  const networkClient = new AleoNetworkClient(NETWORK_URL);
  const account = new Account({ privateKey: privateKeyStr });
  const recordProvider = new NetworkRecordProvider(account, networkClient);

  const programManager = new ProgramManager(
    NETWORK_URL,
    keyProvider,
    recordProvider,
  );
  programManager.setAccount(account);

  const tx_id = await programManager.execute(
    program,
    "create_note",
    0.05,
    false,
    [account.address().to_string(), titleHash, contentCommitment, `${createdAt}u64`],
  );
  return tx_id;
}

const workerMethods = {
  localProgramExecution,
  generateAccount,
  getAccountFromKey,
  createNote,
};
expose(workerMethods);