# Proposal: Unify Hotspotter CLI

## Why

Today users run two commands: `hotspotter` (Phase 1: git data) and `hotspotter-analyze` (Phase 2: AI report). That two-step workflow is easy to forget and adds friction. A single command with an optional `--report` flag keeps one entrypoint and lets users choose “data only” or “data + report” without switching tools.

## What Changes

- **Single `hotspotter` command** with optional `--report`. Without `--report`, run Phase 1 only and show output (table or JSON to `--output`); then stop. With `--report`, run Phase 1, then the analysis step, and write both JSON and markdown report.
- **Single `--output`** for both artifacts: without `--report`, `--output` is the JSON path only (current behavior). With `--report`, `--output` is a base path: write `{base}.json` and `{base}.md`.
- **BREAKING**: Remove `hotspotter-analyze` from `package.json` bin. There is no separate “analyze only” command.
- When `--report` is set, require `--output` (or define a default base path) so both files have a destination.
- Analysis step (workspace, model) is unchanged; it is invoked internally when `--report` is set.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- **hotspotter**: CLI is a single command. New flag `--report`; `--output` semantics extended so that with `--report` it is the base path for both JSON and report. Phase 1 behavior unchanged when `--report` is not set.
- **ai-analysis**: No longer a standalone CLI. Report generation is triggered by `hotspotter --report`; the same analysis logic runs with Phase 1 JSON (written to the derived path). Invocation and contract (file path in, report path out) unchanged; only the entrypoint is removed.

## Impact

- **package.json**: Remove `hotspotter-analyze` from `bin`; only `hotspotter` remains.
- **src/index.ts**: Add `--report`; when set, after Phase 1 write JSON (and report path) from `--output` base, then invoke analysis step (same logic as current `analyze.ts`).
- **src/analyze.ts**: Logic is reused by the main CLI (e.g. extracted so `index.ts` can call it). The file may remain as a module or be inlined; the binary entrypoint is removed.
- **Users**: Existing two-step usage (“run hotspotter, then hotspotter-analyze”) becomes a single `hotspotter --report --output <base> ...` call.
