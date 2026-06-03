const SENSITIVE_PATTERNS = [
  /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"]?[\w-]+['"]?/gi,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  /\b(?:sk|pk)_[a-zA-Z0-9]{20,}\b/g,
];

export function maskSensitive(text = '') {
  if (!text) return '';
  let masked = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    masked = masked.replace(pattern, '[REDACTED]');
  }
  return masked;
}
