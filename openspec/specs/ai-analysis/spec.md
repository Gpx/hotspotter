# AI Analysis

## Overview

Report generation is triggered by running the single `hotspotter` command with the `--report` flag. When `--report` is set, hotspot data JSON is written to the path derived from `--output`, and the system invokes the Vercel AI SDK with a user-specified model to produce the structured markdown report, which is written directly to the derived report path. There is no separate `hotspotter-analyze` binary. The user must supply `--model` when using `--report`; there is no default model.

## Workflow

When the user runs `hotspotter --report --output <base> --model <model-id> ...`:

1. Data gathering runs and JSON is written to `{base}.json`
2. The AI SDK is invoked with the resolved model and the assembled prompt (and any tools, e.g. to read the report JSON and repository files)
3. The markdown report is written directly to `{base}.md` with the same format and sections as before (no interactive step)

## Invocation

```bash
hotspotter --path /path/to/repo --since "12 months ago" --report --output report --model openai:gpt-4o
```

This writes `report.json` and `report.md`. Set the appropriate provider environment variable (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) for the chosen model.

## Requirements

### Requirement: Report generation is invoked via AI SDK with configurable model

Report generation SHALL be performed by calling the Vercel AI SDK (e.g. `generateText`) with a model resolved from the user-supplied `--model` value (format `providerId:modelId`, e.g. `openai:gpt-4o`, `anthropic:claude-sonnet-4-5`). The system SHALL use the same prompt template and report format as before; only the execution mechanism (SDK call instead of spawning an external agent process) changes. The system SHALL write the generated report directly to the derived output path (`{base}.md`) without any interactive save step.

#### Scenario: Report generated and written to output path

- **WHEN** the user runs hotspotter with `--report`, `--output <base>`, and required `--model <model-id>`, and the chosen provider's API key is set in the environment
- **THEN** the system invokes the AI SDK with the resolved model and the assembled prompt, and writes the full markdown report to `{base}.md`

#### Scenario: Provider uses correct API key from environment

- **WHEN** the user specifies a model id that implies a provider (e.g. `openai:gpt-4o` implies OpenAI)
- **THEN** the system SHALL use that provider's default environment variable (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) for authentication; the user only needs to set the env var for the provider they use

### Requirement: Model selection is required for report generation

When report generation is requested (`--report` is set), the user MUST supply a model via the required `--model` flag. There SHALL be no default model.

#### Scenario: Report requested without model fails validation

- **WHEN** the user runs hotspotter with `--report` and `--output` but omits `--model`
- **THEN** the system SHALL fail with a clear error that `--model` is required when using `--report`

#### Scenario: Report requested with valid model proceeds

- **WHEN** the user runs hotspotter with `--report`, `--output`, and `--model openai:gpt-4o`
- **THEN** the system SHALL resolve the model and proceed with report generation (subject to API key and runtime success)

## Report Format

The generated report follows a strict format with 13 mandatory sections:

1. **Title + front matter** — Title line (# Refactoring Opportunities Report: [scope]), date range, then Author/Role/Scope/Methodology/Intended audience block (Giorgio Polvara, Staff Engineer, scope, Git history analysis + manual code review)
2. **TL;DR** — Boxed summary (5–7 bullets) with concrete numbers for stakeholders
3. **About This Report** — Explanation of methodology and purpose
4. **Why this happened** — Organizational context (long-lived ownership, feature pressure, missing refactoring budget)
5. **What not to do** — Constraints (no rewrite from scratch, no blocking features, no all-at-once migrations)
6. **Analysis Parameters** — Repository name, analysis period, start/end commit hashes (when available), thresholds, and excluded patterns
7. **Scoring model** — Explanation of High/Medium/Low badges (change frequency, LOC, coupling, business criticality)
8. **Executive Summary** — High-level overview of findings
9. **Priority Recommendations** — Top 3–5 refactoring priorities with impact estimates
10. **Hotspot Clusters** — Groups of coupled files with refactoring recommendations
11. **High-Risk Areas** — Problematic files with business impact (revenue risk, onboarding cost, blast radius)
12. **Systemic Issues Identified** — Patterns and architectural concerns
13. **How to use this report** — Guidance on using different sections and re-running periodically

Each section (except Title) includes an audience note (_Audience: EMs / PMs_ or _Audience: Staff Engineers / Tech Leads_) to help readers navigate the report. Authorship is stated in two places: (1) front matter right under the title (Author, Role, Scope, Methodology, Intended audience); (2) an "Authorship" note at the end of About This Report, in third-person factual language, tying the author's name to judgment and accountability.

The model may read the hotspot JSON and actual source code files (e.g. via tools) to provide code-aware recommendations based on implementation details, not just metadata. The report emphasizes business framing, avoids blame, and frames findings as system problems rather than team failures.

## Command-Line Arguments

Report generation uses the same arguments as the main `hotspotter` command. When `--report` is set, `--model` is required (format `provider:model`), `--path` is the workspace (repository), and `--output` is the base path for both the hotspot data JSON and the report markdown (see [Hotspotter](hotspotter) spec).
