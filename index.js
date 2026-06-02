const { default: OpenAI } = require('openai');
const { openAI } = require('openai');
require('dotenv').config();
//创建一个openai
const client = new OpenAI({
  baseURL: process.env.BASEURL,
  apiKey: process.env.APIKEY
})
async function main() {
  const response = await client.chat.completions.create({
    model: process.env.MODEL || 'deepseek-chat',
    messages: [
      { role: 'system', content: '你是一个乐于助人的AI助手，回答简洁有用。' },
      { role: 'user',   content: '用一句话介绍你自己。' },
    ],
  });

  console.log('🤖 AI 回复：', response.choices[0].message.content);
  console.log('📊 Token 用量：', response.usage);
}
main().catch(console.error)