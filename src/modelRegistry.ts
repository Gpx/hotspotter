import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "@ai-sdk/provider";

const SUPPORTED_PROVIDERS: readonly string[] = ["openai", "anthropic"];
const SEPARATOR = ":";

/**
 * Resolve a provider:model id (e.g. openai:gpt-4o) to a language model.
 * Uses each provider's default env var for API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY).
 * @throws if format is invalid or provider is not supported
 */
export function resolveModel(modelId: string): LanguageModelV1 {
  const trimmed = modelId.trim();
  if (!trimmed) {
    throw new Error(
      `Invalid model id: expected "provider:model" (e.g. openai:gpt-4o, anthropic:claude-sonnet-4-5)`
    );
  }
  const idx = trimmed.indexOf(SEPARATOR);
  if (idx <= 0 || idx === trimmed.length - 1) {
    throw new Error(
      `Invalid model id "${modelId}": expected "provider:model" (e.g. openai:gpt-4o). Supported providers: ${SUPPORTED_PROVIDERS.join(", ")}`
    );
  }
  const provider = trimmed.slice(0, idx).toLowerCase();
  const model = trimmed.slice(idx + 1).trim();
  if (!model) {
    throw new Error(
      `Invalid model id "${modelId}": model part is empty. Use e.g. openai:gpt-4o`
    );
  }
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new Error(
      `Unsupported provider "${provider}". Supported: ${SUPPORTED_PROVIDERS.join(", ")}. Example: openai:gpt-4o`
    );
  }
  if (provider === "openai") {
    return openai(model);
  }
  return anthropic(model);
}

/**
 * Return the env var name for a provider (for error messages).
 */
export function getEnvVarForProvider(provider: string): string {
  switch (provider.toLowerCase()) {
    case "openai":
      return "OPENAI_API_KEY";
    case "anthropic":
      return "ANTHROPIC_API_KEY";
    default:
      return "API key for your provider";
  }
}
