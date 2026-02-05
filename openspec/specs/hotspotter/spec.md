# Hotspotter (CLI)

## Overview

Hotspotter finds the parts of your codebase that deserve attention. It analyzes a code repository to identify hotspots—files or sections of code that are likely in need of refactoring—and outputs a comprehensive analysis to help developers prioritize refactoring efforts.

## What are Hotspots?

Hotspots are files or sections of a codebase that are likely candidates for refactoring. These may be identified using various metrics such as:

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

Report generation is triggered by the optional `--report` flag. When `--report` is set, the user MUST also provide `--model <model-id>` (e.g. `openai:gpt-4o`). After Phase 1, the system invokes the AI SDK with the specified model and writes the markdown report directly to `{base}.md`. See the [AI Analysis](ai-analysis) spec. There is no separate `hotspotter-analyze` binary.

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
- `--output <file>` (optional): When `--report` is not set: path for JSON results (if not specified, results are displayed as CSV in the console). When `--report` is set: base path for both outputs—JSON is written to `{base}.json` and the report to `{base}.md` (any extension on the path is stripped to form the base). `--output` is required when `--report` is set.
- `--report` (optional): After data gathering, run report generation and write both JSON and report (requires `--output` and `--model`).
- `--model <model-id>` (optional): Model for report generation (required when `--report` is set). Format: `provider:model` (e.g. `openai:gpt-4o`, `anthropic:claude-sonnet-4-5`). There is no default; the user must set the appropriate provider API key (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`). When `--report` is not set, `--model` is not required and may be omitted or ignored.
- `--exclude <pattern>` (optional): Regex pattern to exclude files from analysis. Can be specified multiple times to exclude multiple patterns. Files matching any of the patterns will be filtered out before analysis.

## Requirements

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

## Usage Example

Analyze the last 12 months:

```bash
hotspotter --path /path/to/repo --since "12 months ago" --percentage 10
```

Analyze a specific date range:

```bash
hotspotter --path /path/to/repo --since 2024-01-01 --until 2024-12-31 --percentage 10
```

Or with default percentage and limit:

```bash
hotspotter --path /path/to/repo --since "12 months ago"
```

With custom limit:

```bash
hotspotter --path /path/to/repo --since "12 months ago" --limit 50
```

Save results to a JSON file:

```bash
hotspotter --path /path/to/repo --since "12 months ago" --output hotspots.json
```

Exclude files matching patterns:

```bash
hotspotter --path /path/to/repo --since "12 months ago" --exclude "\.lock$" --exclude "\.json$" --exclude "node_modules/"
```

Run data gathering and report generation (writes `report.json` and `report.md`; requires `--model` and provider API key):

```bash
hotspotter --path /path/to/repo --since "12 months ago" --report --output report --model openai:gpt-4o
```
