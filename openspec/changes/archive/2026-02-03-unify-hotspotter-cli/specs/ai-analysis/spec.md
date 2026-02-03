# AI Analysis (unify-hotspotter-cli)

## MODIFIED Requirements

### Requirement: Report generation via hotspotter

Report generation SHALL be triggered by running the single `hotspotter` command with the `--report` flag. The same analysis logic (AI agent, prompt, report format) SHALL run when `--report` is set; Phase 1 JSON SHALL be written to the path derived from `--output` and the agent SHALL read that file and write the report to the derived report path. There SHALL be no separate `hotspotter-analyze` binary.

#### Scenario: Report via unified command

- **WHEN** the user runs `hotspotter --path <path> --since <date> --report --output <base>`
- **THEN** Phase 1 runs and JSON is written to `{base}.json`
- **AND** the analysis step runs with that JSON path and workspace from `--path`
- **AND** the markdown report is written to `{base}.md` with the same format and sections as before

## REMOVED Requirements

### Requirement: Standalone hotspotter-analyze CLI

**Reason**: Unified into the single `hotspotter` command; report generation is triggered by `--report`.

**Migration**: Use `hotspotter --report --output <base> --path <path> --since <date> ...` instead of running `hotspotter --output hotspots.json ...` then `hotspotter-analyze --input hotspots.json --output report.md --workspace <path>`.
