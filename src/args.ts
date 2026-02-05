export interface HotspotArgs {
  path: string;
  since: string;
  until?: string;
  percentage: number;
  limit: number;
  couplingThreshold: number;
  output?: string;
  report?: boolean;
  model?: string;
  exclude?: string[];
}

/**
 * When --report is set, --output is a base path. Returns paths for JSON and report.
 * Strips any extension from outputPath to form the base (e.g. "report.md" -> base "report").
 */
export function getReportOutputPaths(outputPath: string): {
  jsonPath: string;
  reportPath: string;
} {
  const base = outputPath.replace(/\.[^/.]+$/, "") || outputPath;
  return {
    jsonPath: `${base}.json`,
    reportPath: `${base}.md`,
  };
}

export function parseArgs(options: any): HotspotArgs {
  const percentage = parseInt(options.percentage, 10);
  const limit = parseInt(options.limit, 10);
  const couplingThreshold = parseInt(options.couplingThreshold, 10);

  if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
    throw new Error("Percentage must be a number between 1 and 100");
  }

  if (isNaN(limit) || limit <= 0) {
    throw new Error("Limit must be a positive number");
  }

  if (isNaN(couplingThreshold) || couplingThreshold < 0) {
    throw new Error("Coupling threshold must be a non-negative number");
  }

  // Validate and compile exclude regex patterns
  const excludePatterns: string[] = options.exclude || [];
  for (const pattern of excludePatterns) {
    try {
      new RegExp(pattern);
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${pattern}`);
    }
  }

  return {
    path: options.path,
    since: options.since,
    until: options.until,
    percentage,
    limit,
    couplingThreshold,
    output: options.output,
    report: options.report === true,
    model: options.model,
    exclude: excludePatterns.length > 0 ? excludePatterns : undefined,
  };
}
