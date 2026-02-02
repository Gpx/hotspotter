## 1. Setup

- [x] 1.1 Add `vitest` as a devDependency (e.g. `npm install -D vitest`)
- [x] 1.2 Add `vitest.config.ts` at repo root: ESM + TypeScript, include `src/**/*.test.ts` (or rely on default), aligned with existing tsconfig
- [x] 1.3 Add npm scripts to `package.json`: `test` → `vitest`, `test:run` → `vitest run`
- [x] 1.4 Run `npm run test:run` and confirm it runs (zero tests is OK); fix any config issues until the command exits successfully

## 2. Args tests

- [x] 2.1 Add `src/args.test.ts`: tests for valid options (percentage, limit, couplingThreshold, exclude patterns) and that `parseArgs` returns the expected shape
- [x] 2.2 Add tests for invalid options: percentage out of range or not a number, limit ≤ 0, couplingThreshold < 0, invalid regex in exclude — assert that an error is thrown
- [x] 2.3 Run `npm run test:run` and fix until args tests pass

## 3. Formatter tests

- [x] 3.1 Add `src/formatter.test.ts`: test empty results (e.g. `formatAsTable([])` returns "No hotspots found.")
- [x] 3.2 Add tests for non-empty results: correct CSV header, row data (file, modificationCount, linesOfCode), and escaping of commas and quotes in file paths
- [x] 3.3 Run `npm run test:run` and fix until formatter tests pass

## 4. Verify

- [x] 4.1 Run full test suite (`npm run test:run`) and confirm all tests pass
- [x] 4.2 Optionally run `npm test` and confirm watch mode works (manual check)
