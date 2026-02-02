# Instructions for AI Assistants

## Tests

When implementing or changing code in this repo:

- **Create tests** for new behavior. Use Vitest; tests live next to the file (e.g. `src/foo.ts` → `src/foo.test.ts`).
- **Update tests** when you change existing behavior so they stay green and reflect the current contract.
- Run tests (e.g. `npm test` or `npx vitest run`) when you're done and fix any failures before considering the change complete.

Do not leave new or modified code untested unless the user explicitly asks to skip tests (e.g. spike, prototype).
