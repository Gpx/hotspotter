# AI Analysis (hotspotter-analyze)

## Overview

After generating a hotspots report with the main Hotspotter CLI, the `hotspotter-analyze` script uses an AI agent to produce human-readable refactoring recommendations. It reads the JSON output from Hotspotter, analyzes hotspot clusters and coupling relationships, and writes a structured markdown report.

## Workflow

The script:

1. Reads the JSON output from the main Hotspotter tool (Phase 1)
2. Analyzes hotspot clusters and coupling relationships
3. Generates human-readable refactoring recommendations
4. Identifies high-risk areas and priority refactoring opportunities

## Invocation

```bash
hotspotter-analyze --input hotspots.json --output analysis.md --workspace /path/to/repo
```

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

- `--input <file>` (required): Path to the JSON output file from Hotspotter
- `--output <file>` (required): Path to the output markdown file for the analysis
- `--workspace <path>` (optional): Workspace directory for context
- `--model <model>` (optional): AI model to use for analysis
