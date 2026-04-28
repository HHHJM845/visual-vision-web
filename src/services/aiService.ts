const BASE_URL = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

async function callDeepSeek(messages: { role: 'system' | 'user' | 'assistant'; content: string }[], temperature = 0.7): Promise<string> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string;
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: 'deepseek-chat', messages, temperature }),
  });
  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Unexpected DeepSeek response shape');
  return content;
}

export async function enhanceBrief(roughIdea: string): Promise<string> {
  const content = `你是一个创意委托平台的需求顾问。用户想发布一个 AI 生成内容的委托项目。

用户的粗略想法：${roughIdea}

请根据以下结构生成一段专业的项目描述（200字以内，中文）：
- 项目背景：这是什么项目，用于什么场景
- 风格要求：期望的视觉风格、色调、情绪
- 用途说明：商业/个人，如何使用
- 交付要求：格式、尺寸或其他具体要求

只输出描述正文，不要加任何标题或前缀。`;
  return callDeepSeek([{ role: 'user', content }]);
}

export type ApplicantInput = {
  id: string;
  bio: string;
  styles: string[];
  tools: string[];
};

export async function matchApplicants(
  commissionDescription: string,
  category: string,
  applicants: ApplicantInput[]
): Promise<{ id: string; score: number }[]> {
  const content = `你是一个创意委托平台的智能匹配系统。

委托项目描述：
${commissionDescription}
委托分类：${category}

以下是应征者列表（JSON格式）：
${JSON.stringify(applicants)}
每个应征者包含：id, bio（个人简介）, styles（擅长风格列表）, tools（使用工具列表）

请为每个应征者打一个匹配度分数（0-100的整数），基于其风格、工具与委托需求的契合程度。
只输出 JSON 数组，格式：[{"id": "...", "score": 85}, ...]
不要有任何其他文字。`;
  const raw = await callDeepSeek([{ role: 'user', content }], 0.1);
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned) as { id: string; score: number }[];
}
