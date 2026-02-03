# Hotspotter (unify-hotspotter-cli)

## MODIFIED Requirements

### Requirement: Single CLI entrypoint and report flag

The tool SHALL expose a single command `hotspotter`. Phase 2 (AI-powered refactoring report) SHALL be triggered by an optional `--report` flag. When `--report` is not set, only Phase 1 (hotspot detection and coupling) runs and the process exits after output.

#### Scenario: Without --report

- **WHEN** the user runs `hotspotter --path <path> --since <date>` without `--report`
- **THEN** Phase 1 (hotspot detection and coupling) runs
- **AND** output is either CSV to stdout (if `--output` is not set) or JSON written to the path given by `--output`
- **AND** the process exits without running the analysis step

#### Scenario: With --report

- **WHEN** the user runs `hotspotter --path <path> --since <date> --report --output <base>`
- **THEN** Phase 1 runs
- **AND** JSON is written to `{base}.json` and the markdown report is written to `{base}.md`
- **AND** the analysis step (AI agent) runs and writes the report to the derived path

### Requirement: Output path semantics

The `--output` flag SHALL control where Phase 1 output is written. When `--report` is not set, `--output` is the literal path for the JSON file (or omitted for CSV to stdout). When `--report` is set, `--output` SHALL be interpreted as a base path: JSON at `{base}.json` and report at `{base}.md` (extension stripped from the given path to form the base, if present).

#### Scenario: No report, no output

- **WHEN** the user runs `hotspotter` without `--output` and without `--report`
- **THEN** Phase 1 results are displayed as CSV on stdout

#### Scenario: No report, with output

- **WHEN** the user runs `hotspotter` with `--output <path>` and without `--report`
- **THEN** Phase 1 JSON is written to the literal path `<path>`

#### Scenario: Report, with output

- **WHEN** the user runs `hotspotter` with `--report` and `--output <base>` (e.g. `report` or `report.md`)
- **THEN** Phase 1 JSON is written to `{base}.json`
- **AND** the markdown report is written to `{base}.md`

### Requirement: Command-line arguments for report mode

When `--report` is set, `--output` SHALL be required (or a default base path SHALL be used) so both JSON and report have a destination. The repository path for the analysis step SHALL be taken from `--path`. An optional `--model` flag MAY be passed through to the analysis step.

#### Scenario: Report requires output

- **WHEN** the user runs `hotspotter --report ...` with `--output <base>` set
- **THEN** both `{base}.json` and `{base}.md` are written
