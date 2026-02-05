# Multi-Model Support — Design

## Context

Report generation today lives in `src/analyze.ts`: it builds a prompt from `prompt.md` (with `INPUT_FILE_PATH` and `OUTPUT_FILE_PATH`), then spawns the Cursor `agent` CLI with `--workspace` and that prompt. The agent runs interactively and may ask the user to save; the tool has no direct control over where the report is written. The rest of the stack (hotspot detection, coupling, JSON output, report format) is unchanged.

We are replacing the agent spawn with the [Vercel AI SDK](https://ai-sdk.dev/). Constraints: (1) `--model` is required when `--report` is set, with no default; (2) each provider uses its own env var for API keys; (3) the report must be written directly to the derived output path (no interactive step). The proposal defines the contract; the ai-analysis and hotspotter specs will define the exact requirements.

## Goals / Non-Goals

**Goals:**

- Invoke report generation via the AI SDK (`generateText` or equivalent) instead of spawning the Cursor agent.
- Resolve the model from the required `--model` flag using a provider-qualified id (e.g. `openai:gpt-4o`, `anthropic:claude-sonnet-4-5`).
- Rely on each provider’s default env var for API keys (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`); no single “multi-model” key.
- Write the generated report directly to the spec-defined output path (`{base}.md`).
- Keep the existing prompt template and report format; only the execution path changes.

**Non-Goals:**

- Supporting every AI SDK provider at launch (start with OpenAI and Anthropic; extend later).
- Streaming the report to the file incrementally (generate full text then write is sufficient).
- Providing a default model when `--report` is set (user must pass `--model`).
- Changing hotspot detection, coupling analysis, or the report’s 13-section structure.

## Decisions

### 1. Use `generateText` for report generation

We will use the AI SDK’s `generateText` to produce the full report in one call, then write the result to the output path.

- **Rationale:** The report has a fixed structure (13 sections); we don’t need incremental streaming for correctness. One shot keeps the flow simple and avoids handling partial writes or format boundaries.
- **Alternative considered:** `streamText` and pipe chunks to the file for a “live” feel. Deferred; we can add it later if we want progress UX without changing the contract.

### 2. Provider registry with `providerId:modelId`

We will use the AI SDK’s provider registry (e.g. `createProviderRegistry`) so that `--model` accepts a single string like `openai:gpt-4o` or `anthropic:claude-sonnet-4-5`. The registry will be configured with the providers we support (at least OpenAI and Anthropic); we resolve the language model via `registry.languageModel(modelId)`.

- **Rationale:** Matches [Provider & Model Management](https://sdk.vercel.ai/docs/ai-sdk-core/provider-management): one id string, default `:` separator, each provider uses its own env var.
- **Alternative considered:** Separate `--provider` and `--model` flags. Rejected to keep the CLI minimal and align with the SDK’s convention.

### 3. Validate `--model` when `--report` is set

We will validate that `--model` is present and non-empty when `--report` is true, in the same place we validate other report-related args (e.g. `--output` required). Fail fast with a clear error (e.g. “--model is required when using --report”) before running analysis.

- **Rationale:** Avoids running the full hotspot pipeline only to fail at report time; improves UX and aligns with “required when --report” from the proposal.
- **Alternative considered:** Allowing report to run and failing inside `runAnalysis`. Rejected in favor of early validation.

### 4. Prompt as a single user (or system + user) message

We will keep the current flow: read `prompt.md`, substitute `INPUT_FILE_PATH` and `OUTPUT_FILE_PATH`, and pass the result as the prompt to `generateText`. Whether we use a single `prompt` string or a `messages` array (e.g. system + user) is an implementation detail; the important part is that the model receives the same instructions and context as today.

- **Rationale:** No change to the prompt’s content or structure; only the transport (SDK call instead of agent CLI) changes.

Report generation may use AI SDK **tools** (e.g. `read_report` to load the hotspot JSON, `read_file` to read repository source files) so the model can base the report on actual data and code. The prompt instructs the model to call these tools; the contract (generate text, then write to `{base}.md`) is unchanged.

### 5. Minimal provider set at first: OpenAI and Anthropic

We will ship with `@ai-sdk/openai` and `@ai-sdk/anthropic` in the registry. Other providers (e.g. Google, Mistral) can be added later by extending the registry and documenting their env vars.

- **Rationale:** Covers the most common cases; keeps initial scope and dependency set small. Adding a provider is a small, localized change (registry + docs).

### 6. Error messages for missing API keys

When the SDK throws (e.g. 401 / invalid or missing key), we will catch and, where possible, suggest the relevant env var based on the provider prefix of `--model` (e.g. “Set OPENAI_API_KEY for the OpenAI provider”).

- **Rationale:** Users often forget to set the right key; a hint reduces support burden and matches the “document env vars per provider” requirement.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| User passes an unsupported or invalid `--model` value | Validate format (e.g. `provider:model`) and that the provider is in our registry; fail with a clear message listing supported providers or examples. |
| Provider or model renames in the SDK | Pin or range SDK/provider package versions; document supported model ids in README; treat new models as non-breaking additions. |
| Large context (big repo + hotspot JSON) exceeds model limits | Document context limits per provider/model; consider truncation or summarization in a future iteration (out of scope here). |
| Report quality varies by model | Acceptable; we keep the same prompt and format. Users choose the model; we don’t guarantee quality across providers. |
| Tests depend on real API calls | Use a test double or mock for the AI SDK (e.g. inject a model that returns fixed text) so tests are deterministic and don’t require keys. |

## Migration Plan

1. **Implement**  
   Add `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`; implement provider registry and `--model` parsing; rewrite `analyze.ts` to use `generateText` and write the report to the output path; add `--model` to args and validate when `--report` is set; update README and help with `--model` and env vars.

2. **Testing**  
   Unit tests: args validation (e.g. `--report` without `--model` fails); report generation path with a mocked model. No change to hotspot/coupling tests unless they currently depend on the agent.

3. **Deploy**  
   No separate migration step: behavior is “report only works with `--model`” and no default. Users who previously used `--report` must add `--model` and the appropriate API key.

4. **Rollback**  
   Revert the change; previous behavior (Cursor agent) returns. No data migration.

## Open Questions

- **Optional:** Support a config file (e.g. `.hotspotterrc`) for default `model` so users don’t have to pass `--model` every time? Proposal says no default; we could allow default-from-config as a follow-up.
- **Optional:** Add `streamText` and stream the report to the file for progress feedback? Deferred unless we see demand.
