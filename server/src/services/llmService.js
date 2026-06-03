import { ChatGroq } from '@langchain/groq';
import { config } from '../config/index.js';
import { AgentLog } from '../models/AgentLog.js';
import { maskSensitive } from '../utils/maskSensitive.js';

let chatModel = null;

export function getChatModel() {
  if (!config.groq.apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  if (!chatModel) {
    chatModel = new ChatGroq({
      apiKey: config.groq.apiKey,
      model: config.groq.model,
      temperature: 0.3,
      maxTokens: 4096,
    });
  }
  return chatModel;
}

const GROQ_INPUT_COST_PER_1M = 0.59;
const GROQ_OUTPUT_COST_PER_1M = 0.79;

export function estimateCost(tokensInput = 0, tokensOutput = 0) {
  return (
    (tokensInput / 1_000_000) * GROQ_INPUT_COST_PER_1M +
    (tokensOutput / 1_000_000) * GROQ_OUTPUT_COST_PER_1M
  );
}

export function estimateTokens(text = '') {
  return Math.ceil((text || '').length / 4);
}

export async function invokeLLM({
  messages,
  agent = 'system',
  reportId,
  userId,
  action = 'invoke',
}) {
  const start = Date.now();
  const model = getChatModel();
  const promptText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

  try {
    const response = await model.invoke(messages);
    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    const tokensInput = estimateTokens(promptText);
    const tokensOutput = estimateTokens(content);
    const latencyMs = Date.now() - start;

    await AgentLog.create({
      reportId,
      userId,
      agent,
      action,
      prompt: promptText,
      response: content,
      promptMasked: maskSensitive(promptText.slice(0, 2000)),
      tokensInput,
      tokensOutput,
      latencyMs,
      model: config.groq.model,
      success: true,
    });

    return {
      content,
      tokensInput,
      tokensOutput,
      latencyMs,
      costUsd: estimateCost(tokensInput, tokensOutput),
    };
  } catch (error) {
    await AgentLog.create({
      reportId,
      userId,
      agent,
      action,
      promptMasked: maskSensitive(promptText.slice(0, 2000)),
      latencyMs: Date.now() - start,
      model: config.groq.model,
      success: false,
      error: error.message,
    });
    throw error;
  }
}
