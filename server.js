// server.js
const express = require('express');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.APIKEY,
  baseURL: process.env.BASEURL
});

// 内存存储对话历史（生产环境用 Redis / DB）
const sessions = {};

// ── 主页：内嵌聊天 UI ──────────────────────────────────
app.get('/', (req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>我的 AI 助手</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f1f5f9; display: flex; flex-direction: column; height: 100dvh; }
    header { padding: 16px 20px; border-bottom: 1px solid #1e293b; font-size: 17px; font-weight: 600; }
    header span { color: #818cf8; }
    #msgs { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .msg { max-width: 75%; padding: 12px 16px; border-radius: 18px; line-height: 1.65; white-space: pre-wrap; word-break: break-word; }
    .user { background: #6366f1; align-self: flex-end; border-radius: 18px 4px 18px 18px; }
    .ai   { background: #1e293b; border: 1px solid #334155; align-self: flex-start; border-radius: 4px 18px 18px 18px; }
    .ai.loading { opacity: 0.6; font-style: italic; }
    #bar  { display: flex; gap: 10px; padding: 14px 16px; border-top: 1px solid #1e293b; }
    #inp  { flex: 1; padding: 12px 16px; background: #1e293b; border: 1px solid #334155; border-radius: 14px; color: #f1f5f9; font-size: 15px; resize: none; outline: none; min-height: 48px; max-height: 120px; overflow-y: auto; }
    #inp:focus { border-color: #6366f1; }
    #btn  { padding: 12px 22px; background: #6366f1; border: none; border-radius: 14px; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; transition: background .15s; }
    #btn:hover:not(:disabled) { background: #4f46e5; }
    #btn:disabled { opacity: 0.45; cursor: default; }
  </style>
</head>
<body>
  <header>💬 <span>AI</span> 助手</header>
  <div id="msgs">
    <div class="msg ai">👋 你好！我是 AI 助手，有什么可以帮到你？</div>
  </div>
  <div id="bar">
    <textarea id="inp" rows="1" placeholder="输入消息，Enter 发送 / Shift+Enter 换行"></textarea>
    <button id="btn">发送</button>
  </div>

  <script>
    const msgs = document.getElementById('msgs');
    const inp  = document.getElementById('inp');
    const btn  = document.getElementById('btn');
    const sid  = Math.random().toString(36).slice(2);

    function addMsg(role, text) {
      const el = document.createElement('div');
      el.className = 'msg ' + role;
      el.textContent = text;
      msgs.appendChild(el);
      msgs.scrollTop = msgs.scrollHeight;
      return el;
    }

    async function send() {
      const text = inp.value.trim();
      if (!text) return;
      inp.value = '';
      btn.disabled = true;
      addMsg('user', text);

      const aiEl = addMsg('ai', '…');
      aiEl.classList.add('loading');

      try {
        const res = await fetch('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId: sid }),
        });

        if (!res.ok) throw new Error('请求失败 ' + res.status);

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let content   = '';
        aiEl.classList.remove('loading');
        aiEl.textContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value, { stream: true });
          aiEl.textContent = content;
          msgs.scrollTop = msgs.scrollHeight;
        }
      } catch (e) {
        aiEl.classList.remove('loading');
        aiEl.textContent = '⚠️ 出错了：' + e.message;
      }

      btn.disabled = false;
      inp.focus();
    }

    btn.addEventListener('click', send);
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    // 自动撑高 textarea
    inp.addEventListener('input', () => {
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
    });
  </script>
</body>
</html>`);
});

// ── 聊天接口（流式 SSE）─────────────────────────────────
app.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  if (!sessions[sessionId]) {
    sessions[sessionId] = [
      { role: 'system', content: '你是一个乐于助人的AI助手，回答简洁清晰，适当使用 Markdown 格式。' },
    ];
  }

  sessions[sessionId].push({ role: 'user', content: message });

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no'); // 关闭 Nginx 缓冲，确保流式实时

  try {
    const stream = await client.chat.completions.create({
      model: process.env.MODEL || 'deepseek-chat',
      messages: sessions[sessionId],
      stream: true,
    });

    let reply = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        reply += content;
        res.write(content);
      }
    }

    sessions[sessionId].push({ role: 'assistant', content: reply });
    res.end();
  } catch (err) {
    console.error('[AI Error]', err.message);
    res.write('\n⚠️ AI 服务暂时不可用，请稍后重试。');
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 AI 聊天应用已启动：http://localhost:${PORT}\n`);
});
