import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { join, extname } from 'path';
import { HotspotArgs } from './args.js';

const execAsync = promisify(exec);

export interface FileModification {
  file: string;
  modificationCount: number;
}

export interface CoupledFile {
  file: string;
  count: number;
}

export interface HotspotResult {
  file: string;
  modificationCount: number;
  linesOfCode: number;
  coupling: CoupledFile[];
}

export async function analyzeHotspots(args: HotspotArgs): Promise<HotspotResult[]> {
  // Step 1: Get modified files and their commit counts
  console.error('Analyzing git commits...');
  const fileModifications = await getFileModifications(args);
  
  if (fileModifications.length === 0) {
    console.error('No modified files found in the specified time period.');
    return [];
  }

  console.error(`Found ${fileModifications.length} modified files.`);

  // Step 2: Select top percentage
  const topPercentage = selectTopPercentage(fileModifications, args.percentage);
  console.error(`Selecting top ${args.percentage}% (${topPercentage.length} files) by commit frequency...`);

  // Step 3: Sort by complexity (LOC)
  console.error('Counting lines of code...');
  const hotspotsWithLOC = await addLinesOfCode(topPercentage, args.path);

  // Step 4: Sort by LOC and select top results
  hotspotsWithLOC.sort((a, b) => b.linesOfCode - a.linesOfCode);
  const topResults = hotspotsWithLOC.slice(0, args.limit);
  
  // Step 5: Analyze coupling for each hotspot
  console.error('Analyzing coupling...');
  const results = await analyzeCoupling(topResults, args);
  
  console.error(`Analysis complete. Returning top ${results.length} hotspots.`);
  
  return results;
}

async function getFileModifications(args: HotspotArgs): Promise<FileModification[]> {
  const sinceArg = `--since="${args.since}"`;
  const untilArg = args.until ? `--until="${args.until}"` : '';
  
  // Get all commits in the time period with file changes
  // Using --format= to get only file names, no commit info
  const gitCommand = `git log --name-only --format= ${sinceArg} ${untilArg}`;
  
  try {
    const { stdout } = await execAsync(gitCommand, {
      cwd: args.path,
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large repositories
    });

    // Count modifications per file
    const fileCounts = new Map<string, number>();
    const lines = stdout.split('\n');
    
    for (const line of lines) {
      const file = line.trim();
      // Skip empty lines and common git log prefixes
      if (file && 
          !file.startsWith('commit') && 
          !file.startsWith('Author:') && 
          !file.startsWith('Date:') &&
          !file.startsWith('Merge:') &&
          file !== '') {
        fileCounts.set(file, (fileCounts.get(file) || 0) + 1);
      }
    }

    const fileModifications = Array.from(fileCounts.entries())
      .map(([file, count]) => ({ file, modificationCount: count }))
      .filter(fm => fm.modificationCount > 0);

    // Filter out files matching exclude patterns
    if (args.exclude && args.exclude.length > 0) {
      const excludeRegexes = args.exclude.map(pattern => new RegExp(pattern));
      return fileModifications.filter(fm => {
        return !excludeRegexes.some(regex => regex.test(fm.file));
      });
    }

    return fileModifications;
  } catch (error) {
    throw new Error(`Failed to analyze git repository: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function selectTopPercentage(
  fileModifications: FileModification[],
  percentage: number
): FileModification[] {
  if (fileModifications.length === 0) {
    return [];
  }

  // Sort by modification count (descending)
  const sorted = [...fileModifications].sort((a, b) => b.modificationCount - a.modificationCount);
  
  // Calculate how many files to take (top percentage)
  const count = Math.max(1, Math.ceil((sorted.length * percentage) / 100));
  
  return sorted.slice(0, count);
}

async function addLinesOfCode(
  fileModifications: FileModification[],
  repoPath: string
): Promise<Omit<HotspotResult, 'coupling'>[]> {
  const results: Omit<HotspotResult, 'coupling'>[] = [];
  const total = fileModifications.length;

  for (let i = 0; i < fileModifications.length; i++) {
    const fm = fileModifications[i];
    const filePath = join(repoPath, fm.file);
    
    // Update progress counter
    process.stderr.write(`\rCounting LOC: ${i + 1}/${total} files processed...`);
    
    // Skip if file doesn't exist (might have been deleted)
    if (!existsSync(filePath)) {
      continue;
    }
    
    try {
      const loc = getLinesOfCode(filePath);
      results.push({
        file: fm.file,
        modificationCount: fm.modificationCount,
        linesOfCode: loc,
      });
    } catch (error) {
      // If counting fails for a file, set LOC to 0
      results.push({
        file: fm.file,
        modificationCount: fm.modificationCount,
        linesOfCode: 0,
      });
    }
  }

  // Clear the progress line and show completion
  process.stderr.write(`\rCounting LOC: ${total}/${total} files processed.     \n`);
  
  return results;
}

async function analyzeCoupling(
  hotspots: Omit<HotspotResult, 'coupling'>[],
  args: HotspotArgs
): Promise<HotspotResult[]> {
  const results: HotspotResult[] = [];
  const total = hotspots.length;

  for (let i = 0; i < hotspots.length; i++) {
    const hotspot = hotspots[i];
    
    // Update progress counter
    process.stderr.write(`\rAnalyzing coupling: ${i + 1}/${total} files processed...`);
    
    const coupling = await getCouplingForFile(hotspot.file, args);
    
    // Filter by coupling threshold (if threshold > 0)
    const filteredCoupling = args.couplingThreshold > 0
      ? coupling.filter(c => c.count >= args.couplingThreshold)
      : coupling;
    
    results.push({
      ...hotspot,
      coupling: filteredCoupling.sort((a, b) => b.count - a.count), // Sort by count descending
    });
  }

  // Clear the progress line and show completion
  process.stderr.write(`\rAnalyzing coupling: ${total}/${total} files processed.     \n`);
  
  return results;
}

async function getCouplingForFile(
  file: string,
  args: HotspotArgs
): Promise<CoupledFile[]> {
  const sinceArg = `--since="${args.since}"`;
  const untilArg = args.until ? `--until="${args.until}"` : '';
  
  try {
    // Get all commits that modified this file
    // Use --format=%H to get only commit hashes (one per line)
    const { stdout: commitHashes } = await execAsync(
      `git log --format=%H ${sinceArg} ${untilArg} -- "${file}"`,
      {
        cwd: args.path,
        maxBuffer: 50 * 1024 * 1024,
      }
    );

    // Parse commit hashes (one per line, 40 characters each)
    const commits = commitHashes
      .split('\n')
      .map(h => h.trim())
      .filter(h => h.length === 40 && /^[0-9a-f]{40}$/i.test(h));

    if (commits.length === 0) {
      return [];
    }

    // For each commit, get all files modified in that commit
    const couplingCounts = new Map<string, number>();
    
    for (const commitHash of commits) {
      const { stdout: filesInCommit } = await execAsync(
        `git diff-tree --no-commit-id --name-only -r ${commitHash}`,
        {
          cwd: args.path,
          maxBuffer: 10 * 1024 * 1024,
        }
      );

      const files = filesInCommit
        .split('\n')
        .map(f => f.trim())
        .filter(f => f && f !== file); // Exclude the hotspot file itself

      // Apply exclude patterns if any
      let filteredFiles = files;
      if (args.exclude && args.exclude.length > 0) {
        const excludeRegexes = args.exclude.map(pattern => new RegExp(pattern));
        filteredFiles = files.filter(f => {
          return !excludeRegexes.some(regex => regex.test(f));
        });
      }

      // Count coupling
      for (const coupledFile of filteredFiles) {
        couplingCounts.set(coupledFile, (couplingCounts.get(coupledFile) || 0) + 1);
      }
    }

    // Convert to array
    return Array.from(couplingCounts.entries())
      .map(([file, count]) => ({ file, count }));
  } catch (error) {
    // If coupling analysis fails, return empty array
    console.error(`Warning: Could not analyze coupling for ${file}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

function getLinesOfCode(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const ext = extname(filePath).toLowerCase();
    
    // Determine comment patterns based on file extension
    const commentPatterns = getCommentPatterns(ext);
    
    let loc = 0;
    let inBlockComment = false;
    let blockCommentEnd: RegExp | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (trimmed === '') {
        continue;
      }
      
      // Handle block comments
      if (commentPatterns.blockStart && commentPatterns.blockEnd) {
        let processedLine = line;
        
        // Check for block comment start/end
        if (commentPatterns.blockStart.test(processedLine)) {
          if (commentPatterns.blockEnd.test(processedLine)) {
            // Single-line block comment
            processedLine = processedLine.replace(/\/\*[\s\S]*?\*\//g, '');
          } else {
            // Start of multi-line block comment
            inBlockComment = true;
            blockCommentEnd = commentPatterns.blockEnd;
            processedLine = processedLine.replace(/\/\*[\s\S]*$/, '');
          }
        } else if (inBlockComment && blockCommentEnd) {
          if (blockCommentEnd.test(processedLine)) {
            // End of block comment
            inBlockComment = false;
            processedLine = processedLine.replace(/^[\s\S]*?\*\//, '');
            blockCommentEnd = null;
          } else {
            // Inside block comment, skip this line
            continue;
          }
        }
        
        // Remove line comments
        if (commentPatterns.line) {
          processedLine = processedLine.replace(commentPatterns.line, '');
        }
        
        // Count if there's any non-whitespace content left
        if (processedLine.trim() !== '') {
          loc++;
        }
      } else {
        // Simple line comment handling
        let processedLine = line;
        if (commentPatterns.line) {
          processedLine = processedLine.replace(commentPatterns.line, '');
        }
        
        if (processedLine.trim() !== '') {
          loc++;
        }
      }
    }
    
    return loc;
  } catch (error) {
    // If file can't be read, return 0
    return 0;
  }
}

interface CommentPatterns {
  line?: RegExp;
  blockStart?: RegExp;
  blockEnd?: RegExp;
}

function getCommentPatterns(ext: string): CommentPatterns {
  const patterns: CommentPatterns = {};
  
  // Common comment patterns
  switch (ext) {
    case '.js':
    case '.jsx':
    case '.ts':
    case '.tsx':
    case '.java':
    case '.c':
    case '.cpp':
    case '.h':
    case '.hpp':
    case '.cs':
    case '.go':
    case '.rs':
    case '.swift':
    case '.kt':
    case '.scala':
      patterns.line = /\/\/.*$/;
      patterns.blockStart = /\/\*/;
      patterns.blockEnd = /\*\//;
      break;
    
    case '.py':
    case '.rb':
    case '.sh':
    case '.bash':
    case '.yaml':
    case '.yml':
    case '.r':
    case '.pl':
    case '.pm':
      patterns.line = /#.*$/;
      break;
    
    case '.html':
    case '.xml':
    case '.vue':
      patterns.blockStart = /<!--/;
      patterns.blockEnd = /-->/;
      break;
    
    case '.css':
    case '.scss':
    case '.sass':
    case '.less':
      patterns.line = /\/\/.*$/;
      patterns.blockStart = /\/\*/;
      patterns.blockEnd = /\*\//;
      break;
    
    case '.sql':
      patterns.line = /--.*$/;
      patterns.blockStart = /\/\*/;
      patterns.blockEnd = /\*\//;
      break;
    
    case '.lua':
      patterns.line = /--.*$/;
      patterns.blockStart = /--\[\[/;
      patterns.blockEnd = /\]\]/;
      break;
    
    default:
      // Default: just remove lines starting with # or //
      patterns.line = /(^|\s)(#|\/\/).*$/;
  }
  
  return patterns;
}
