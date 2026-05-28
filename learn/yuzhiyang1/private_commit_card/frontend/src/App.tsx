import { useMemo, useState } from 'react';
import { buildLeoCommand, buildLeoInputFile, createCommitment } from './commitment';
import './styles.css';

const OWNER_ADDRESS = 'aleo1fymf85ullghvzd7av3ajhgfen0875kz9knq7tgna9hr2fswjqsfqxdtvze';

export default function App() {
  const [label, setLabel] = useState('学习 Aleo');
  const [note, setNote] = useState('我的第一张隐私承诺卡');
  const [createdAt, setCreatedAt] = useState(1_716_652_800);

  const commitment = useMemo(() => createCommitment(label, note), [label, note]);
  const leoCommand = useMemo(
    () => buildLeoCommand(OWNER_ADDRESS, commitment, createdAt),
    [commitment, createdAt],
  );
  const inputFile = useMemo(
    () => buildLeoInputFile(OWNER_ADDRESS, commitment, createdAt),
    [commitment, createdAt],
  );

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="隐私承诺卡工作区">
        <div className="editor-pane">
          <p className="eyebrow">Private Commit Card</p>
          <h1>隐私承诺卡</h1>

          <label className="field">
            <span>公开标签</span>
            <input value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>

          <label className="field">
            <span>私密内容</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={7} />
          </label>

          <label className="field">
            <span>创建时间戳</span>
            <input
              type="number"
              min="1"
              value={createdAt}
              onChange={(event) => setCreatedAt(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="result-pane">
          <div className="metric">
            <span>Label Hash</span>
            <code>{commitment.labelHash}</code>
          </div>
          <div className="metric">
            <span>Note Commitment</span>
            <code>{commitment.noteCommitment}</code>
          </div>
          <div className="metric">
            <span>Owner</span>
            <code>{OWNER_ADDRESS}</code>
          </div>
        </div>

        <div className="command-pane">
          <h2>Leo 命令</h2>
          <pre>{leoCommand}</pre>

          <h2>输入文件</h2>
          <pre>{inputFile}</pre>
        </div>
      </section>
    </main>
  );
}
