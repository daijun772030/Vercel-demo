const { OpenAI } = require('openai');
const readline = require('readline');
require('dotenv').config();
const client = new OpenAI({
  baseURL: process.env.BASEURL,
  apiKey: process.env.APIKEY
});
//对话历史： 每次对话都带上历史对话，AI才能记住

const history = [
  { role: 'system', content: '你是一个专业的 AI 编程助手，回答简洁有条理。' }
];
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function chat(userMessage) {
  history.push({ role: 'user', content: userMessage });

  let reply = '';
  process.stdout.write('🤖 AI：');

  const stream = await client.chat.completions.create({
    model: process.env.MODEL || 'deepseek-chat',
    messages: history,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    reply += content;
    process.stdout.write(content);
  }

  process.stdout.write('\n\n');
  history.push({ role: 'assistant', content: reply });
}

function ask() {
  rl.question('👤 你：', async (input) => {
    const text = input.trim();
    if (!text) { ask(); return; }
    if (text.toLowerCase() === 'exit') { console.log('👋 再见！'); rl.close(); return; }
    await chat(text).catch(console.error);
    ask();
  });
}

console.log('💬 多轮对话终端（输入 exit 退出）\n');
ask();