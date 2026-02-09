# Proposal: Reduce AI usage in report generation

## Why

Report generation currently sends the full 13-section report to the AI: the model reads the hotspot JSON and optionally source files, then writes the entire markdown. That maximizes API cost, latency, and dependency on external providers. We can keep the same report format and reader experience while generating everything that is derivable from the hotspot data and fixed copy with templates, and reserve AI only for the parts that genuinely need code understanding or narrative judgment (business criticality, refactoring recommendations, executive summary, systemic issues). Reducing AI usage lowers cost and latency and makes the tool more reliable when APIs are unavailable or rate-limited.

## What Changes

- **Template-first report assembly**: Add a report builder that produces the full report structure from the hotspot JSON. Sections that are fully derivable from data or fixed text (Analysis Parameters, Scoring model explanation, fixed boilerplate such as "Why this happened", "What not to do", "How to use this report", cluster/file lists with badges from JSON) are filled by templates and code—no AI call for those.
- **Scoped AI usage**: Invoke the AI only for content that benefits from code awareness or synthesis: e.g. business criticality per file, refactoring recommendations per cluster, Executive Summary, TL;DR, Priority Recommendations rationale, Systemic Issues. The AI receives a smaller, focused prompt (and optionally read_file) and returns only those sections or structured snippets, which are then merged into the pre-built report.
- **Same output contract**: The final report remains the same 13-section format and audience notes; only the production path changes (template + limited AI instead of one big AI-generated document).
- **No new CLI flags required initially**: Existing `--report` and `--model` behavior is preserved; implementation may introduce optional flags later (e.g. to disable AI for a fully template-only report) if we document that in specs.

## Capabilities

### New Capabilities

- None. This change only modifies how the existing report is produced.

### Modified Capabilities

- **ai-analysis**: Report generation SHALL minimize AI usage by assembling the report from templates and hotspot data first, then calling the AI only for sections or fields that require code understanding or narrative synthesis (e.g. business criticality, refactoring recommendations, executive summary, TL;DR, priority rationale, systemic issues). The delivered report SHALL still satisfy the same 13-section format and audience notes. Requirements for model selection, provider API keys, and output paths remain; the invocation contract (when and how often the AI is called, and with what payload) will be specified in the spec.

## Impact

- **Code**: `src/analyze.ts` (or equivalent) will be refactored to a two-phase flow: (1) build report skeleton and fill deterministic sections from JSON + templates; (2) call the AI with a reduced prompt and merge AI output into the report. New or shared template/formatting logic may live in a dedicated module. `src/prompt.md` will be split or reduced to the prompt(s) used only for the AI-scoped parts.
- **Dependencies**: No new runtime dependencies; existing AI SDK usage remains.
- **Specs**: `openspec/specs/ai-analysis/spec.md` will be updated (via delta in this change) to describe the template-first workflow and the scoped AI usage (which sections or data are AI-generated vs template-filled).
