#!/usr/bin/env node
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const LEO_BIN = process.env.LEO_BIN || 'leo';
const PROJECT_DIR = path.resolve(__dirname, '../leo/private_calc');

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function parseMaybeResult(output) {
  const m = output.match(/(?:Output|Outputs?)\s*[:：]\s*([0-9]+u32)/i);
  if (m) return m[1];
  const anyU32 = output.match(/\b([0-9]+u32)\b/g);
  return anyU32 && anyU32.length ? anyU32[anyU32.length - 1] : null;
}

function runLeoPrivateAdd(a, b) {
  return new Promise((resolve) => {
    const args = ['run', 'private_add', `${a}u32`, `${b}u32`];
    const child = spawn(LEO_BIN, args, { cwd: PROJECT_DIR });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', (error) => {
      resolve({
        ok: false,
        code: -1,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim()
      });
    });

    child.on('close', (code) => {
      resolve({ ok: code === 0, code, stdout, stderr });
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res, 200, {
      ok: true,
      leoProject: PROJECT_DIR,
      leoBin: LEO_BIN
    });
  }

  if (req.method === 'POST' && req.url === '/api/private-add') {
    let raw = '';
    req.on('data', (chunk) => {
      raw += String(chunk);
      if (raw.length > 1_000_000) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      let body;
      try {
        body = JSON.parse(raw || '{}');
      } catch {
        return sendJson(res, 400, { ok: false, error: 'JSON 格式错误' });
      }

      const a = Number(body.a);
      const b = Number(body.b);
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
        return sendJson(res, 400, { ok: false, error: 'a 和 b 必须是非负整数' });
      }

      const exec = await runLeoPrivateAdd(a, b);
      const merged = `${exec.stdout}\n${exec.stderr}`;
      const result = parseMaybeResult(merged);

      if (!exec.ok) {
        return sendJson(res, 500, {
          ok: false,
          error: 'leo run 执行失败，请确认本机已安装 Leo CLI，并可在命令行运行 leo --version',
          code: exec.code,
          stdout: exec.stdout,
          stderr: exec.stderr
        });
      }

      return sendJson(res, 200, {
        ok: true,
        transition: 'private_add',
        inputs: [`${a}u32`, `${b}u32`],
        result,
        stdout: exec.stdout,
        stderr: exec.stderr
      });
    });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'Not Found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[task3-backend] listening on http://${HOST}:${PORT}`);
  console.log(`[task3-backend] leo project: ${PROJECT_DIR}`);
});
