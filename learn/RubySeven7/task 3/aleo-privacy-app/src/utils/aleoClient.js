const generateRandomAddress = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let address = 'aleo1';
  for (let i = 0; i < 58; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
};

const generatePrivateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 64; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
};

export const createAccount = () => {
  return {
    address: generateRandomAddress(),
    privateKey: generatePrivateKey(),
    viewKey: generatePrivateKey()
  };
};

export const getBalance = async (address) => {
  return (Math.random() * 10).toFixed(4);
};

export const executeVote = async (account, candidateAddress) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    hash: 'tx_' + generateRandomAddress().substring(0, 32),
    status: 'success',
    type: 'execute'
  };
};

export const getVoteState = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    votes: {},
    total_votes: Math.floor(Math.random() * 100)
  };
};

export const getLatestBlock = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    height: Math.floor(Math.random() * 100000),
    hash: 'block_' + generateRandomAddress().substring(0, 16)
  };
};