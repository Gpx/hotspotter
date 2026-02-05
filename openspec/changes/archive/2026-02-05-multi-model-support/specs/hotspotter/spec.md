# Hotspotter (CLI) (delta)

## MODIFIED Requirements

### Requirement: Report generation requires --model when --report is set

When the user sets `--report`, the CLI SHALL require the `--model <model-id>` argument. The `--model` value SHALL identify the AI model used for report generation (e.g. `openai:gpt-4o`, `anthropic:claude-sonnet-4-5`). There SHALL be no default model when `--report` is set. All other report-related behavior (`--output` as base path for JSON and report, `--path` as workspace) remains unchanged.

#### Scenario: Validation fails when --report is set without --model

- **WHEN** the user invokes hotspotter with `--report` and `--output <path>` but does not provide `--model`
- **THEN** the CLI SHALL exit with an error stating that `--model` is required when using `--report`

#### Scenario: Validation succeeds when --report and --model are both provided

- **WHEN** the user invokes hotspotter with `--report`, `--output <base>`, and `--model openai:gpt-4o`
- **THEN** the CLI SHALL accept the arguments and proceed (report generation will use the given model subject to API key and runtime success)

#### Scenario: --model is irrelevant when --report is not set

- **WHEN** the user invokes hotspotter without `--report` (e.g. only `--path` and `--since`)
- **THEN** the CLI SHALL NOT require `--model`; `--model` MAY be omitted or ignored when `--report` is not set
