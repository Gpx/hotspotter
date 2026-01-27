# Hotspots Report

A command-line tool that analyzes a code repository to identify hotspots - files or sections of code that are likely in need of refactoring.

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
node dist/index.js --path <repo-path> --since <date> [options]
```

### Required Arguments

- `--path <path>`: Path to the git-based project to analyze
- `--since <date>`: Start date of the time period (Git date format, e.g., "12 months ago", "2024-01-01")

### Optional Arguments

- `--until <date>`: End date of the time period (defaults to "now")
- `--percentage <number>`: Percentage threshold for hotspot selection (default: 10)
- `--limit <number>`: Maximum number of results to include (default: 30)
- `--coupling-threshold <number>`: Minimum coupling count to include in results (default: 5, set to 0 to disable filtering)
- `--output <file>`: Output file path for JSON results. If not specified, results are displayed as CSV in the console.
- `--exclude <pattern>`: Regex pattern to exclude files from analysis. Can be specified multiple times to exclude multiple patterns.

### Output Format

When using `--output`, the JSON file contains:

- `arguments`: Object with:
  - `path`: Repository path
  - `timeRange`: Object with actual ISO date strings (`since` and `until`) - relative dates like "12 months ago" are converted to actual dates
  - `percentage`: Percentage threshold used
  - `limit`: Maximum number of results
  - `couplingThreshold`: Minimum coupling count threshold used
  - `exclude`: Array of exclude patterns (if any)
- `results`: Array of hotspot objects with `file`, `modificationCount`, `linesOfCode`, and `coupling` (array of coupled files)

When not using `--output`, results are displayed as CSV (only the data, no metadata).

### Examples

Analyze the last 12 months:

```bash
node dist/index.js --path /path/to/repo --since "12 months ago"
```

Analyze a specific date range with custom percentage and limit:

```bash
node dist/index.js --path /path/to/repo --since 2024-01-01 --until 2024-12-31 --percentage 15 --limit 50
```

Save results to a JSON file:

```bash
node dist/index.js --path /path/to/repo --since "12 months ago" --output hotspots.json
```

Exclude files matching patterns:

```bash
node dist/index.js --path /path/to/repo --since "12 months ago" --exclude "\.lock$" --exclude "\.json$" --exclude "node_modules/"
```

## Analysis with AI Agent

After generating a hotspots report, you can use the AI analysis script to get detailed refactoring recommendations:

```bash
node dist/analyze.js --input hotspots.json --output analysis.md
```

### Analysis Script Arguments

- `--input <file>` (required): Path to the JSON output file from hotspots-report
- `--output <file>` (required): Path to the output markdown file for the analysis
- `--workspace <path>` (optional): Workspace directory (repository path) for context. Defaults to current directory or the path from the JSON file.
- `--model <model>` (optional): Model to use for analysis (e.g., "gpt-5", "sonnet-4")

### Example

```bash
# Generate hotspots report
node dist/index.js --path /path/to/repo --since "12 months ago" --output hotspots.json

# Analyze the report with AI and save to markdown
node dist/analyze.js --input hotspots.json --output analysis.md --workspace /path/to/repo
```

The analysis script uses the Cursor Agent to analyze the hotspots data and provides:

- Hotspot clusters (groups of files changed together)
- Refactoring opportunities with specific recommendations
- High-risk areas identification
- Patterns and insights about code organization
- Priority recommendations for refactoring

## Development

```bash
# Run in development mode
npm run dev -- --path /path/to/repo --since "12 months ago"

# Build for production
npm run build
```

## Requirements

- Node.js
- Git
- Cursor Agent (for analysis script) - install with `npm install -g @cursor/agent` or use the Cursor IDE
