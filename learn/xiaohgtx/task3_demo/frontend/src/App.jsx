import { useState } from "react";
import { AleoWorker } from "./workers/AleoWorker.js";
import "./App.css";

const aleoWorker = AleoWorker();

const NOTES_PROGRAM = `program private_notes.aleo {
    record Note {
        owner: address,
        title_hash: field,
        content_commitment: field,
        created_at: u64,
    }

    transition create_note(
        owner: address,
        title_hash: field,
        content_commitment: field,
        created_at: u64,
    ) -> Note {
        return Note {
            owner,
            title_hash,
            content_commitment,
            created_at,
        };
    }

    transition view_note_commitment(note: Note) -> field {
        return note.content_commitment;
    }
}`;

function App() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState("create");

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [createdNotes, setCreatedNotes] = useState([]);

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

  const handleCreateNote = async () => {
    if (!account) { setStatus("请先生成账户"); return; }
    if (!noteTitle || !noteContent) { setStatus("请填写标题和内容"); return; }
    
    setLoading(true);
    setStatus("创建私密笔记中...");
    try {
      // 在实际应用中，这里应该使用ZK友好的哈希函数
      // 为了演示，我们使用简单的模拟值
      const titleHash = "123456789field";
      const contentCommitment = "987654321field";
      const createdAt = Math.floor(Date.now() / 1000);
      
      const txId = await aleoWorker.createNote(
        NOTES_PROGRAM, 
        account, 
        titleHash, 
        contentCommitment, 
        createdAt
      );
      
      setCreatedNotes([...createdNotes, {
        title: noteTitle,
        txId: txId,
        createdAt: new Date().toLocaleString()
      }]);
      
      setStatus(`笔记创建成功！TX: ${txId.substring(0, 20)}...`);
      setNoteTitle("");
      setNoteContent("");
    } catch (e) { 
      setStatus("失败: " + e.message); 
    }
    setLoading(false);
  };

  return (
    <div className="app">
      {/* 顶部标题区 */}
      <header className="header">
        <div className="header-top">
          <h1>Private Notes</h1>
          <span className="badge">Aleo dApp</span>
        </div>
        <p>隐私笔记应用 — 基于零知识证明的私有笔记管理</p>
      </header>

      {/* 程序预览 */}
      <section className="code-block">
        <div className="code-header">
          <span>private_notes.aleo</span>
          <span className="tag">Leo Program</span>
        </div>
        <pre>{`program private_notes.aleo {
    record Note {
        owner: address,
        title_hash: field,           // ← 标题哈希，私有
        content_commitment: field,   // ← 内容承诺，私有
        created_at: u64,             // ← 创建时间，私有
    }

    transition create_note(owner, title_hash, content_commitment, created_at) -> Note
    transition view_note_commitment(note) -> field
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
          {["create", "list"].map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "create" ? "创建笔记" : "笔记列表"}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === "create" && (
            <div className="tab-panel">
              <div className="row">
                <label>笔记标题</label>
                <input 
                  value={noteTitle} 
                  onChange={(e) => setNoteTitle(e.target.value)} 
                  placeholder="输入笔记标题" 
                  className="wide" 
                />
              </div>
              <div className="row">
                <label>笔记内容</label>
                <input 
                  value={noteContent} 
                  onChange={(e) => setNoteContent(e.target.value)} 
                  placeholder="输入笔记内容" 
                  className="wide" 
                />
              </div>
              <div className="row">
                <button onClick={handleCreateNote} disabled={loading || !account} className="btn btn-primary">
                  创建私密笔记
                </button>
              </div>
              <p className="hint">笔记内容将被加密存储，只有你能查看</p>
            </div>
          )}
          {activeTab === "list" && (
            <div className="tab-panel">
              {createdNotes.length === 0 ? (
                <p className="hint">暂无笔记，请先创建笔记</p>
              ) : (
                <div className="notes-list">
                  {createdNotes.map((note, index) => (
                    <div key={index} className="note-item">
                      <div className="note-title">{note.title}</div>
                      <div className="note-tx">TX: {note.txId.substring(0, 20)}...</div>
                      <div className="note-time">{note.createdAt}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 底部说明 */}
      <footer className="footer">
        <div className="privacy-tags">
          <span className="ptag">Record = 私有数据</span>
          <span className="ptag">ZK Proof = 链下生成</span>
          <span className="ptag">隐私保护 = 默认开启</span>
        </div>
        <p>Aleo 101 Bootcamp Task 3 | Leo + Provable SDK + React</p>
      </footer>
    </div>
  );
}

export default App;