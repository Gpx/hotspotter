## 1. Dependencies

- [x] 1.1 Add `ai` (Vercel AI SDK) to package.json
- [x] 1.2 Add `@ai-sdk/openai` and `@ai-sdk/anthropic` to package.json

## 2. CLI and arguments

- [x] 2.1 Add `--model` option to CLI definition (optional string; required when `--report` is set)
- [x] 2.2 Add `model` to `HotspotArgs` (and parse from options) in `src/args.ts`
- [x] 2.3 Validate that `--model` is present and non-empty when `--report` is true; exit with clear error ("--model is required when using --report") before running analysis

## 3. Provider registry and model resolution

- [x] 3.1 Create provider registry with OpenAI and Anthropic (e.g. using `createProviderRegistry` from AI SDK)
- [x] 3.2 Implement model resolution: given `--model` string (e.g. `openai:gpt-4o`), resolve to a language model via the registry; validate format and supported provider, fail with clear message if invalid or unsupported

## 4. Report generation (analyze.ts)

- [x] 4.1 Rewrite `runAnalysis` to accept `modelId` (or resolved model) in addition to input path, output path, and workspace
- [x] 4.2 Replace agent spawn with AI SDK `generateText`: pass assembled prompt (from existing prompt template and variable substitution), use resolved model
- [x] 4.3 Write the generated text directly to the output report path (`{base}.md`) using fs
- [x] 4.4 Wire `--model` from args into the report generation flow (caller passes model id or resolved model to `runAnalysis`)

## 5. Error handling

- [x] 5.1 Catch SDK/auth errors (e.g. 401 or missing key); when possible, suggest the relevant env var based on provider prefix of `--model` (e.g. "Set OPENAI_API_KEY for the OpenAI provider")

## 6. Documentation

- [x] 6.1 Document `--model` in README (required when `--report`; format `provider:model`, e.g. `openai:gpt-4o`)
- [x] 6.2 Document environment variables per supported provider (OPENAI_API_KEY, ANTHROPIC_API_KEY) in README and CLI help

## 7. Testing

- [x] 7.1 Add or update tests: when `--report` is set without `--model`, validation fails with appropriate error
- [x] 7.2 Add or update report-generation tests to use a mocked AI SDK model (fixed text response) so tests do not call real APIs and do not require API keys
