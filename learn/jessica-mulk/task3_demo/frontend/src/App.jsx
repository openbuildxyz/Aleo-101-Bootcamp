import { useState } from "react";
import { AleoWorker } from "./workers/AleoWorker.js";
import "./App.css";

const aleoWorker = AleoWorker();

const CREDENTIAL_PROGRAM = `program credential.aleo {
    record Credential {
        owner: address,
        credential_id: field,
        score: u64,
    }

    mapping credential_counts: address => u64;

    fn mint(
        public credential_id: field,
        public score: u64,
    ) -> (Credential, Final) {
        let new_credential: Credential = Credential {
            owner: self.caller,
            credential_id,
            score,
        };
        return (new_credential, final {
            let current: u64 = Mapping::get_or_use(credential_counts, self.caller, 0u64);
            Mapping::set(credential_counts, self.caller, current + 1u64);
        });
    }

    fn share(
        credential: Credential,
        public to: address,
        public new_credential_id: field,
    ) -> (Credential, Credential, Final) {
        let shared: Credential = Credential {
            owner: to,
            credential_id: new_credential_id,
            score: credential.score,
        };
        let record: Credential = Credential {
            owner: credential.owner,
            credential_id: credential.credential_id,
            score: 0u64,
        };
        return (shared, record, final {
            let receiver_count: u64 = Mapping::get_or_use(credential_counts, to, 0u64);
            Mapping::set(credential_counts, to, receiver_count + 1u64);
        });
    }

    fn get_count(public owner: address) -> u64 {
        return Mapping::get(credential_counts, owner);
    }

    @noupgrade
    constructor() {}
}`;

function App() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState("mint");

  const [score, setScore] = useState("100");
  const [shareTo, setShareTo] = useState("");
  const [queryAddress, setQueryAddress] = useState("");
  const [queryResult, setQueryResult] = useState(null);

  const handleGenerateAccount = async () => {
    setLoading(true);
    setStatus("生成账户中...");
    try {
      const key = await aleoWorker.generateAccount();
      const pk = await key.to_string();
      setAccount(pk);
      setStatus("账户已生成！");
    } catch (e) {
      setStatus("失败: " + e.message);
    }
    setLoading(false);
  };

  const handleMint = async () => {
    if (!account) { setStatus("请先生成账户"); return; }
    setLoading(true);
    setStatus("铸造凭证中...");
    try {
      const txId = await aleoWorker.mintCredential(CREDENTIAL_PROGRAM, account, "1field", parseInt(score));
      setStatus(`铸造成功！TX: ${txId.substring(0, 20)}...`);
    } catch (e) { setStatus("失败: " + e.message); }
    setLoading(false);
  };

  const handleShare = async () => {
    if (!account) { setStatus("请先生成账户"); return; }
    setLoading(true);
    setStatus("分享凭证中...");
    try {
      const txId = await aleoWorker.shareCredential(CREDENTIAL_PROGRAM, account, "", shareTo, "2field");
      setStatus(`分享成功！TX: ${txId.substring(0, 20)}...`);
    } catch (e) { setStatus("失败: " + e.message); }
    setLoading(false);
  };

  const handleQuery = async () => {
    if (!queryAddress) { setStatus("请输入地址"); return; }
    setLoading(true);
    setStatus("查询中...");
    setQueryResult(null);
    try {
      const result = await aleoWorker.localProgramExecution(CREDENTIAL_PROGRAM, "get_count", [queryAddress]);
      setQueryResult(result);
      setStatus("查询完成！");
    } catch (e) { setStatus("失败: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="app">
      {/* 顶部标题区 */}
      <header className="header">
        <div className="header-top">
          <h1>Private Credential Vault</h1>
          <span className="badge">Aleo dApp</span>
        </div>
        <p>隐私凭证保险库 — 基于零知识证明的私有凭证管理</p>
      </header>

      {/* 程序预览 */}
      <section className="code-block">
        <div className="code-header">
          <span>credential.aleo</span>
          <span className="tag">Leo Program</span>
        </div>
        <pre>{`program credential.aleo {
    record Credential {
        owner: address,
        credential_id: field,
        score: u64,            // ← 私有，仅拥有者可见
    }
    mapping credential_counts: address => u64;  // ← 公开，只存数量

    fn mint(credential_id, score) → Credential   // 铸造私有凭证
    fn share(credential, to, id) → (Credential, Credential) // 私密分享
    fn get_count(owner) → u64                    // 查询计数
}`}</pre>
      </section>

      {/* 操作面板 */}
      <section className="panel">
        <div className="panel-header">
          <div className="account-row">
            {account ? (
              <span className="account-addr">
                {account.substring(0, 12)}...{account.substring(account.length - 6)}
              </span>
            ) : (
              <button onClick={handleGenerateAccount} disabled={loading} className="btn btn-primary btn-sm">
                生成账户
              </button>
            )}
          </div>
          {status && <span className="status-text">{status}</span>}
        </div>

        <div className="tabs">
          {["mint", "share", "query"].map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "mint" ? "铸造凭证" : tab === "share" ? "分享凭证" : "查询计数"}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === "mint" && (
            <div className="tab-panel">
              <div className="row">
                <label>评分 (u64)</label>
                <input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="100" />
                <button onClick={handleMint} disabled={loading || !account} className="btn btn-primary">铸造</button>
              </div>
              <p className="hint">credential_id 自动使用 1field，评分仅你可见</p>
            </div>
          )}
          {activeTab === "share" && (
            <div className="tab-panel">
              <div className="row">
                <label>接收地址</label>
                <input value={shareTo} onChange={(e) => setShareTo(e.target.value)} placeholder="aleo1..." className="wide" />
              </div>
              <div className="row">
                <button onClick={handleShare} disabled={loading || !account} className="btn btn-primary">分享</button>
              </div>
              <p className="hint">原始凭证被消耗，生成全新 Record 给接收者</p>
            </div>
          )}
          {activeTab === "query" && (
            <div className="tab-panel">
              <div className="row">
                <label>地址</label>
                <input value={queryAddress} onChange={(e) => setQueryAddress(e.target.value)} placeholder="aleo1..." className="wide" />
                <button onClick={handleQuery} disabled={loading} className="btn">查询</button>
              </div>
              {queryResult !== null && (
                <div className="result">该地址拥有 <strong>{queryResult}</strong> 个凭证</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 底部说明 */}
      <footer className="footer">
        <div className="privacy-tags">
          <span className="ptag">Record = 私有数据</span>
          <span className="ptag">Mapping = 公开计数</span>
          <span className="ptag">ZK Proof = 链下生成</span>
        </div>
        <p>Aleo 101 Bootcamp Task 3 | Leo + Provable SDK + React</p>
      </footer>
    </div>
  );
}

export default App;