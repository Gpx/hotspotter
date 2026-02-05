#!/usr/bin/env node

import { Command } from "commander";
import { writeFile } from "fs/promises";
import { analyzeHotspots } from "./analyzer.js";
import { parseArgs, getReportOutputPaths } from "./args.js";
import { formatAsTable } from "./formatter.js";
import { resolveDateRange, getCommitRangeForRange } from "./dateResolver.js";
import { runAnalysis } from "./analyze.js";

const program = new Command();

program
  .name("hotspotter")
  .description("Find the parts of your codebase that deserve attention.")
  .requiredOption("--path <path>", "Path to the git-based project to analyze")
  .requiredOption(
    "--since <date>",
    'Start date of the time period (Git date format, e.g., "12 months ago")'
  )
  .option(
    "--until <date>",
    'End date of the time period (Git date format, defaults to "now")'
  )
  .option(
    "--percentage <number>",
    "Percentage threshold for hotspot selection",
    "10"
  )
  .option("--limit <number>", "Maximum number of results to include", "30")
  .option(
    "--coupling-threshold <number>",
    "Minimum coupling count to include (default: 5, set to 0 to disable)",
    "5"
  )
  .option(
    "--output <file>",
    "Output file path for JSON results (if not specified, outputs table to console)"
  )
  .option(
    "--report",
    "After data gathering, run report generation and write both JSON and report (requires --output)"
  )
  .option(
    "--model <model-id>",
    "Model for report (required when --report). Format: provider:model (e.g. openai:gpt-4o, anthropic:claude-sonnet-4-5). Set OPENAI_API_KEY or ANTHROPIC_API_KEY"
  )
  .option(
    "--exclude <pattern>",
    "Regex pattern to exclude files (can be specified multiple times)",
    (value, previous: string[] = []) => {
      previous.push(value);
      return previous;
    }
  )
  .action((options) =>
    runHotspotter(options).catch((error) => {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    })
  );

if (typeof process !== "undefined" && !process.env.VITEST) {
  program.parse();
}

export type HotspotterOptions = Record<string, unknown>;

/**
 * Run the hotspotter workflow (data gathering and optionally report generation).
 * Exported for testing.
 */
export async function runHotspotter(options: HotspotterOptions): Promise<void> {
  if (options.report && !options.output) {
    console.error(
      "Error: --report requires --output (base path for JSON and report)"
    );
    throw new Error("--report requires --output");
  }
  if (
    options.report &&
    (!options.model || String(options.model).trim() === "")
  ) {
    console.error("Error: --model is required when using --report");
    throw new Error("--model is required when using --report");
  }
  const args = parseArgs(options);
  const results = await analyzeHotspots(args);

  const [dateRange, commitRange] = await Promise.all([
    resolveDateRange(args.since, args.until, args.path),
    getCommitRangeForRange(args.since, args.until, args.path),
  ]);

  const outputPayload = {
    arguments: {
      path: args.path,
      timeRange: {
        since: dateRange.since,
        until: dateRange.until,
        ...(commitRange.startCommit && {
          startCommit: commitRange.startCommit,
        }),
        ...(commitRange.endCommit && {
          endCommit: commitRange.endCommit,
        }),
      },
      percentage: args.percentage,
      limit: args.limit,
      couplingThreshold: args.couplingThreshold,
      exclude: args.exclude,
    },
    results: results,
  };

  if (args.report && args.output) {
    const { jsonPath, reportPath } = getReportOutputPaths(args.output);
    await writeFile(jsonPath, JSON.stringify(outputPayload, null, 2), "utf-8");
    console.error(`Results written to ${jsonPath}`);
    await runAnalysis(jsonPath, reportPath, args.path, args.model!);
  } else if (args.output) {
    await writeFile(
      args.output,
      JSON.stringify(outputPayload, null, 2),
      "utf-8"
    );
    console.error(`Results written to ${args.output}`);
  } else {
    console.log(formatAsTable(results));
  }
}
