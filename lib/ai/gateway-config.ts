const DEFAULT_MODEL = "anthropic/claude-sonnet-4.6";
const DEFAULT_FALLBACK_MODEL = "openai/gpt-5.4";

export function gatewayModelCandidates(primary?: string, fallback?: string) {
  return [...new Set([
    primary?.trim() || DEFAULT_MODEL,
    fallback?.trim() || DEFAULT_FALLBACK_MODEL,
  ].filter(Boolean))];
}
