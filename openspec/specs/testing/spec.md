# Testing

## Requirements

### Requirement: Run unit tests via Vitest

The project SHALL use Vitest as the test framework. Developers MUST be able to run tests from the command line. The framework MUST support TypeScript and ESM without a separate compile step for tests.

#### Scenario: Run tests in watch mode

- **WHEN** a developer runs the project test script (e.g. `npm test`)
- **THEN** Vitest runs in watch mode and executes all test files matching the project's test pattern
- **AND** tests run in the project's TypeScript/ESM environment

#### Scenario: Run tests once (CI)

- **WHEN** a developer or CI runs the one-shot test command (e.g. `npm run test:run` or `vitest run`)
- **THEN** Vitest runs all tests once and exits with code 0 on success or non-zero on failure
- **AND** output indicates passed/failed counts

### Requirement: Test files are colocated

Test files MUST live next to the source file under test. The test file name SHALL be the source file name with `.test.ts` before the extension (e.g. `args.ts` → `args.test.ts`).

#### Scenario: Test file location

- **WHEN** a developer adds a unit test for a source file `src/foo.ts`
- **THEN** the test file MUST be `src/foo.test.ts`
- **AND** Vitest MUST discover and run it without extra configuration

### Requirement: Support mocking Node and CLI behavior

The test setup MUST allow mocking Node built-ins and external behavior (e.g. `child_process`, file system) so that tests for code that calls git or reads files can run without side effects. The framework SHALL provide a supported way to mock modules or functions (e.g. Vitest's `vi.mock`, `vi.spyOn`).

#### Scenario: Mocked dependency in test

- **WHEN** a test mocks a dependency (e.g. `child_process.exec`)
- **THEN** the code under test uses the mock when the test runs
- **AND** the test can assert on mock calls or return controlled values

### Requirement: Initial tests for args and formatter

The change SHALL add at least one test file for `src/args.ts` (argument parsing and validation) and at least one for `src/formatter.ts` (CSV formatting). These modules are pure logic and SHALL NOT require mocking in the initial tests.

#### Scenario: Args validation tests

- **WHEN** tests for `args.ts` run
- **THEN** they cover valid options (percentage, limit, couplingThreshold, exclude patterns)
- **AND** they cover invalid options (e.g. percentage out of range, invalid regex) and assert that an error is thrown

#### Scenario: Formatter tests

- **WHEN** tests for `formatter.ts` run
- **THEN** they cover empty results (e.g. "No hotspots found.")
- **AND** they cover non-empty results with correct CSV header and row formatting, including escaping of commas and quotes
