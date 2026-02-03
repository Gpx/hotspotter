# Design: Unify Hotspotter CLI

## Goal

Merge the two scripts (`hotspotter` and `hotspotter-analyze`) into a single `hotspotter` command. The user controls whether to run only Phase 1 (git data) or Phase 1 + Phase 2 (report) via a `--report` flag.

## Flow

```
hotspotter [options] [--report]
                │
                ▼
        Phase 1: gather git data
        (hotspot detection, coupling, same as today)
                │
                ▼
        ┌───────────────┐
        │ --report set? │
        └───────┬───────┘
                │
    No ─────────┴───────── Yes
     │                      │
     ▼                      ▼
  Output Phase 1       Write JSON and report
  (table or --output    to --output (both files)
   for JSON only),      then run analysis step
   then exit
                                │
                                ▼
                        Run analysis step
                        (same logic as current
                         hotspotter-analyze)
                                │
                                ▼
                        Report written to
                        path derived from --output
```

- **Without `--report`**: Run Phase 1. If `--output` is set, write JSON only to that path; else print table to stdout. Then stop.
- **With `--report`**: Run Phase 1, write **both** JSON and report. Paths are derived from `--output` (see below). Then run the analysis step; report is written to the derived report path.

## Single `--output` for both JSON and report

One flag, `--output`, controls where output is written:

| Mode        | `--output` set? | Behavior |
|-------------|-----------------|----------|
| No `--report` | No              | Print Phase 1 table to stdout. |
| No `--report` | Yes             | Write Phase 1 JSON to `--output` (current behavior). |
| `--report`   | No              | Need a rule: e.g. require `--output` when `--report`, or use a default base path (e.g. `./hotspotter` → `./hotspotter.json` + `./hotspotter.md`). |
| `--report`   | Yes             | Write **both** JSON and report. Treat `--output` as a **base path**: write JSON to `{base}.json` and report to `{base}.md`. If user passes `--output report.md`, base is `report` → `report.json` and `report.md`. If `--output out`, write `out.json` and `out.md`. |

So: without `--report`, `--output` is the literal JSON file path. With `--report`, `--output` is the base for both files (strip extension if present to get base, then `{base}.json` and `{base}.md`).

## Data handoff when `--report`

When `--report` is set, Phase 1 JSON is written to the derived path (`{base}.json`). That path is passed to the analysis step; the agent reads it and writes the report to the derived report path (`{base}.md`). No temp file needed when `--output` is set. If `--report` is set but `--output` is not (if we allow that), use a temp file for JSON and a default path for the report, or require `--output` when `--report`.

## Entrypoints: only unify

- **Single binary**: Only `hotspotter` in `package.json` `bin`. Remove `hotspotter-analyze`.
- **No separate “analyze only” command**: The previous two-step workflow becomes a single invocation: `hotspotter --report --output report ...` (writes `report.json` and `report.md`).

## CLI surface (additions)

- `--report`: If present, after Phase 1 run the analysis step and write both JSON and report (paths from `--output`).
- `--output`: Unchanged when `--report` is not set (JSON path only). When `--report` is set, treated as base path for both JSON (`{base}.json`) and report (`{base}.md`).
- When `--report`: require `--output` (so we always have a base path), or define a default base (e.g. `./hotspotter`).
- Analysis step: workspace from Phase 1 `--path`, optional `--model`; pass through when `--report` is set.

## Out of scope

- Keeping `hotspotter-analyze` as a separate or deprecated entrypoint.
- Changing how the agent or prompt work; they continue to receive a file path to the Phase 1 JSON.
