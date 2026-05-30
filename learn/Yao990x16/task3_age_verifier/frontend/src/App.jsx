import { useState } from "react";
import "./App.css";
import aleoProgram from "../helloworld/build/main.aleo?raw";
import { AleoWorker } from "./workers/AleoWorker.js";

const aleoWorker = AleoWorker();

// 年龄限制固定为 18（公开参数）
const AGE_LIMIT = 18;

function App() {
  const [age, setAge] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null); // null | { passed: bool, proof: string }
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 255) {
      setError("请输入 0 ~ 255 之间的整数年龄。");
      return;
    }

    setError(null);
    setResult(null);
    setExecuting(true);

    try {
      // 调用 Aleo SDK 在浏览器本地生成零知识证明并执行
      // 注意：age 是 private 参数，不会出现在链上交易数据中
      const outputs = await aleoWorker.localProgramExecution(
        aleoProgram,
        "verify_age",
        [`${ageNum}u8`, `${AGE_LIMIT}u8`]
      );

      const passed = outputs[0] === "true";
      setResult({ passed, age: ageNum });
    } catch (e) {
      console.error(e);
      setError("证明生成失败，请检查控制台日志。");
    } finally {
      setExecuting(false);
    }
  };

  const handleReset = () => {
    setAge("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="app-container">
      {/* 背景粒子装饰 */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <div className="card-wrapper">
        {/* 页面标题 */}
        <header className="header">
          <div className="logo-row">
            <span className="logo-badge">🔐</span>
            <span className="logo-badge aleo-badge">Aleo</span>
          </div>
          <h1 className="title">隐私年龄验证器</h1>
          <p className="subtitle">
            基于零知识证明 · 证明您已达标 · 无需透露真实年龄
          </p>
        </header>

        {/* 说明卡片 */}
        <div className="info-strip">
          <div className="info-item">
            <span className="info-icon">🔒</span>
            <span>
              <strong>Private</strong>
              <br />您的真实年龄
            </span>
          </div>
          <div className="info-arrow">→</div>
          <div className="info-item">
            <span className="info-icon">⚡</span>
            <span>
              <strong>ZK Proof</strong>
              <br />本地生成证明
            </span>
          </div>
          <div className="info-arrow">→</div>
          <div className="info-item">
            <span className="info-icon">✅</span>
            <span>
              <strong>Public</strong>
              <br />只输出是 / 否
            </span>
          </div>
        </div>

        {/* 主输入区域 */}
        {result === null ? (
          <div className="input-section">
            <label className="input-label" htmlFor="age-input">
              请输入您的年龄
              <span className="private-tag">🔒 Private Data</span>
            </label>
            <div className="input-row">
              <input
                id="age-input"
                type="number"
                min="0"
                max="255"
                className="age-input"
                placeholder="例如：20"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !executing && handleVerify()}
                disabled={executing}
              />
            </div>

            <div className="limit-display">
              <span>验证门槛：</span>
              <span className="limit-value">{AGE_LIMIT} 岁</span>
              <span className="public-tag">📢 Public</span>
            </div>

            {error && <div className="error-msg">⚠️ {error}</div>}

            <button
              id="verify-btn"
              className={`verify-btn ${executing ? "loading" : ""}`}
              onClick={handleVerify}
              disabled={executing || age === ""}
            >
              {executing ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span className="spinner" />
                  <span>正在生成零知识证明...</span>
                </div>
              ) : (
                <span>⚡ 生成 ZK 证明并验证</span>
              )}
            </button>

            {executing && (
              <p className="executing-hint">
                Aleo SDK 正在您的浏览器本地生成证明，这可能需要 10~30 秒，请耐心等待...
              </p>
            )}
          </div>
        ) : (
          /* 结果展示区域 */
          <div className={`result-section ${result.passed ? "passed" : "failed"}`}>
            <div className="result-icon">
              {result.passed ? "🎉" : "🚫"}
            </div>
            <h2 className="result-title">
              {result.passed ? "验证通过！" : "验证未通过"}
            </h2>
            <p className="result-desc">
              {result.passed
                ? `零知识证明已生成。合约已确认您满足 ${AGE_LIMIT} 岁的要求，但链上只记录了"通过"这一事实——您的真实年龄 ${result.age} 岁从未离开您的设备。`
                : `证明显示您未能满足 ${AGE_LIMIT} 岁的年龄要求。链上只知道"未通过"，不知道您填写的具体数值。`}
            </p>

            <div className="proof-meta">
              <div className="proof-item">
                <span className="proof-label">输入（Private）</span>
                <span className="proof-value censored">██ 岁（已加密隐藏）</span>
              </div>
              <div className="proof-item">
                <span className="proof-label">门槛（Public）</span>
                <span className="proof-value">{AGE_LIMIT} 岁</span>
              </div>
              <div className="proof-item">
                <span className="proof-label">链上输出</span>
                <span className={`proof-value ${result.passed ? "text-green" : "text-red"}`}>
                  {result.passed ? "true ✅" : "false ❌"}
                </span>
              </div>
              <div className="proof-item">
                <span className="proof-label">执行方式</span>
                <span className="proof-value">本地零知识证明（Local Execution）</span>
              </div>
            </div>

            <button id="reset-btn" className="reset-btn" onClick={handleReset}>
              ← 重新验证
            </button>
          </div>
        )}
      </div>

      <footer className="page-footer">
        Author: <strong>Yao990x16</strong> |{" "}
        {/* <a href="https://aleo.org" target="_blank" rel="noopener noreferrer">
          Aleo
        </a>{" "}
        &amp;{" "}
        <a href="https://docs.leo-lang.org" target="_blank" rel="noopener noreferrer">
          Leo
        </a> */}
        Aleo 101 Bootcamp — Task 3
      </footer>
    </div>
  );
}

export default App;
