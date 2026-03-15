import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import type { ChatCompletionMessageParam } from 'openai/resources';
import { getSetting } from '@/lib/settings';

// 懒加载客户端
function getClient() {
  const apiKey = getSetting('DEEPSEEK_API_KEY');
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
    timeout: 60000,
    maxRetries: 3,
  });
}

export async function POST(request: Request) {
  console.log('Chat API 被调用');

  try {
    // 检查 API 密钥（从设置文件或环境变量）
    const apiKey = getSetting('DEEPSEEK_API_KEY');
    if (!apiKey) {
      console.error('DeepSeek API 密钥未配置');
      return new NextResponse(
        JSON.stringify({
          error: 'DeepSeek API 密钥未配置，请前往设置页面配置'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 解析请求体
    let body;
    try {
      body = await request.json();
      console.log('请求体:', body);
    } catch (e) {
      console.error('请求体解析失败:', e);
      return new NextResponse(
        JSON.stringify({ error: '无效的请求数据' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { message, selectedChallenge, conversationHistory } = body;

    if (!message) {
      console.error('消息内容为空');
      return new NextResponse(
        JSON.stringify({ error: '消息内容不能为空' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('准备发送到 DeepSeek');

    // 构建消息历史
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI assistant helping users explore local challenges in the Aizu region.

        Current topic: ${selectedChallenge ? JSON.stringify(selectedChallenge) : 'No topic selected'}

        Your response should be in this format:
        TITLE: [A short 3-5 word title for a new challenge]
        CONTENT: [Your main response in 50-80 words]

        Guidelines:
        1. Title should be concise and capture the key point
        2. Use plain English text
        3. Focus on practical insights
        4. Be direct and clear
        5. Maintain a professional tone`
      },
      ...(conversationHistory || []),
      { role: "user", content: message }
    ];

    // 创建客户端
    const client = getClient();

    // 调用 DeepSeek API
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content || '';
    console.log('DeepSeek 响应:', responseText);

    return new NextResponse(
      JSON.stringify({ response: responseText }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Chat API 错误:', error);

    // 处理特定错误
    if (error.message === 'DEEPSEEK_API_KEY 未配置') {
      return new NextResponse(
        JSON.stringify({
          error: 'API 密钥未配置，请前往 <a href="/settings">设置页面</a> 配置 DeepSeek API Key'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new NextResponse(
      JSON.stringify({
        error: '处理请求时出错',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
