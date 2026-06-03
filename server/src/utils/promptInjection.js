const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(your\s+)?(system\s+)?prompt/i,
  /you\s+are\s+now\s+(a\s+)?(DAN|jailbreak|unrestricted)/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /<\s*script[\s>]/i,
  /\{\{\s*system\s*\}\}/i,
  /###\s*instruction/i,
  /override\s+security/i,
  /act\s+as\s+if\s+you\s+have\s+no\s+restrictions/i,
];

export function detectPromptInjection(input = '') {
  if (!input || typeof input !== 'string') return { detected: false, patterns: [] };
  const matched = INJECTION_PATTERNS.filter((p) => p.test(input)).map((p) => p.source);
  return { detected: matched.length > 0, patterns: matched };
}

export function sanitizeUserInput(input = '') {
  return input
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim()
    .slice(0, 10000);
}
