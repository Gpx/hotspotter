#!/usr/bin/env node

import { Command } from 'commander';
import { writeFile } from 'fs/promises';
import { analyzeHotspots } from './analyzer.js';
import { parseArgs } from './args.js';
import { formatAsTable } from './formatter.js';
import { resolveDateRange } from './dateResolver.js';

const program = new Command();

program
  .name('hotspots-report')
  .description('Analyze a code repository to identify hotspots that need refactoring')
  .requiredOption('--path <path>', 'Path to the git-based project to analyze')
  .requiredOption('--since <date>', 'Start date of the time period (Git date format, e.g., "12 months ago")')
  .option('--until <date>', 'End date of the time period (Git date format, defaults to "now")')
  .option('--percentage <number>', 'Percentage threshold for hotspot selection', '10')
  .option('--limit <number>', 'Maximum number of results to include', '30')
  .option('--output <file>', 'Output file path for JSON results (if not specified, outputs table to console)')
  .option('--exclude <pattern>', 'Regex pattern to exclude files (can be specified multiple times)', (value, previous: string[] = []) => {
    previous.push(value);
    return previous;
  })
  .action(async (options) => {
    try {
      const args = parseArgs(options);
      const results = await analyzeHotspots(args);
      
      if (args.output) {
        // Resolve actual date range from git date strings
        const dateRange = await resolveDateRange(args.since, args.until, args.path);
        
        // Write JSON to file with metadata
        const output = {
          arguments: {
            path: args.path,
            timeRange: {
              since: dateRange.since,
              until: dateRange.until,
            },
            percentage: args.percentage,
            limit: args.limit,
            exclude: args.exclude,
          },
          results: results,
        };
        await writeFile(args.output, JSON.stringify(output, null, 2), 'utf-8');
        console.error(`Results written to ${args.output}`);
      } else {
        // Output as CSV to console
        console.log(formatAsTable(results));
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
