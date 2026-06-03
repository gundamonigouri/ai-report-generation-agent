import { invokeLLM } from '../services/llmService.js';

export async function writerAgent({ topic, outline, researchContext, references, reportId, userId }) {
  const researchBlock = researchContext
    .map((r) => `### ${r.section}\n${r.findings}\nSources: ${(r.sourceIds || []).join(', ')}`)
    .join('\n\n');

  const { content, tokensInput, tokensOutput, costUsd } = await invokeLLM({
    reportId,
    userId,
    agent: 'writer',
    action: 'write_sections',
    messages: [
      {
        role: 'system',
        content: `You are a Writer Agent producing professional, citation-backed report sections.
Return ONLY valid JSON:
{"executiveSummary":"2-3 paragraph executive summary","sections":[{"title":"section title","content":"detailed markdown content with [1] style citations","citations":[{"claim":"specific claim","sourceId":"ref1","excerpt":"supporting text"}]}]}
Write formally, use data where available, and cite sources. Do not invent statistics not supported by research.`,
      },
      {
        role: 'user',
        content: `Topic: ${topic}\n\nOutline:\n${JSON.stringify(outline)}\n\nResearch:\n${researchBlock}\n\nReferences:\n${JSON.stringify(references)}`,
      },
    ],
  });

  let sections = [];
  let executiveSummary = '';

  try {
    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
    executiveSummary = parsed.executiveSummary || '';
    sections = (parsed.sections || []).map((s) => ({
      title: s.title,
      content: s.content,
      citations: (s.citations || []).map((c) => ({
        claim: c.claim,
        sourceId: c.sourceId,
        excerpt: c.excerpt,
        verified: false,
      })),
    }));
  } catch {
    sections = outline.map((o) => {
      const research = researchContext.find((r) => r.section === o.title);
      return {
        title: o.title,
        content: research?.findings || `This section covers ${o.description}`,
        citations: [],
      };
    });
    executiveSummary = `This report examines ${topic}, synthesizing available research into actionable insights.`;
  }

  return { sections, executiveSummary, tokensInput, tokensOutput, costUsd };
}
