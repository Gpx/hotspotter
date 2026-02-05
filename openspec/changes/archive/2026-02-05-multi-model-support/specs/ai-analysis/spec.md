# AI Analysis (delta)

## MODIFIED Requirements

### Requirement: Report generation is invoked via AI SDK with configurable model

Report generation SHALL be performed by calling the Vercel AI SDK (e.g. `generateText`) with a model resolved from the user-supplied `--model` value (format `providerId:modelId`, e.g. `openai:gpt-4o`, `anthropic:claude-sonnet-4-5`). The system SHALL use the same prompt template and report format as before; only the execution mechanism (SDK call instead of spawning an external agent process) changes. The system SHALL write the generated report directly to the derived output path (`{base}.md`) without any interactive save step.

#### Scenario: Report generated and written to output path

- **WHEN** the user runs hotspotter with `--report`, `--output <base>`, and required `--model <model-id>`, and the chosen provider’s API key is set in the environment
- **THEN** the system invokes the AI SDK with the resolved model and the assembled prompt, and writes the full markdown report to `{base}.md`

#### Scenario: Provider uses correct API key from environment

- **WHEN** the user specifies a model id that implies a provider (e.g. `openai:gpt-4o` implies OpenAI)
- **THEN** the system SHALL use that provider’s default environment variable (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) for authentication; the user only needs to set the env var for the provider they use

### Requirement: Model selection is required for report generation

When report generation is requested (`--report` is set), the user MUST supply a model via the required `--model` flag. There SHALL be no default model.

#### Scenario: Report requested without model fails validation

- **WHEN** the user runs hotspotter with `--report` and `--output` but omits `--model`
- **THEN** the system SHALL fail with a clear error that `--model` is required when using `--report`

#### Scenario: Report requested with valid model proceeds

- **WHEN** the user runs hotspotter with `--report`, `--output`, and `--model openai:gpt-4o`
- **THEN** the system SHALL resolve the model and proceed with report generation (subject to API key and runtime success)

## REMOVED Requirements

### Requirement: Report generation uses Cursor agent process

**Reason:** Replaced by AI SDK–based report generation so users can choose any supported model/provider (e.g. OpenAI, Anthropic) via `--model` and the corresponding API key, without depending on Cursor.

**Migration:** Use `--report --output <base> --model <provider>:<model-id>` and set the appropriate provider environment variable (e.g. `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`). The report is written directly to `{base}.md`; there is no interactive agent step.

### Requirement: Agent runs interactively and may ask user to save report

**Reason:** Report output is now written directly to the derived path by the tool; there is no interactive save step.

**Migration:** No user action required. The report is always written to `{base}.md` when `--report` is used successfully.
