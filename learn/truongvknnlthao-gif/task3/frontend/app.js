const connectBtn = document.querySelector("#connectBtn");
const walletStatus = document.querySelector("#walletStatus");
const allocationForm = document.querySelector("#allocationForm");
const resultBox = document.querySelector("#resultBox");
const budgetText = document.querySelector("#budgetText");

let connected = false;

function connectDemoWallet() {
  connected = true;
  walletStatus.textContent = "已连接（演示模式）";
  connectBtn.textContent = "钱包已连接";
  resultBox.textContent = "钱包连接成功。现在可以输入私有资源分配并生成 Aleo 证明调用预览。";
}

function readAllocation() {
  const formData = new FormData(allocationForm);
  const owner = String(formData.get("address") || "").trim();
  const scout = Number(formData.get("scout") || 0);
  const shield = Number(formData.get("shield") || 0);
  const research = Number(formData.get("research") || 0);
  const lane = String(formData.get("lane") || "1");
  const total = scout + shield + research;
  return { owner, scout, shield, research, lane, total };
}

function updateBudget() {
  const { total } = readAllocation();
  budgetText.textContent = `Budget: ${total} / 10`;
  budgetText.classList.toggle("over", total > 10);
}

function generateAllocationPreview() {
  if (!connected) {
    resultBox.textContent = "请先连接钱包。真实 dApp 中这里会调用 Aleo wallet adapter。";
    return;
  }

  const { owner, scout, shield, research, lane, total } = readAllocation();

  if (!owner.startsWith("aleo1")) {
    resultBox.textContent = "请输入有效的 Aleo 地址。";
    return;
  }

  if (total > 10) {
    resultBox.textContent = `当前分配为 ${total}/10，超过预算。Leo 程序中的 assert(total <= 10u8) 会拒绝该证明。`;
    return;
  }

  const laneName = { "1": "Scout", "2": "Shield", "3": "Research" }[lane];
  const preview = {
    program: "private_allocation_demo.aleo",
    primaryFunction: "create_allocation",
    publicInputs: {
      owner,
    },
    privateInputs: {
      scout: `${scout}u8`,
      shield: `${shield}u8`,
      research: `${research}u8`,
    },
    publicRule: "scout + shield + research <= 10",
    output: "Allocation private record { owner, scout, shield, research }",
    selectiveReveal: {
      function: "reveal_lane",
      lane: `${lane}u8 (${laneName})`,
      description: "只公开一个选定 lane 的结果，不公开完整私有分配。",
    },
    realWorldMapping:
      "同一 proof pattern 可用于游戏隐藏策略、贷款预审、暗标竞价、供应商准入和企业预算合规。",
  };

  resultBox.textContent = JSON.stringify(preview, null, 2);
}

connectBtn.addEventListener("click", connectDemoWallet);
allocationForm.addEventListener("input", updateBudget);
allocationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  generateAllocationPreview();
});

updateBudget();

if (new URLSearchParams(window.location.search).get("autodemo") === "1") {
  connectDemoWallet();
  generateAllocationPreview();
}
