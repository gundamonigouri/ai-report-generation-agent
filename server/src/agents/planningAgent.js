import { invokeLLM } from '../services/llmService.js';

export async function planningAgent({ topic, reportId, userId }) {
  const { content, tokensInput, tokensOutput, costUsd } = await invokeLLM({
    reportId,
    userId,
    agent: 'planning',
    action: 'create_outline',
    messages: [
      {
        role: 'system',
        content: `You are a Planning Agent for professional research reports. Analyze the topic and produce a detailed JSON outline.
Return ONLY valid JSON in this format:
{"outline":[{"title":"Section Title","description":"What this section covers","order":1}]}
Create 5-7 sections including introduction, analysis sections, conclusions, and recommendations. Be specific to the topic.`,
      },
      {
        role: 'user',
        content: `Research topic: "${topic}"\n\nCreate a comprehensive report outline.`,
      },
    ],
  });

  let outline = [];
  try {
    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
    outline = (parsed.outline || []).map((item, i) => ({
      title: item.title || `Section ${i + 1}`,
      description: item.description || '',
      order: item.order ?? i + 1,
    }));
  } catch {
    outline = [
      { title: 'Introduction', description: `Overview of ${topic}`, order: 1 },
      { title: 'Background & Context', description: 'Historical and current context', order: 2 },
      { title: 'Key Findings', description: 'Primary research findings', order: 3 },
      { title: 'Analysis', description: 'In-depth analysis', order: 4 },
      { title: 'Conclusions & Recommendations', description: 'Summary and next steps', order: 5 },
    ];
  }

  return { outline, tokensInput, tokensOutput, costUsd };
}
