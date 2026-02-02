# Design: Add Vitest

## Context

Hotspotter is a TypeScript/Node CLI (ESM, `"type": "module"`) with no tests today. Source lives under `src/`; build output goes to `dist/`. The codebase includes pure logic (e.g. `args.ts`, `formatter.ts`) and code that calls out to git and the file system (e.g. `dateResolver.ts`, `analyzer.ts`). Adding a test framework establishes a baseline and allows tests to be added incrementally. Vitest was chosen for native ESM + TypeScript support, speed, and mocking (vi.mock / vi.spyOn) suitable for Node/CLI code.

## Goals / Non-Goals

**Goals:**

- Install and configure Vitest so tests run with the existing TS/ESM setup.
- Add npm scripts for watch mode (`test`) and one-shot runs (`test:run`) for CI.
- Use a colocated test layout: `src/<file>.test.ts` next to `src/<file>.ts`.
- Add initial tests for `args.ts` and `formatter.ts` (pure logic, no mocks).
- Ensure the test runner discovers `*.test.ts` under `src/` by default or via minimal config.

**Non-Goals:**

- Coverage tooling and `test:coverage` in this change (can be added later).
- Tests for `dateResolver` or other git-dependent code (requires mocking; can follow in a later change).
- CI pipeline changes (out of scope unless the repo already has a pipeline and we add a single step).

## Decisions

### 1. Config file: `vitest.config.ts`

Use a root-level `vitest.config.ts` so Vitest shares the project's TypeScript and module settings. Extend or reference `tsconfig.json` (e.g. `defineConfig` with `test` include for `src/**/*.test.ts`) and ensure ESM is used. Alternative considered: inlining config in `package.json`; rejected for clarity and room for future options (e.g. globals, env).

### 2. Scripts in `package.json`

- **`test`**: `vitest` — watch mode for local development.
- **`test:run`**: `vitest run` — single run, exit code for CI.

No `test:coverage` in this change.

### 3. Test file pattern: `*.test.ts` colocated in `src/`

Tests live next to source (`src/foo.ts` → `src/foo.test.ts`). Vitest's default include pattern can stay as-is (e.g. `**/*.test.ts`) or be set explicitly to `src/**/*.test.ts` if we want to exclude any other dirs. No separate `test/` directory. Aligns with proposal and AGENTS.md.

### 4. Initial test scope: args and formatter only

Add `src/args.test.ts` and `src/formatter.test.ts`. Both modules are pure; no mocks. Cover: valid/invalid options and error handling for args; empty and non-empty CSV output and escaping for formatter. Leave `dateResolver` and analyzer for a follow-up (they need git/filesystem mocks).

### 5. No Vitest globals by default

Use explicit `import { describe, it, expect, vi } from 'vitest'` unless we enable `globals` in config. Keeps types and IDE support clear without extra config.

## Risks / Trade-offs

- **Vitest version churn**: Vitest is fast-moving. Mitigation: pin to a minor version in package.json and upgrade deliberately.
- **Colocated tests in `src/`**: Some repos prefer a top-level `test/` to keep `src` "code only". Trade-off: colocation is chosen for discoverability and alignment with AGENTS.md; we can document the convention in README if needed.
- **No coverage yet**: First PR doesn't enforce coverage. Mitigation: add coverage in a follow-up and optionally set a minimum in CI.

## Migration Plan

1. Add `vitest` as a devDependency; add `vitest.config.ts`.
2. Add `test` and `test:run` scripts to `package.json`.
3. Add `src/args.test.ts` and `src/formatter.test.ts`; run `npm run test:run` and fix until green.
4. Optionally add a CI step (e.g. `npm run test:run`) if the repo has a pipeline. No rollback needed; removing Vitest is a revert of the same changes.

## Open Questions

- None. Scope is narrow; open questions can be handled in follow-up (e.g. coverage, tests for dateResolver).
