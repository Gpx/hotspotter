import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface DateRange {
  since: string; // ISO date string
  until: string; // ISO date string
}

/**
 * Resolves git date strings to actual ISO date strings
 * Handles both relative dates (like "12 months ago") and absolute dates
 */
export async function resolveDateRange(
  since: string,
  until: string | undefined,
  repoPath: string
): Promise<DateRange> {
  // Resolve 'since' date
  const sinceDate = await resolveGitDate(since, repoPath);

  // Resolve 'until' date (defaults to now if not specified)
  const untilDate = until
    ? await resolveGitDate(until, repoPath)
    : new Date().toISOString();

  return {
    since: sinceDate,
    until: untilDate,
  };
}

export interface CommitRange {
  startCommit: string | null;
  endCommit: string | null;
}

/**
 * Returns the start (oldest) and end (newest) commit hashes for the given git date range.
 * Useful for reproducibility and referencing the exact range of the analysis.
 *
 * Note: git log -1 --reverse applies the limit first then reverses, so we get the oldest
 * by outputting the full reversed list and taking the first line (oldest).
 */
export async function getCommitRangeForRange(
  since: string,
  until: string | undefined,
  repoPath: string
): Promise<CommitRange> {
  const untilArg = until ? `--until="${until}"` : "";
  try {
    const [endCommit, startCommit] = await Promise.all([
      // Newest in range: default order, -1 gives first (newest)
      execAsync(`git log --since="${since}" ${untilArg} --format=%H -1`, {
        cwd: repoPath,
        maxBuffer: 1024 * 1024,
      }).then(({ stdout }) => stdout.trim() || null),
      // Oldest in range: --reverse then take first line (git log -1 --reverse would apply -1 first, giving wrong result)
      execAsync(
        `git log --since="${since}" ${untilArg} --format=%H --reverse`,
        { cwd: repoPath, maxBuffer: 1024 * 1024 }
      ).then(({ stdout }) => {
        const firstLine = stdout.trim().split("\n")[0];
        return firstLine?.trim() || null;
      }),
    ]);
    return { startCommit, endCommit };
  } catch {
    return { startCommit: null, endCommit: null };
  }
}

async function resolveGitDate(
  dateString: string,
  repoPath: string
): Promise<string> {
  // First, try to parse as absolute date
  const absoluteDate = new Date(dateString);
  if (
    !isNaN(absoluteDate.getTime()) &&
    !dateString.match(/\b(ago|yesterday|today|tomorrow)\b/i)
  ) {
    // It's a valid absolute date and not a relative date string
    return absoluteDate.toISOString();
  }

  // For relative dates, use git to resolve them
  // Git understands formats like "12 months ago", "1 year ago", etc.
  try {
    // Use git's date parsing by getting the first commit at or after the specified date
    // We use --until to get commits up to that point, then get the last one
    // Actually, better: use git log with --since to get commits, then get the boundary
    // Or even better: use git to show us what date it interprets

    // Get the first commit that matches the date criteria
    // For "12 months ago", we want the date 12 months ago, not the first commit
    // So we'll use a different approach: calculate it or use git's interpretation

    // Try using git rev-list to get a commit hash, then get its date
    // But actually, we can use git log with --format to show the interpreted date
    const { stdout } = await execAsync(
      `git log --format=%ai --date=iso-strict --since="${dateString}" --until="now" -1`,
      { cwd: repoPath, maxBuffer: 1024 * 1024 }
    );

    const firstLine = stdout.trim().split("\n")[0];

    if (firstLine) {
      // Git found a commit, but we want the actual date boundary, not the commit date
      // For relative dates, we need to calculate them
      return calculateRelativeDate(dateString);
    }

    // If no commit found, still try to calculate the relative date
    return calculateRelativeDate(dateString);
  } catch (error) {
    // Fallback: try to calculate relative date manually
    return calculateRelativeDate(dateString);
  }
}

function calculateRelativeDate(dateString: string): string {
  const now = new Date();
  const lower = dateString.toLowerCase().trim();

  // Handle common relative date formats
  // "12 months ago", "1 year ago", "2 weeks ago", etc.
  const monthsAgoMatch = lower.match(/(\d+)\s*months?\s*ago/i);
  if (monthsAgoMatch) {
    const months = parseInt(monthsAgoMatch[1], 10);
    const date = new Date(now);
    date.setMonth(date.getMonth() - months);
    return date.toISOString();
  }

  const yearsAgoMatch = lower.match(/(\d+)\s*years?\s*ago/i);
  if (yearsAgoMatch) {
    const years = parseInt(yearsAgoMatch[1], 10);
    const date = new Date(now);
    date.setFullYear(date.getFullYear() - years);
    return date.toISOString();
  }

  const weeksAgoMatch = lower.match(/(\d+)\s*weeks?\s*ago/i);
  if (weeksAgoMatch) {
    const weeks = parseInt(weeksAgoMatch[1], 10);
    const date = new Date(now);
    date.setDate(date.getDate() - weeks * 7);
    return date.toISOString();
  }

  const daysAgoMatch = lower.match(/(\d+)\s*days?\s*ago/i);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  // Try direct Date parsing as fallback
  const parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  throw new Error(`Could not resolve date: ${dateString}`);
}
