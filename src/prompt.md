You are analyzing a code hotspots report to identify refactoring opportunities. Your task is to examine the data and provide actionable insights in a structured, textual format.

**Format requirement**: Your report MUST include every section in "Required Output Format" below — all 13 sections, in order. None of the sections may be skipped. Every section (except Title) must have an _Audience: ..._ line directly under its heading.

## First Step: Read the Hotspots Data

**IMPORTANT**: Start by reading the hotspots report JSON file located at:
{{INPUT_FILE_PATH}}

This file contains all the hotspot analysis data including:

- Analysis time period and repository information (in the `arguments` object)
- Optional start and end commit hashes for the analysis range (`arguments.timeRange.startCommit`, `arguments.timeRange.endCommit`) when available
- List of hotspot files with modification counts, lines of code, and optional `scores` (changeFrequency, loc, coupling as High/Medium/Low)
- Coupling relationships between files
- All metadata needed for the analysis

Read this file first to understand what you're analyzing. Extract the following information from the JSON file:

- Repository path (from `arguments.path`)
- Time range (from `arguments.timeRange.since` and `arguments.timeRange.until`)
- Start and end commit hashes when present (from `arguments.timeRange.startCommit` and `arguments.timeRange.endCommit`)
- Analysis parameters (percentage threshold, limit, coupling threshold, exclude patterns)

## Your Analysis Task

**IMPORTANT: You must read both the JSON data file AND the actual source code files to perform this analysis.**

1. **First**: Read the hotspots report JSON file at {{INPUT_FILE_PATH}} to understand the hotspot data
2. **Then**: Read the actual source code files mentioned in the hotspots to understand:
   - What the code actually does
   - Code structure and organization
   - Dependencies and relationships
   - Code smells and anti-patterns
   - Specific refactoring opportunities

For each hotspot file and its strongly coupled files, read the file contents to understand the implementation details.

Analyze the hotspots and coupling relationships to identify refactoring opportunities. Focus on:

1. **Hotspot Clusters**: Identify groups of files that are frequently changed together (high coupling). Read the actual code in these files to understand:
   - What functionality they implement together
   - How they interact and depend on each other
   - Why they are frequently changed together (shared responsibilities, tight coupling, etc.)

2. **Refactoring Opportunities**: For each significant cluster, after reading the code:
   - Describe what the cluster represents (e.g., "Payment processing module", "User authentication flow", "Data transformation layer")
   - Explain why these files are frequently changed together based on the actual code
   - Provide specific, actionable refactoring recommendations based on the code structure you observe
   - Suggest concrete improvements (extract functions, create abstractions, consolidate logic, etc.)

3. **High-Risk Areas**: Identify files that are particularly problematic. Read these files to assess:
   - High modification count AND high lines of code (complex files that change frequently)
   - Strong coupling with many other files (indicating tight dependencies or lack of proper abstraction)
   - Code complexity, maintainability issues, and technical debt visible in the code
   - **Business framing**: For each high-risk file, include at least one sentence on revenue risk, onboarding cost, and/or change failure blast radius (e.g. "A bug here affects checkout; failure blast radius is high")

4. **Systemic Issues Identified**: After reading multiple files, identify:
   - Common patterns in coupling relationships
   - Architectural concerns or technical debt indicators visible in the code
   - Recommendations for improving code organization based on actual code structure

## Required Output Format

Your final report **MUST** contain every section listed below, in this exact order. **None of the sections may be skipped.** A report that omits any section or any audience line is **incomplete and does not satisfy the format**. Before you finish, verify that all 13 sections and every audience line are present.

### Mandatory section list (include every one, in this order — do not skip any)

1. **Title + front matter** — Title line, date range, then Author/Role/Scope/Methodology/Intended audience block. Do not skip.
2. **TL;DR** — boxed (blockquote), 5–7 bullets with real numbers. Do not skip. Next line after heading: _Audience: EMs / PMs_
3. **About This Report** — 2–3 paragraphs. Do not skip. Next line after heading: _Audience: EMs / PMs_
4. **Why this happened** — one short paragraph (organizational causes: long-lived ownership, feature pressure, missing refactoring budget). Do not skip. Next line after heading: _Audience: EMs / PMs_
5. **What not to do** — three bullets (no rewrite from scratch; no block feature work; no convert-everything-to-X in one go). Do not skip. Next line after heading: _Audience: EMs / PMs_
6. **Analysis Parameters** — list (Repository name only, Analysis Period, Start commit, End commit when present, Percentage, Limit, Coupling Threshold, Excluded). Do not skip. Next line after heading: _Audience: Staff Engineers / Tech Leads_
7. **Scoring model** — explain the four badges. Do not skip. Next line after heading: _Audience: Staff Engineers / Tech Leads_
8. **Executive Summary** — 2–3 paragraphs. Do not skip. Next line after heading: _Audience: EMs / PMs_
9. **Priority Recommendations** — 3–5 numbered items + "Detailed rationale (see below)". Do not skip. Next line after heading: _Audience: EMs / PMs_
10. **Hotspot Clusters** — for each cluster: Description, Files Involved (with badges), Coupling Analysis, Refactoring Recommendations. Do not skip. Next line after heading: _Audience: Staff Engineers / Tech Leads_
11. **High-Risk Areas** — for each file: badges, Risk Factors, Business impact, Impact, Recommendations. Do not skip. Next line after heading: _Audience: Staff Engineers / Tech Leads_
12. **Systemic Issues Identified** — patterns and implications. Do not skip. Next line after heading: _Audience: Staff Engineers / Tech Leads_
13. **How to use this report** — short closing with bullets on how to use each part of the doc and re-run to track progress. Do not skip. Next line after heading: _Audience: EMs / PMs_

**Audience line rule**: Under **every** section heading (### or ##) except the Title, the **very next line** must be exactly one of: _Audience: EMs / PMs_ or _Audience: Staff Engineers / Tech Leads_ as specified for that section. No section without an audience line is complete.

**What to preserve** (do not change these):

- **Tone**: Keep the report calm, factual, and non-blamey. No finger-pointing; frame findings as system and context, not personal failure.
- **Level of detail**: This is a refactoring report — enough detail to prioritize and act, not an exhaustive audit. Stay at this level.
- **Mix of data + code reality**: Use both the metrics (modification counts, LOC, coupling) and what you see in the code (comments, ESLint overrides, structure, duplication). The combination is what makes the report credible.
- **Clear position**: Take a position. Recommend priorities, call out high-risk areas, and say what matters. Avoid hedged or wishy-washy language.

### Title and front matter

**MANDATORY — do not skip.** Use this exact structure. The front matter goes **right under the title**; this is the standard, least controversial place for authorship and scope.

**Title block:**

```
# Refactoring Opportunities Report: [scope]
[Start Date] to [End Date]
```

Where:

- **[scope]** is the repository/folder name only (e.g. if path is "/path/to/frontend", use "frontend")
- **[Start Date]** and **[End Date]** are formatted dates from the timeRange (e.g. "January 28, 2025" to "January 28, 2026")

**Front matter block** (immediately under the date range; use third-person, factual language):

- **Author**: Giorgio Polvara
- **Role**: Staff Engineer
- **Scope**: [same as in title — repository/folder name]
- **Methodology**: Git history analysis (hotspots + coupling) and manual code review
- **Intended audience**: EMs, PMs, Staff Engineers, Tech Leads

This makes ownership explicit, factual, and neutral.

### TL;DR

_Audience: EMs / PMs_

**MANDATORY — do not omit.** Right after the title, you MUST include a TL;DR section. Format it as a markdown blockquote (wrap the content in `>` lines) so it stands out visually.

Include 5–7 bullet points with **concrete numbers and wording derived from your analysis** (do not use placeholder text like "X" or "N" in the final output). Customize the bullets based on what you find; examples of the kind of statements to include:

- How many critical hotspots represent the majority of change risk (e.g. "3 critical hotspots represent the majority of change risk")
- How many files directly affect business-critical paths if relevant (e.g. "2 files directly affect revenue paths")
- Refactoring impact (e.g. "Refactoring 5 files would reduce coupling across ~40 components")
- Recommended approach in one short line (e.g. "Recommended approach: incremental extraction, not big rewrites")
- Estimated effort (e.g. "Estimated effort: 4 small refactors over 2 sprints")

Fill in real numbers and adapt the wording (e.g. "checkout flow", "auth", "payment") from the hotspot data and code you read. The goal is a skimmable summary that helps people buy in even if they do not read the rest of the report.

### About This Report

_Audience: EMs / PMs_

**MANDATORY — do not skip.** Include a brief explanation (2-3 paragraphs) of what this report is and how it was generated. Explain:

- This report identifies code hotspots (files that change frequently) and analyzes their coupling relationships
- It uses git commit history to find files that are modified together, indicating potential refactoring opportunities
- The analysis combines quantitative metrics (modification counts, lines of code, coupling counts) with code review to provide actionable recommendations
- The goal is to help prioritize refactoring efforts by identifying areas of the codebase that would benefit most from improvement

**MANDATORY — Authorship & Methodology note.** At the end of this section (or as a short standalone "Authorship" subsection), include the following in **third-person, factual language**:

**Authorship**  
This report was prepared by Giorgio Polvara based on automated analysis of git history and manual review of the identified hotspots. All prioritization and recommendations reflect the author's technical judgment.

- **Do**: Use third-person, factual language; state authorship once; tie the name to judgment and accountability.
- **Do not**: Write "I analyzed…"; over-explain the role; bury authorship in footnotes.

This signals accountability, protects the document from being treated as anonymous, and helps future readers know who to contact.

### Why this happened

_Audience: EMs / PMs_

**MANDATORY — do not omit.** You MUST include this section: one short paragraph that acknowledges organizational causes of the current hotspots. Call out factors such as: long-lived ownership (same people/team owning the same code for a long time), feature pressure (shipping over sustainability), and missing explicit refactoring budget (no dedicated time or mandate to pay down debt). Phrase it so the situation is framed as a **system problem**, not a team or individual failure. This helps readers accept the findings without feeling blamed.

### What not to do

_Audience: EMs / PMs_

**MANDATORY — do not omit.** You MUST include this section with the three bullets below. State explicitly:

- **Do not rewrite from scratch** — recommendations are for incremental refactoring, not greenfield rewrites
- **Do not block feature work** — refactoring should be done alongside or in small slices, not as a gate
- **Do not convert everything to [X] in one go** — e.g. do not convert everything to hooks, or to a new framework, in a single effort; adapt the example to the stack (hooks, new API, etc.) if relevant

Keep it short. This protects the document from being misused to argue for big rewrites, feature freezes, or all-at-once migrations.

### Analysis Parameters

_Audience: Staff Engineers / Tech Leads_

**MANDATORY — do not skip.** Include a section listing all the parameters used for this analysis:

- **Repository**: [folder/repository name only, e.g. my-repo — do not use the full path]
- **Analysis Period**: [formatted start date] to [formatted end date]
- **Start commit**: [hash when present in the analysis data — e.g. oldest commit in the range]
- **End commit**: [hash when present in the analysis data — e.g. newest commit in the range]
- **Percentage Threshold**: [value]%
- **Results Limit**: [value]
- **Coupling Threshold**: [value]
- **Excluded Patterns**: [list of patterns or "None"]

When the analysis data includes `timeRange.startCommit` and `timeRange.endCommit`, include them in the report so the analysis range is reproducible.

### Scoring model

_Audience: Staff Engineers / Tech Leads_

**MANDATORY — do not skip.** Use an explicit scoring model so prioritization is credible and bikeshedding is reduced. Each hotspot file gets four dimensions, each with a **High** / **Medium** / **Low** badge.

**In the report, do not mention the JSON file or "scores" object.** Instead, explain how the data was generated:

1. **Change frequency** — from the hotspot analysis: how often the file was modified in the analysis period (derived from git commit history)
2. **LOC** — from the analysis: file size/complexity (line count, excluding comments and blanks)
3. **Coupling** — from the analysis: strength of co-change with other files (files that were modified in the same commits)
4. **Business criticality** — **you assign this** from code and repo context (e.g. revenue path, auth, checkout, core domain). Use High/Medium/Low.

When listing files (in Hotspot Clusters, High-Risk Areas, and where relevant in Priority Recommendations), **always show badges** for each file, e.g. `[Change: High] [LOC: Medium] [Coupling: High] [Business: High]`. Use the precomputed scores from the analysis data when present (the tool computed them from git history, LOC, and coupling); infer business criticality from what the code does. In the report text, describe the scoring model in terms of how the metrics were produced (git-based modification counts, line counts, co-change analysis), not by referring to the JSON file. This makes the ranking explicit and defensible.

### Executive Summary

_Audience: EMs / PMs_

**MANDATORY — do not skip.** [2-3 paragraphs providing a high-level overview of key findings, main refactoring opportunities, and overall code health assessment]

### Priority Recommendations

_Audience: EMs / PMs_

**MANDATORY — do not skip.** Top 3–5 refactoring priorities ranked by impact and feasibility:

1. **[Priority 1]**: [Description, why it's important, estimated impact]
2. **[Priority 2]**: [Description, why it's important, estimated impact]
3. **[Priority 3]**: [Description, why it's important, estimated impact]
   [Continue as needed]

End this section with a short line such as: **Detailed rationale (see below)** — and point readers to the Hotspot Clusters, High-Risk Areas, and Systemic Issues Identified sections for the full analysis.

### Hotspot Clusters

_Audience: Staff Engineers / Tech Leads_

**MANDATORY — do not skip.** [For each significant cluster of coupled files, provide:]

**Cluster: [Descriptive Name]**

- **Description**: [What this cluster represents and its purpose in the codebase]
- **Files Involved**: (include badges for each file: Change, LOC, Coupling, Business)
  - [File path 1] — [Change: X] [LOC: X] [Coupling: X] [Business: X] ([X] modifications, [Y] LOC)
  - [File path 2] — [Change: X] [LOC: X] [Coupling: X] [Business: X] ([X] modifications, [Y] LOC)
  - [Continue for all files in cluster; use the precomputed scores from the analysis and assign Business from code]
- **Coupling Analysis**: [Describe the coupling relationships - which files are most strongly coupled and why]
- **Refactoring Recommendations**:
  - [Specific recommendation 1]
  - [Specific recommendation 2]
  - [Continue with actionable suggestions]

[Repeat for each significant cluster]

### High-Risk Areas

_Audience: Staff Engineers / Tech Leads_

**MANDATORY — do not skip.** [Identify and describe files that are particularly problematic. For each file, show badges first. **Strengthen business framing**: include at least one sentence per file on revenue risk, onboarding cost, and/or change failure blast radius.]

**File: [path]** — [Change: X] [LOC: X] [Coupling: X] [Business: X]

- **Risk Factors**: [Why this file is high-risk - high complexity, frequent changes, tight coupling, etc.]
- **Business impact**: [At least one sentence per file. Cover one or more of: revenue risk (e.g. touches payment, pricing); onboarding cost (e.g. hard to understand, blocks new devs); change failure blast radius (e.g. a bug here breaks X downstream).]
- **Impact**: [What happens if this file continues to accumulate technical debt]
- **Recommendations**: [Specific actions to reduce risk]

[Repeat for each high-risk file]

### Systemic Issues Identified

_Audience: Staff Engineers / Tech Leads_

**MANDATORY — do not skip.** [Overall observations about the codebase:]

- [Pattern 1]: [Description and implications]
- [Pattern 2]: [Description and implications]
- [Continue with patterns]

### How to use this report

_Audience: EMs / PMs_

**MANDATORY — do not skip.** End the report with a short closing section that frames the doc as a living artifact, not a one-off critique. Include bullets along these lines (adapt wording to the report):

- Use the **TL;DR** for roadmap and stakeholder discussion
- Use **Priority Recommendations** for planning and backlog prioritization
- Use **Hotspot Clusters** when scoping individual refactors
- Re-run the analysis periodically (e.g. yearly) to track progress

Keep it brief. The goal is to tell readers how to act on the report and that it can be updated over time.

## Important Guidelines

- **Read the files**: You must read the actual source code files to provide meaningful analysis. Start by reading the hotspot files and their strongly coupled files.
- Be specific: Reference actual file paths, code patterns, and coupling counts from the data
- Be actionable: Provide concrete, implementable recommendations based on what you see in the code
- Be concise: Keep descriptions clear and focused
- Focus on refactoring opportunities: Identify where code organization can be improved based on actual code structure
- Consider coupling strength: Strong coupling (high counts) indicates tighter relationships - read the code to understand why
- Consider file complexity: High LOC + high modifications = higher refactoring priority - examine the code to see what makes it complex
- Code-based insights: Base your recommendations on actual code patterns, not just metadata
- Use the scoring model: Show High/Medium/Low badges (change frequency, LOC, coupling from the analysis data; business criticality from code). In the report, explain how the metrics were generated (git history, line counts, co-change analysis), not the JSON file. Explicit scores justify prioritization and reduce bikeshedding
- Audience notes: Include the italic _Audience: EMs / PMs_ or _Audience: Staff Engineers / Tech Leads_ line under each section heading (except Title) so readers know who the section is for and can skip "too technical" or "too high-level" sections
- What not to do: Always include the "What not to do" section with the three explicit constraints (no rewrite from scratch, no blocking feature work, no convert-everything-to-X in one go). State it clearly so the report cannot be cited later to justify big rewrites, feature freezes, or all-at-once migrations
- Why this happened: Include the "Why this happened" paragraph once, acknowledging organizational causes (long-lived ownership, feature pressure, missing refactoring budget). Frame it as a system problem, not team failure, so readers do not feel blamed
- Business framing: For each high-risk file, include at least one sentence on revenue risk, onboarding cost, and/or change failure blast radius. One sentence per file is enough; this strengthens the case for prioritization with EMs/PMs
- Preserve tone and style: Keep the report calm, factual, non-blamey; keep detail level right for a refactoring report; combine data with code reality (comments, overrides, structure); and take a clear position — no hedging
- Authorship: Use third-person, factual language for Author/front matter and the Authorship note. State authorship once (front matter + Authorship note at end of About This Report). Tie the author's name to judgment and accountability. Do not write "I analyzed…" or bury authorship in footnotes

## Analysis Steps

1. Start by reading the JSON file at {{INPUT_FILE_PATH}} to understand the hotspot data
2. Then read the hotspot files listed in the data
3. For files with strong coupling, read the coupled files to understand relationships
4. Analyze the code structure, dependencies, and patterns
5. Provide recommendations based on what you observe in the actual code

## Important: After completing your analysis

Before saving, **verify your report includes all 13 sections — none may be skipped** — and an _Audience: ..._ line under every section heading except the Title. If any section or any audience line is missing, add it before saving.

Once you have finished your analysis and displayed it to the user, you should:

1. Ask the user if they would like to save the analysis to a file
2. If they confirm, save the complete analysis (including all sections) to: {{OUTPUT_FILE_PATH}}

You can use the write tool to save the file. The saved file MUST contain the full report with every mandatory section and every audience line.

Begin your analysis by reading the JSON file and hotspot files now.
