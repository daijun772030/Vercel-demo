
const { default: OpenAI } = require('openai');
const { openAI } = require('openai');
require('dotenv').config();
//创建一个openai
const client = new OpenAI({
  baseURL: process.env.BASEURL,
  apiKey: process.env.APIKEY
})
async function streamChat(message) {
  console.log('输入的message',message);
  process.stdout.write('🤖 AI：');
  const stream = await client.chat.completions.create({
    model: process.env.MODEL || 'deepseek-chat',
     messages: [{ role: 'user', content: message }],
    stream: true
  })
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);  // 实时逐字打印
  }

  process.stdout.write('\n');
}
streamChat('用 100 字解释什么是大型语言模型').catch(console.error);