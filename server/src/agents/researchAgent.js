import { invokeLLM } from '../services/llmService.js';
import { semanticSearch } from '../services/vectorStore.js';

export async function researchAgent({ topic, outline, documentIds, userId, reportId }) {
  const queries = [topic, ...outline.map((o) => `${o.title}: ${o.description}`)];
  const allChunks = [];
  const seen = new Set();

  for (const query of queries.slice(0, 6)) {
    const results = await semanticSearch({
      query,
      userId,
      documentIds,
      topK: 4,
    });
    for (const r of results) {
      const key = r.content?.slice(0, 100);
      if (!seen.has(key)) {
        seen.add(key);
        allChunks.push(r);
      }
    }
  }

  const contextBlock = allChunks.length
    ? allChunks.map((c, i) => `[Source ${i + 1}]\n${c.content}`).join('\n\n')
    : 'No uploaded documents found. Use general knowledge but mark claims as requiring verification.';

  const { content, tokensInput, tokensOutput, costUsd } = await invokeLLM({
    reportId,
    userId,
    agent: 'research',
    action: 'synthesize_research',
    messages: [
      {
        role: 'system',
        content: `You are a Research Agent. Synthesize retrieved context into structured research notes with source attribution.
Return ONLY valid JSON:
{"notes":[{"section":"section title","findings":"key findings","sourceIds":["Source 1"]}],"references":[{"id":"ref1","title":"source title","source":"document or web","excerpt":"relevant quote"}]}`,
      },
      {
        role: 'user',
        content: `Topic: ${topic}\n\nOutline sections:\n${outline.map((o) => `- ${o.title}`).join('\n')}\n\nRetrieved context:\n${contextBlock}`,
      },
    ],
  });

  let researchContext = [];
  let references = [];

  try {
    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
    researchContext = (parsed.notes || []).map((n) => ({
      section: n.section,
      findings: n.findings,
      sourceIds: n.sourceIds || [],
    }));
    references = (parsed.references || []).map((r, i) => ({
      id: r.id || `ref${i + 1}`,
      title: r.title || `Source ${i + 1}`,
      source: r.source || 'Uploaded Document',
      excerpt: r.excerpt || '',
      url: r.url || '',
    }));
  } catch {
    researchContext = outline.map((o) => ({
      section: o.title,
      findings: `Research findings for ${o.title} based on available context.`,
      sourceIds: allChunks.length ? ['Source 1'] : [],
    }));
    references = allChunks.map((c, i) => ({
      id: `ref${i + 1}`,
      title: c.metadata?.documentId ? `Document chunk ${i + 1}` : `Source ${i + 1}`,
      source: 'Uploaded Document',
      excerpt: c.content?.slice(0, 200) || '',
    }));
  }

  return {
    researchContext,
    references,
    retrievedChunks: allChunks,
    tokensInput,
    tokensOutput,
    costUsd,
  };
}
