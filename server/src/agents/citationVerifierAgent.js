import { invokeLLM } from '../services/llmService.js';

export async function citationVerifierAgent({ sections, references, executiveSummary, reportId, userId }) {
  const { content, tokensInput, tokensOutput, costUsd } = await invokeLLM({
    reportId,
    userId,
    agent: 'citation_verifier',
    action: 'verify_citations',
    messages: [
      {
        role: 'system',
        content: `You are a Citation Verifier Agent. Validate that claims map to references and flag unverifiable claims.
Return ONLY valid JSON:
{"sections":[{"title":"...","content":"content with corrected citations","citations":[{"claim":"...","sourceId":"ref1","excerpt":"...","verified":true|false}]}],"references":[{"id":"ref1","title":"...","source":"...","excerpt":"..."}],"executiveSummary":"verified summary"}
Set verified=true only when excerpt supports the claim.`,
      },
      {
        role: 'user',
        content: `Sections:\n${JSON.stringify(sections)}\n\nReferences:\n${JSON.stringify(references)}`,
      },
    ],
  });

  try {
    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
    const verifiedSections = (parsed.sections || sections).map((s) => ({
      ...s,
      citations: (s.citations || []).map((c) => ({
        ...c,
        verified: Boolean(c.verified),
      })),
    }));
    return {
      sections: verifiedSections,
      references: parsed.references || references,
      executiveSummary: parsed.executiveSummary || executiveSummary,
      tokensInput,
      tokensOutput,
      costUsd,
    };
  } catch {
    const fallbackSections = sections.map((s) => ({
      ...s,
      citations: (s.citations || []).map((c) => ({ ...c, verified: Boolean(c.sourceId && c.excerpt) })),
    }));
    return {
      sections: fallbackSections,
      references,
      executiveSummary,
      tokensInput,
      tokensOutput,
      costUsd,
    };
  }
}
