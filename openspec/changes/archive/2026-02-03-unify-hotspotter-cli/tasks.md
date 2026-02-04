## 1. CLI surface

- [x] 1.1 Add `--report` flag to the hotspotter program (Commander option; no behavior yet).
- [x] 1.2 Implement base-path derivation from `--output` when `--report` is set: strip extension to get base, then `{base}.json` and `{base}.md`. When `--report` is not set, keep current behavior: `--output` is the literal JSON path.
- [x] 1.3 When `--report` is set, require `--output` (or use a default base path) and validate before running Phase 1.

## 2. Phase 1 output and report wiring

- [x] 2.1 When `--report` is set, after Phase 1 write JSON to the derived path `{base}.json` (same structure as today). If `--report` is not set, keep existing behavior (table or JSON to `--output`).
- [x] 2.2 Extract or reuse the analysis step from `src/analyze.ts` so it can be invoked with (input JSON path, output report path, workspace path, optional model). Do not change agent or prompt behavior.
- [x] 2.3 When `--report` is set, after writing Phase 1 JSON, invoke the analysis step with the derived JSON path, derived report path `{base}.md`, workspace from `--path`, and optional `--model`. Pass through any existing analysis options.

## 3. Remove separate analyze binary

- [x] 3.1 Remove `hotspotter-analyze` from `package.json` `bin`. Only `hotspotter` remains.
- [x] 3.2 Ensure `src/analyze.ts` is no longer an entrypoint; its logic is either called from `src/index.ts` or required as a module. Delete or refactor the Commander program in `analyze.ts` so it is not a standalone script.

## 4. Tests

- [x] 4.1 Add or update tests for argument parsing: `--report` present/absent, `--output` with and without `--report`, and base-path derivation (`{base}.json`, `{base}.md`).
- [x] 4.2 Add tests (or integration-style tests) that when `--report` is set the analysis step is invoked with the correct paths; use mocks for the actual agent spawn so tests do not depend on the agent binary.
