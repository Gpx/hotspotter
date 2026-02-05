# Multi-Model Support — Proposal

## Why

Report generation is currently tied to Cursor’s `agent` CLI: hotspotter spawns `agent` with a prompt and workspace, and the user must have Cursor Agent installed and in PATH. That locks users into a single vendor and blocks anyone who prefers or has access only to other models (e.g. OpenAI, Anthropic, local models). Using the [Vercel AI SDK](https://ai-sdk.dev/) gives a single, provider-agnostic API so we can support any model the user wants or has access to, without depending on Cursor.

## What Changes

- **Replace Cursor agent with AI SDK**: Report generation will call the AI SDK (e.g. `generateText` or `streamText`) instead of spawning the `agent` process. The same prompt and report format are preserved; only the execution backend changes.
- **`--model` flag**: A new `--model` flag is **required** when `--report` is set: users must specify which model to use for report generation (e.g. `openai:gpt-4o`, `anthropic:claude-3-5-sonnet`). There is no default model.
- **API keys (multi-model)**: There is no single “multi-model” API key. Per the [AI SDK provider docs](https://sdk.vercel.ai/docs/ai-sdk-core/provider-management), each provider reads its own environment variable for authentication. For example: OpenAI uses `OPENAI_API_KEY`, Anthropic uses `ANTHROPIC_API_KEY` (or `ANTHROPIC_AUTH_TOKEN`). The `--model` value (e.g. `openai:gpt-4o`, `anthropic:claude-sonnet-4-5`) identifies the provider; we resolve the model via the SDK (e.g. provider registry with `providerId:modelId`), and the SDK uses that provider’s env var. The user only needs the key for the provider they actually use. Document which env var is required for each supported provider in README and help.
- **BREAKING**: The current “interactive” flow (agent runs in a terminal and may ask to save) is removed. Report generation will write the markdown report directly to the derived output path, consistent with the existing spec (write to `{base}.md`).
- **No change** to: hotspot detection, coupling analysis, JSON output shape, report format (13 sections), or the need to read source files for code-aware recommendations. The prompt and report structure stay the same.

## Capabilities

### New Capabilities

None. This change only modifies how the existing “AI analysis” step is implemented.

### Modified Capabilities

- **ai-analysis**: Report generation will use the Vercel AI SDK with a configurable model/provider instead of the Cursor `agent` CLI. Requirements that change: (1) how the AI is invoked (SDK calls, not process spawn); (2) what configuration is required (required `--model`, API keys via env); (3) report is written directly to the output path (no interactive save step). The workflow (data → AI → report path), report format, and use of workspace/source files remain as specified.
- **hotspotter**: CLI will require `--model <model-id>` when `--report` is set; `--output` and `--report` behavior otherwise unchanged.

## Impact

- **Code**: `src/analyze.ts` will be rewritten to use the AI SDK instead of `spawn("agent", ...)`. Prompt loading and variable substitution can stay; execution becomes SDK-based with provider-specific clients.
- **CLI / args**: `src/args.ts` (and CLI definition) will add the `--model` option for report generation; existing args unchanged.
- **Dependencies**: Add the `ai` package ([Vercel AI SDK](https://ai-sdk.dev/)); add provider-specific packages as needed (e.g. `@ai-sdk/openai`, `@ai-sdk/anthropic`) per SDK docs.
- **Documentation**: README and help text must document the required `--model` flag and environment variables (API keys) for each supported provider.
- **Testing**: Tests that currently mock or assume the agent process will need to be updated to mock the AI SDK or use a test double; report output format tests can remain.
