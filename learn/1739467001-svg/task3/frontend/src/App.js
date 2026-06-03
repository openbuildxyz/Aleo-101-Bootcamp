import React, { useState } from 'react';

function App() {
  const [account, setAccount] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteStatus, setVoteStatus] = useState('');
  const [votesA, setVotesA] = useState(0);
  const [votesB, setVotesB] = useState(0);
  const [tickets, setTickets] = useState([]);

  const connectWallet = async () => {
    try {
      // 尝试连接 Leo Wallet（实际环境）
      if (window.leoWallet) {
        const result = await window.leoWallet.connect();
        setAccount(result.address);
      } else {
        // 演示模式
        setAccount('aleo1demo...xxxx');
      }
      setVoteStatus('✅ 钱包已连接');
    } catch (e) {
      setVoteStatus('❌ 钱包连接失败: ' + e.message);
    }
  };

  const handleVote = async (candidateId) => {
    if (!account) return alert('请先连接钱包');

    setIsVoting(true);
    setVoteStatus(`⏳ 正在为候选人 ${candidateId === 1 ? 'A' : 'B'} 生成 ZK 投票证明...`);

    try {
      // 实际环境中调用 Aleo SDK
      // const tx = await aleo.execute('private_vote.aleo', 'vote_private', [`${candidateId}u32`]);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newTicket = {
        id: Date.now(),
        candidate: candidateId,
        status: 'generated'
      };
      setTickets(prev => [...prev, newTicket]);
      setVoteStatus('✅ 隐私投票凭证（Ticket）已生成！现在可以提交计票。');
    } catch (e) {
      setVoteStatus('❌ 投票失败: ' + e.message);
    } finally {
      setIsVoting(false);
    }
  };

  const handleTally = async (ticketIndex) => {
    setIsVoting(true);
    setVoteStatus('⏳ 正在提交计票交易到链上...');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const ticket = tickets[ticketIndex];
      if (ticket.candidate === 1) setVotesA(prev => prev + 1);
      else setVotesB(prev => prev + 1);

      setTickets(prev => prev.map((t, i) =>
        i === ticketIndex ? { ...t, status: 'tallied' } : t
      ));
      setVoteStatus('✅ 计票交易已上链！投票结果已更新。');
    } catch (e) {
      setVoteStatus('❌ 计票失败: ' + e.message);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h1 style={{ textAlign: 'center' }}>🛡️ Private Shield Vote</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>基于 Aleo 零知识证明的隐私投票 dApp</p>

      {/* 钱包连接 */}
      <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        {!account ? (
          <button onClick={connectWallet} style={btnStyle}>🔗 连接 Leo 钱包</button>
        ) : (
          <p style={{ margin: 0 }}>🟢 当前账号: <code>{account}</code></p>
        )}
      </div>

      {/* 投票区 */}
      {account && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button disabled={isVoting} onClick={() => handleVote(1)}
            style={{ ...btnStyle, flex: 1, background: '#4CAF50' }}>
            🗳️ 投给候选人 A
          </button>
          <button disabled={isVoting} onClick={() => handleVote(2)}
            style={{ ...btnStyle, flex: 1, background: '#2196F3' }}>
            🗳️ 投给候选人 B
          </button>
        </div>
      )}

      {/* 状态消息 */}
      {voteStatus && (
        <p style={{ padding: '12px', background: '#e8f5e9', borderRadius: '6px', textAlign: 'center' }}>
          {voteStatus}
        </p>
      )}

      {/* 投票凭证 */}
      {tickets.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📋 我的投票凭证（隐私 Records）</h3>
          {tickets.map((ticket, i) => (
            <div key={ticket.id} style={{
              padding: '10px', margin: '8px 0', background: '#fff',
              border: '1px solid #ddd', borderRadius: '6px', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>Ticket #{i + 1} - 候选人 {ticket.candidate === 1 ? 'A' : 'B'}</span>
              {ticket.status === 'generated' ? (
                <button onClick={() => handleTally(i)} disabled={isVoting}
                  style={{ ...btnStyle, fontSize: '12px', padding: '4px 12px', background: '#FF9800' }}>
                  📤 提交计票
                </button>
              ) : (
                <span style={{ color: 'green' }}>✅ 已计票</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 公开结果 */}
      <div style={{ background: '#e3f2fd', padding: '16px', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>📊 实时计票结果（链上公开 Mapping）</h3>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#4CAF50' }}>{votesA}</div>
            <div>候选人 A</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2196F3' }}>{votesB}</div>
            <div>候选人 B</div>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: 0, marginTop: '12px' }}>
          🔐 链上只能看到总票数，无法知道谁投了谁
        </p>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '10px 20px', border: 'none', borderRadius: '6px',
  color: 'white', background: '#333', cursor: 'pointer', fontSize: '14px'
};

export default App;
