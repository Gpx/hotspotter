# Hotspots Report - Project Specification

## Overview

Hotspots Report is a command-line tool that analyzes a code repository to identify hotspots - files or sections of code that are likely in need of refactoring. The tool outputs a comprehensive analysis of these hotspots to help developers prioritize refactoring efforts.

## What are Hotspots?

Hotspots are files or sections of a codebase that are likely candidates for refactoring. These may be identified through various metrics such as:

- High complexity
- Frequent changes
- Code smells
- Technical debt indicators
- Other heuristics that suggest the code would benefit from refactoring

## Workflow

The tool operates in two main phases:

### Phase 1: Hotspot Detection and Analysis

1. **Find Hotspots**: Identifies hotspots in the codebase using commit frequency analysis.
2. **Analyze Hotspots**: Performs analysis on each identified hotspot (LOC counting, coupling analysis).
3. **Output Analysis**: Generates a JSON file with hotspot data and coupling relationships.

### Phase 2: AI-Powered Refactoring Recommendations

A separate analysis script (`hotspots-analyze`) uses an AI agent to:

1. Read the JSON output from Phase 1
2. Analyze hotspot clusters and coupling relationships
3. Generate human-readable refactoring recommendations
4. Identify high-risk areas and priority refactoring opportunities

## Hotspot Detection Method

The tool finds hotspots by analyzing commit frequency within a specified time period:

1. **Time Period Analysis**: Analyzes the number of commits that occurred in a certain period of time. The time period is defined by command-line arguments.

2. **File Modification Counting**: For each file that has been modified during the time period, counts how many times it was modified (i.e., how many commits included that file). For example:
   - If two commits include file A, file A has been modified 2 times
   - If no commits include file B during the time period, file B has been modified 0 times

3. **Top Percentage Selection**: From all modified files, selects the top 10% that have had the most changes. The default percentage is 10%, but this can be modified with an optional command-line flag.

4. **Complexity Sorting**: The selected files are then sorted by complexity. Complexity is measured by counting lines of code (LOC) directly from the file contents, excluding:
   - Empty lines
   - Lines containing only whitespace
   - Comment lines (both single-line and block comments)
   - Only actual lines of code are counted

   The tool reads each file directly and counts LOC by:
   - Parsing the file content line by line
   - Removing comments based on file extension (supports JavaScript, TypeScript, Python, Java, C/C++, Go, Rust, HTML, CSS, SQL, and many other languages)
   - Handling both single-line comments (e.g., `//`, `#`) and block comments (e.g., `/* */`, `<!-- -->`)
   - Counting only non-empty, non-comment lines

   This approach is significantly faster than using external tools as it avoids process spawning overhead.

5. **Top Results Selection**: From the complexity-sorted files, the top 30 results are selected for analysis. The default limit is 30, but this can be modified with an optional command-line flag.

## Coupling Analysis

For each file in the top results (top 30 by default), the tool analyzes **temporal coupling** (also known as **evolutionary coupling** or **logical coupling**).

### What is Temporal Coupling?

Temporal coupling measures how often files are changed together in the same commits. If two files frequently appear in the same commit, they are said to be "coupled" - indicating they are likely related and may need to be considered together when making changes.

### Coupling Measurement

- **Coupling Count**: For each pair of files (A, B), the coupling count is the number of commits in which both files A and B appear together.
- **Coupling Strength**: The more commits two files share, the stronger their coupling. For example:
  - If files A and B appear together in 5 commits, they have a coupling count of 5
  - If files A and B appear together in 1 commit, they have a coupling count of 1
  - If files A and B never appear in the same commit, they have a coupling count of 0

### Coupling Analysis Process

For each hotspot file in the top results:

1. Identify all commits that modified that file within the specified time period
2. For each of those commits, collect all other files that were also modified in the same commit
3. Count how many times each other file appears together with the hotspot file across all commits
4. Generate a list of coupled files, sorted by coupling count (strongest coupling first)

This analysis helps identify:

- Files that are frequently changed together and may have hidden dependencies
- Potential refactoring opportunities where coupled files could be better organized
- Files that should be reviewed together when making changes

## Implementation Details

- **Technology**: Node.js script written in TypeScript
- **Interface**: Command-line tool
- **Input**: Requires a path to a git-based project
- **Git Integration**: Interacts with git repositories to analyze the codebase
- **Progress Indicators**: Shows real-time progress during analysis:
  - Git commit analysis status
  - File count information
  - Updating counter for LOC counting (e.g., "Counting LOC: X/Y files processed...")
  - All progress messages are written to stderr
- **Output Format**:
  - If `--output` is specified: Results are written as JSON to the specified file. The JSON structure includes:
    - `arguments`: Object containing:
      - `path`: Repository path
      - `timeRange`: Object with actual ISO date strings and optional commit hashes:
        - `since`: Start date in ISO format (e.g., "2024-01-27T00:00:00.000Z")
        - `until`: End date in ISO format (e.g., "2025-01-27T00:00:00.000Z")
        - `startCommit`: (optional) Oldest commit hash in the analysis range, when available
        - `endCommit`: (optional) Newest commit hash in the analysis range, when available
      - `percentage`: Percentage threshold used
      - `limit`: Maximum number of results
      - `couplingThreshold`: Minimum coupling count threshold used
      - `exclude`: Array of exclude patterns (if any)
    - `results`: Array of hotspot results, each containing:
      - `file`: File path
      - `modificationCount`: Number of times the file was modified
      - `linesOfCode`: Number of lines of code (excluding comments and blank lines)
      - `coupling`: Array of coupled files, each containing: - `file`: Path of the coupled file - `count`: Number of commits where both files appear together
      - `scores`: Optional lightweight scoring (High/Medium/Low per dimension, relative to the result set): - `changeFrequency`, `loc`, `coupling`. Used for badges in the report; business criticality is assigned in the analysis from code context.
        Note: Relative dates like "12 months ago" are converted to actual ISO dates in the output.
  - If `--output` is not specified: Results are displayed as CSV in the console (only the results array, without metadata)

## Command-Line Arguments

- `--path <path>` (required): Path to the git-based project to analyze
- `--since <date>` (required): Start date of the time period to analyze. Uses Git's standard date format (e.g., "12 months ago", "1 year ago", "2024-01-01", "2 weeks ago"). This argument is passed directly to Git commands.
- `--until <date>` (optional): End date of the time period to analyze. Uses Git's standard date format. If not specified, defaults to "now". This argument is passed directly to Git commands.
- `--percentage <number>` (optional): Percentage threshold for hotspot selection (default: 10)
- `--limit <number>` (optional): Maximum number of results to include in the analysis (default: 30)
- `--coupling-threshold <number>` (optional): Minimum coupling count to include in coupling results (default: 5). Set to 0 to disable filtering and include all couplings.
- `--output <file>` (optional): Output file path for JSON results. If not specified, results are displayed as CSV in the console.
- `--exclude <pattern>` (optional): Regex pattern to exclude files from analysis. Can be specified multiple times to exclude multiple patterns. Files matching any of the patterns will be filtered out before analysis.

## Usage Example

Analyze the last 12 months:

```bash
node hotspots-report.js --path /path/to/repo --since "12 months ago" --percentage 10
```

Analyze a specific date range:

```bash
node hotspots-report.js --path /path/to/repo --since 2024-01-01 --until 2024-12-31 --percentage 10
```

Or with default percentage and limit:

```bash
node hotspots-report.js --path /path/to/repo --since "12 months ago"
```

With custom limit:

```bash
node hotspots-report.js --path /path/to/repo --since "12 months ago" --limit 50
```

Save results to a JSON file:

```bash
node hotspots-report.js --path /path/to/repo --since "12 months ago" --output hotspots.json
```

Exclude files matching patterns:

```bash
node hotspots-report.js --path /path/to/repo --since "12 months ago" --exclude "\.lock$" --exclude "\.json$" --exclude "node_modules/"
```

## AI Analysis Script

After generating a hotspots report, use the analysis script to get detailed refactoring recommendations:

```bash
node hotspots-analyze.js --input hotspots.json --output analysis.md --workspace /path/to/repo
```

The analysis script uses the Cursor Agent to analyze the hotspots data and provides structured, textual output saved to a markdown file. The generated report follows a strict format with 13 mandatory sections:

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

Each section (except Title) includes an audience note (*Audience: EMs / PMs* or *Audience: Staff Engineers / Tech Leads*) to help readers navigate the report. Authorship is stated in two places: (1) front matter right under the title (Author, Role, Scope, Methodology, Intended audience); (2) an "Authorship" note at the end of About This Report, in third-person factual language, tying the author's name to judgment and accountability.

The agent reads the actual source code files to provide code-aware recommendations based on implementation details, not just metadata. The report emphasizes business framing, avoids blame, and frames findings as system problems rather than team failures.

### Analysis Script Arguments

- `--input <file>` (required): Path to the JSON output file from hotspots-report
- `--output <file>` (required): Path to the output markdown file for the analysis
- `--workspace <path>` (optional): Workspace directory for context
- `--model <model>` (optional): AI model to use for analysis
