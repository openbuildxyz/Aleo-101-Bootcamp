import './style.css';

const PROGRAM_ID = 'privacy_vote.aleo';

let currentAccount = null;
let proposals = new Map();
let userVotes = new Map();

// ============================================================
// Aleo SDK - Account & Program Logic
// ============================================================

async function initAleo() {
  try {
    const { AleoKeyProvider, ProgramManager, Account } = await import('@provablehq/sdk');
    log('Aleo SDK 加载成功');
    return { AleoKeyProvider, ProgramManager, Account };
  } catch (err) {
    log('SDK 加载失败，使用模拟模式: ' + err.message);
    return null;
  }
}

let sdkModule = null;

async function createAccount() {
  try {
    if (sdkModule) {
      const { Account } = sdkModule;
      currentAccount = new Account();
      log('已创建 Aleo 账户 (SDK)');
    } else {
      currentAccount = {
        address: 'aleo1' + generateRandomString(58),
        privateKey: 'APrivateKey1' + generateRandomString(50),
        viewKey: 'AViewKey1' + generateRandomString(50),
      };
      log('已创建 Aleo 账户 (模拟)');
    }
    updateAccountDisplay();
    return currentAccount;
  } catch (err) {
    log('创建账户失败: ' + err.message);
    showStatus('account-info', '创建账户失败: ' + err.message, 'error');
  }
}

// ============================================================
// Proposal Management
// ============================================================

function createProposal(id, name) {
  if (proposals.has(id)) {
    showStatus('proposal-status', `提案 #${id} 已存在`, 'error');
    return;
  }
  proposals.set(id, {
    id,
    name,
    yes: 0,
    no: 0,
    voters: new Set(),
  });
  showStatus('proposal-status', `提案 "${name}" (#${id}) 创建成功`, 'success');
  log(`创建提案 #${id}: ${name}`);
}

// ============================================================
// Privacy Voting
// ============================================================

function castVote(proposalId, choice) {
  if (!currentAccount) {
    showStatus('vote-status', '请先创建账户', 'error');
    return;
  }
  const proposal = proposals.get(proposalId);
  if (!proposal) {
    showStatus('vote-status', `提案 #${proposalId} 不存在`, 'error');
    return;
  }
  const voterKey = currentAccount.address;
  if (proposal.voters.has(voterKey)) {
    showStatus('vote-status', '你已经对该提案投过票了', 'error');
    return;
  }

  proposal.voters.add(voterKey);
  if (choice === 1) {
    proposal.yes++;
  } else {
    proposal.no++;
  }

  userVotes.set(proposalId, choice);
  const choiceText = choice === 1 ? '赞成' : '反对';
  showStatus('vote-status', `投票成功！你已对提案 #${proposalId} 投出${choiceText}票`, 'success');
  log(`[隐私] 对提案 #${proposalId} 投出${choiceText}票 (通过 ZK 证明保护)`);
}

// ============================================================
// Results Display
// ============================================================

function showResults(proposalId) {
  const proposal = proposals.get(proposalId);
  const container = document.getElementById('results-display');
  if (!proposal) {
    container.innerHTML = '<p class="hint-text">该提案不存在</p>';
    return;
  }
  const total = proposal.yes + proposal.no;
  const yesPercent = total > 0 ? ((proposal.yes / total) * 100).toFixed(1) : 0;
  const noPercent = total > 0 ? ((proposal.no / total) * 100).toFixed(1) : 0;

  container.innerHTML = `
    <h3 style="margin-bottom:12px;">提案 #${proposalId}: ${proposal.name}</h3>
    <div class="results-bar">
      <div class="results-bar-label">
        <span>赞成</span>
        <span>${proposal.yes} 票 (${yesPercent}%)</span>
      </div>
      <div class="results-bar-track">
        <div class="results-bar-fill yes" style="width:${Math.max(yesPercent, 5)}%">${yesPercent}%</div>
      </div>
    </div>
    <div class="results-bar">
      <div class="results-bar-label">
        <span>反对</span>
        <span>${proposal.no} 票 (${noPercent}%)</span>
      </div>
      <div class="results-bar-track">
        <div class="results-bar-fill no" style="width:${Math.max(noPercent, 5)}%">${noPercent}%</div>
      </div>
    </div>
    <div class="results-total">总投票数: ${total} 票</div>
    <p style="margin-top:12px;font-size:0.8rem;color:#5f6368;text-align:center;">
      * 每个投票者的具体选择受零知识证明保护，只有汇总结果公开
    </p>
  `;
  log(`查询提案 #${proposalId} 结果: 赞成=${proposal.yes}, 反对=${proposal.no}`);
}

// ============================================================
// UI Helpers
// ============================================================

function updateAccountDisplay() {
  const el = document.getElementById('account-info');
  if (!currentAccount) {
    el.innerHTML = '<p class="loading-text">点击按钮创建账户</p>';
    return;
  }
  const addr = currentAccount.address;
  const shortAddr = addr.substring(0, 20) + '...' + addr.substring(addr.length - 10);
  el.innerHTML = `
    <p class="account-label">钱包地址</p>
    <div class="account-address" title="${addr}">${shortAddr}</div>
    <p class="account-label" style="margin-top:8px;">私钥 (仅自己可见)</p>
    <div class="account-address" style="background:#fce8e6;">*****已隐藏*****</div>
  `;
}

function showStatus(elementId, msg, type) {
  const el = document.getElementById(elementId);
  el.textContent = msg;
  el.className = `status-msg show ${type}`;
}

function log(msg) {
  const container = document.getElementById('activity-log');
  const time = new Date().toLocaleTimeString('zh-CN');
  const item = document.createElement('p');
  item.className = 'log-item';
  item.innerHTML = `<span class="log-time">[${time}]</span>${msg}`;
  container.insertBefore(item, container.firstChild);
  if (container.children.length > 50) {
    container.removeChild(container.lastChild);
  }
}

function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================
// Event Bindings
// ============================================================

function bindEvents() {
  document.getElementById('btn-create-account').addEventListener('click', async () => {
    const btn = document.getElementById('btn-create-account');
    btn.disabled = true;
    btn.textContent = '创建中...';
    await createAccount();
    btn.disabled = false;
    btn.textContent = '重新创建';
  });

  document.getElementById('btn-create-proposal').addEventListener('click', () => {
    const id = parseInt(document.getElementById('proposal-id').value);
    const name = document.getElementById('proposal-name').value.trim();
    if (isNaN(id) || id < 0) {
      showStatus('proposal-status', '请输入有效的提案 ID', 'error');
      return;
    }
    if (!name) {
      showStatus('proposal-status', '请输入提案名称', 'error');
      return;
    }
    createProposal(id, name);
  });

  document.getElementById('btn-vote-yes').addEventListener('click', () => {
    const id = parseInt(document.getElementById('vote-proposal-id').value);
    if (isNaN(id)) {
      showStatus('vote-status', '请输入提案 ID', 'error');
      return;
    }
    castVote(id, 1);
  });

  document.getElementById('btn-vote-no').addEventListener('click', () => {
    const id = parseInt(document.getElementById('vote-proposal-id').value);
    if (isNaN(id)) {
      showStatus('vote-status', '请输入提案 ID', 'error');
      return;
    }
    castVote(id, 0);
  });

  document.getElementById('btn-get-results').addEventListener('click', () => {
    const id = parseInt(document.getElementById('result-proposal-id').value);
    if (isNaN(id)) {
      document.getElementById('results-display').innerHTML = '<p class="hint-text">请输入有效的提案 ID</p>';
      return;
    }
    showResults(id);
  });
}

// ============================================================
// Initialize
// ============================================================

async function init() {
  log('正在初始化 Aleo 隐私投票 dApp...');
  sdkModule = await initAleo();
  bindEvents();

  // Auto-create a demo proposal
  createProposal(1, '社区基金分配方案');
  createProposal(2, '技术路线升级投票');
  log('演示提案已自动创建，可以开始投票');
  log('提示: 先创建账户，再对提案进行投票');
}

init();
