# Hotspotter

Find the parts of your codebase that deserve attention.

## Installation

```bash
npm install
npm run build
```

## Usage

After building (or when installed globally), run:

```bash
hotspotter --path <repo-path> --since <date> [options]
```

Or from the project directory: `node dist/index.js --path <repo-path> --since <date> [options]`

### Required Arguments

- `--path <path>`: Path to the git-based project to analyze
- `--since <date>`: Start date of the time period (Git date format, e.g., "12 months ago", "2024-01-01")

### Optional Arguments

- `--until <date>`: End date of the time period (defaults to "now")
- `--percentage <number>`: Percentage threshold for hotspot selection (default: 10)
- `--limit <number>`: Maximum number of results to include (default: 30)
- `--coupling-threshold <number>`: Minimum coupling count to include in results (default: 5, set to 0 to disable filtering)
- `--output <file>`: Output file path for JSON results. If not specified, results are displayed as CSV in the console. When using `--report`, this is the base path for both JSON and the markdown report (e.g. `--output report` writes `report.json` and `report.md`).
- `--report`: After data gathering, run AI report generation and write both JSON and report. Requires `--output` and `--model`.
- `--model <model-id>`: Model for report generation (required when using `--report`). Use format `provider:model`, e.g. `openai:gpt-4o` or `anthropic:claude-sonnet-4-5`. Supported providers: OpenAI, Anthropic. Each provider uses its own API key (see below).
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

### Report generation (AI)

With `--report`, hotspotter writes the JSON and an AI-generated markdown report. You must pass `--model` in the form `provider:model` (e.g. `openai:gpt-4o`, `anthropic:claude-sonnet-4-5`). There is no default model.

**Environment variables (API keys):** Each provider uses its own key. Set the one for the provider you use:

- **OpenAI:** `OPENAI_API_KEY`
- **Anthropic:** `ANTHROPIC_API_KEY`

Example:

```bash
# Generate hotspots data and AI report (requires OPENAI_API_KEY or ANTHROPIC_API_KEY)
node dist/index.js --path /path/to/repo --since "12 months ago" --report --output report --model openai:gpt-4o
```

This writes `report.json` and `report.md`. The report includes hotspot clusters, refactoring recommendations, high-risk areas, and priority recommendations.

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
- For report generation (`--report`): an API key for your chosen provider (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`)
