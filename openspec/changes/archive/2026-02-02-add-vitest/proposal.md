# Proposal: Add Vitest

## Why

The codebase has no tests today, which makes refactors and new features riskier. Adding a test framework now establishes a baseline so we can grow test coverage over time. Vitest fits this repo: native ESM and TypeScript, fast feedback, and good support for mocking Node/CLI code (e.g. git calls).

## What Changes

- Add **Vitest** as the test framework (install, config, npm scripts).
- Add a **test script** (e.g. `npm test` / `vitest`, plus `vitest run` for CI).
- Add **initial tests** for the easiest, high-value surface: argument parsing (`args.ts`) and CSV formatting (`formatter.ts`). These are pure logic and need no mocks. Test files live next to the file under test (e.g. `args.test.ts` beside `args.ts`).
- Optionally add **coverage** (e.g. `@vitest/coverage-v8`) and a `test:coverage` script; can be deferred.

## Capabilities

### New Capabilities

- **testing**: The project can run unit tests via Vitest. Test files live next to the file under test (colocated). Developers can execute tests locally and in CI; the framework is configured for ESM + TypeScript and supports mocking (e.g. for git or file I/O).

### Modified Capabilities

- None. There are no existing OpenSpec specs in this repo.

## Impact

- **Dependencies**: New devDependency `vitest`; optionally `@vitest/coverage-v8`.
- **Config**: New `vitest.config.ts` (or equivalent) aligned with existing `tsconfig.json` and ESM.
- **Scripts**: New `test` (and optionally `test:run`, `test:coverage`) in `package.json`.
- **Code**: New test files next to source (e.g. `src/args.test.ts`, `src/formatter.test.ts`).
- **CI**: Can add a step to run `npm run test` (or `vitest run`) if a pipeline exists; otherwise out of scope for this change.
