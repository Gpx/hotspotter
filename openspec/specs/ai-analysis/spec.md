# AI Analysis

## Overview

Report generation is triggered by running the single `hotspotter` command with the `--report` flag. The same analysis logic (AI agent, prompt, report format) runs when `--report` is set: hotspot data JSON is written to the path derived from `--output`, and the agent reads that file and writes the structured markdown report to the derived report path. There is no separate `hotspotter-analyze` binary.

## Workflow

When the user runs `hotspotter --report --output <base> ...`:

1. Data gathering runs and JSON is written to `{base}.json`
2. The AI agent runs with that JSON path and workspace from `--path`
3. The markdown report is written to `{base}.md` with the same format and sections as before

## Invocation

```bash
hotspotter --path /path/to/repo --since "12 months ago" --report --output report
```

This writes `report.json` and `report.md`.

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

The agent reads the actual source code files to provide code-aware recommendations based on implementation details, not just metadata. The report emphasizes business framing, avoids blame, and frames findings as system problems rather than team failures.

## Command-Line Arguments

Report generation uses the same arguments as the main `hotspotter` command. When `--report` is set, `--path` is the workspace (repository) for the agent, and `--output` is the base path for both the hotspot data JSON and the report markdown (see [Hotspotter](hotspotter) spec).
