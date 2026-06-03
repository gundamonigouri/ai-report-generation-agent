import { invokeLLM } from '../services/llmService.js';

export async function reviewerAgent({ topic, sections, executiveSummary, reportId, userId }) {
  const { content, tokensInput, tokensOutput, costUsd } = await invokeLLM({
    reportId,
    userId,
    agent: 'reviewer',
    action: 'review_and_improve',
    messages: [
      {
        role: 'system',
        content: `You are a Reviewer Agent. Improve readability, grammar, consistency, and reduce hallucinations.
Return ONLY valid JSON with the same structure:
{"executiveSummary":"improved summary","sections":[{"title":"...","content":"improved content","citations":[...]}]}
Remove unsupported claims. Improve flow between sections. Maintain citation markers.`,
      },
      {
        role: 'user',
        content: `Topic: ${topic}\n\nDraft:\n${JSON.stringify({ executiveSummary, sections })}`,
      },
    ],
  });

  try {
    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
    return {
      sections: parsed.sections || sections,
      executiveSummary: parsed.executiveSummary || executiveSummary,
      tokensInput,
      tokensOutput,
      costUsd,
    };
  } catch {
    return { sections, executiveSummary, tokensInput, tokensOutput, costUsd };
  }
}
