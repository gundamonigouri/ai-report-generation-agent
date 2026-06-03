import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { planningAgent } from './planningAgent.js';
import { researchAgent } from './researchAgent.js';
import { writerAgent } from './writerAgent.js';
import { reviewerAgent } from './reviewerAgent.js';
import { citationVerifierAgent } from './citationVerifierAgent.js';

const ReportState = Annotation.Root({
  reportId: Annotation(),
  userId: Annotation(),
  topic: Annotation(),
  documentIds: Annotation(),
  outline: Annotation(),
  researchContext: Annotation(),
  retrievedChunks: Annotation(),
  sections: Annotation(),
  references: Annotation(),
  executiveSummary: Annotation(),
  fullContent: Annotation(),
  agentStats: Annotation(),
  tokensUsed: Annotation(),
  costUsd: Annotation(),
  status: Annotation(),
  error: Annotation(),
});

function mergeStats(state, agent, ms, tokens = 0, cost = 0) {
  return {
    agentStats: { ...(state.agentStats || {}), [`${agent}Ms`]: ms },
    tokensUsed: (state.tokensUsed || 0) + tokens,
    costUsd: (state.costUsd || 0) + cost,
  };
}

function buildFullReport({ topic, executiveSummary, outline, sections, references }) {
  const toc = (outline || []).map((o, i) => `${i + 1}. ${o.title}`).join('\n');
  const body = (sections || []).map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n');
  const refs = (references || []).map((r, i) => `[${i + 1}] ${r.title} - ${r.source}`).join('\n');

  return `# ${topic}

## Cover Page
**Autonomous AI Research Report**
Topic: ${topic}
Generated: ${new Date().toISOString().split('T')[0]}

## Executive Summary
${executiveSummary}

## Table of Contents
${toc}

${body}

## References
${refs}
`;
}

async function runPlanning(state) {
  const start = Date.now();
  try {
    const result = await planningAgent(state);
    return {
      outline: result.outline,
      status: 'planning',
      ...mergeStats(state, 'planning', Date.now() - start, result.tokensInput + result.tokensOutput, result.costUsd),
    };
  } catch (error) {
    return { error: error.message, status: 'failed' };
  }
}

async function runResearch(state) {
  if (state.error) return {};
  const start = Date.now();
  try {
    const result = await researchAgent(state);
    return {
      researchContext: result.researchContext,
      references: result.references,
      retrievedChunks: result.retrievedChunks,
      status: 'researching',
      ...mergeStats(state, 'research', Date.now() - start, result.tokensInput + result.tokensOutput, result.costUsd),
    };
  } catch (error) {
    return { error: error.message, status: 'failed' };
  }
}

async function runWriting(state) {
  if (state.error) return {};
  const start = Date.now();
  try {
    const result = await writerAgent(state);
    return {
      sections: result.sections,
      executiveSummary: result.executiveSummary,
      status: 'writing',
      ...mergeStats(state, 'writing', Date.now() - start, result.tokensInput + result.tokensOutput, result.costUsd),
    };
  } catch (error) {
    return { error: error.message, status: 'failed' };
  }
}

async function runReview(state) {
  if (state.error) return {};
  const start = Date.now();
  try {
    const result = await reviewerAgent(state);
    return {
      sections: result.sections,
      executiveSummary: result.executiveSummary,
      status: 'reviewing',
      ...mergeStats(state, 'reviewing', Date.now() - start, result.tokensInput + result.tokensOutput, result.costUsd),
    };
  } catch (error) {
    return { error: error.message, status: 'failed' };
  }
}

async function runVerification(state) {
  if (state.error) return {};
  const start = Date.now();
  try {
    const result = await citationVerifierAgent(state);
    const fullContent = buildFullReport({
      topic: state.topic,
      executiveSummary: result.executiveSummary,
      outline: state.outline,
      sections: result.sections,
      references: result.references,
    });
    return {
      sections: result.sections,
      references: result.references,
      executiveSummary: result.executiveSummary,
      fullContent,
      status: 'completed',
      ...mergeStats(state, 'verifying', Date.now() - start, result.tokensInput + result.tokensOutput, result.costUsd),
    };
  } catch (error) {
    return { error: error.message, status: 'failed' };
  }
}

function routeAfter(state) {
  return state.error ? END : 'next';
}

export function createReportWorkflow() {
  const workflow = new StateGraph(ReportState)
    .addNode('planning', runPlanning)
    .addNode('research', runResearch)
    .addNode('writing', runWriting)
    .addNode('reviewing', runReview)
    .addNode('verifying', runVerification)
    .addEdge(START, 'planning')
    .addConditionalEdges('planning', routeAfter, { next: 'research', [END]: END })
    .addConditionalEdges('research', routeAfter, { next: 'writing', [END]: END })
    .addConditionalEdges('writing', routeAfter, { next: 'reviewing', [END]: END })
    .addConditionalEdges('reviewing', routeAfter, { next: 'verifying', [END]: END })
    .addEdge('verifying', END);

  return workflow.compile();
}

export async function executeReportWorkflow(initialState) {
  const app = createReportWorkflow();
  const start = Date.now();
  const result = await app.invoke(initialState);
  result.agentStats = { ...(result.agentStats || {}), totalMs: Date.now() - start };
  return result;
}
