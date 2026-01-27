#!/usr/bin/env node

import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { spawn } from 'child_process';

const program = new Command();

program
  .name('hotspots-analyze')
  .description('Analyze hotspots report using AI agent to identify refactoring opportunities')
  .requiredOption('--input <file>', 'Path to the JSON output file from hotspots-report')
  .requiredOption('--output <file>', 'Path to the output markdown file where the agent will save the analysis')
  .option('--workspace <path>', 'Workspace directory (repository path) for context', process.cwd())
  .option('--model <model>', 'Model to use for analysis')
  .action(async (options) => {
    try {
      // Read the JSON input file to extract repository path
      const jsonContent = await readFile(options.input, 'utf-8');
      const data = JSON.parse(jsonContent);

      // Extract repository path from arguments
      const repoPath = data.arguments?.path || options.workspace;
      
      // Get absolute path to input file for the agent to read
      const { resolve } = await import('path');
      const inputFilePath = resolve(options.input);

      // Build the agent command arguments for interactive mode
      let agentArgs = ['--workspace', repoPath];
      
      if (options.model) {
        agentArgs.push('--model', options.model);
      }

      // Create a concise prompt that tells the agent to read the JSON file
      const prompt = createAnalysisPrompt(inputFilePath, options.output);

      agentArgs.push(prompt);

      console.error('Starting AI agent in interactive mode...');
      console.error('The agent will analyze the hotspots and ask if you want to save the results.\n');

      // Execute the agent in interactive mode (no --print flag)
      return new Promise<void>((resolve, reject) => {
        const agentProcess = spawn('agent', agentArgs, {
          stdio: ['inherit', 'inherit', 'inherit'],
        });

        agentProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Agent process exited with code ${code}`));
          }
        });

        agentProcess.on('error', (error) => {
          console.error('\n✗ Error starting agent process:');
          console.error(`  ${error.message}`);
          
          if (error.message.includes('ENOENT') || error.message.includes('spawn')) {
            console.error('\n  This usually means the "agent" command is not found.');
            console.error('  Make sure Cursor Agent is installed and available in your PATH.');
            console.error('  You may need to install it or add it to your PATH.');
          }
          
          reject(new Error(`Failed to start agent: ${error.message}`));
        });
      });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();

function createAnalysisPrompt(inputFilePath: string, outputFilePath: string): string {
  const prompt = `You are analyzing a code hotspots report to identify refactoring opportunities. Your task is to examine the data and provide actionable insights in a structured, textual format.

## First Step: Read the Hotspots Data

**IMPORTANT**: Start by reading the hotspots report JSON file located at:
${inputFilePath}

This file contains all the hotspot analysis data including:
- Analysis time period and repository information
- List of hotspot files with modification counts and lines of code
- Coupling relationships between files
- All metadata needed for the analysis

Read this file first to understand what you're analyzing.

## Your Analysis Task

**IMPORTANT: You must read both the JSON data file AND the actual source code files to perform this analysis.**

1. **First**: Read the hotspots report JSON file at ${inputFilePath} to understand the hotspot data
2. **Then**: Read the actual source code files mentioned in the hotspots to understand:
   - What the code actually does
   - Code structure and organization
   - Dependencies and relationships
   - Code smells and anti-patterns
   - Specific refactoring opportunities

For each hotspot file and its strongly coupled files, read the file contents to understand the implementation details.

Analyze the hotspots and coupling relationships to identify refactoring opportunities. Focus on:

1. **Hotspot Clusters**: Identify groups of files that are frequently changed together (high coupling). Read the actual code in these files to understand:
   - What functionality they implement together
   - How they interact and depend on each other
   - Why they are frequently changed together (shared responsibilities, tight coupling, etc.)

2. **Refactoring Opportunities**: For each significant cluster, after reading the code:
   - Describe what the cluster represents (e.g., "Payment processing module", "User authentication flow", "Data transformation layer")
   - Explain why these files are frequently changed together based on the actual code
   - Provide specific, actionable refactoring recommendations based on the code structure you observe
   - Suggest concrete improvements (extract functions, create abstractions, consolidate logic, etc.)

3. **High-Risk Areas**: Identify files that are particularly problematic. Read these files to assess:
   - High modification count AND high lines of code (complex files that change frequently)
   - Strong coupling with many other files (indicating tight dependencies or lack of proper abstraction)
   - Code complexity, maintainability issues, and technical debt visible in the code

4. **Patterns and Insights**: After reading multiple files, identify:
   - Common patterns in coupling relationships
   - Architectural concerns or technical debt indicators visible in the code
   - Recommendations for improving code organization based on actual code structure

## Required Output Format

Provide your analysis in a structured, textual format suitable for a human-readable report. Follow this exact structure:

### Executive Summary
[2-3 paragraphs providing a high-level overview of key findings, main refactoring opportunities, and overall code health assessment]

### Hotspot Clusters
[For each significant cluster of coupled files, provide:]

**Cluster: [Descriptive Name]**
- **Description**: [What this cluster represents and its purpose in the codebase]
- **Files Involved**: 
  - [File path 1] ([X] modifications, [Y] LOC)
  - [File path 2] ([X] modifications, [Y] LOC)
  - [Continue for all files in cluster]
- **Coupling Analysis**: [Describe the coupling relationships - which files are most strongly coupled and why]
- **Refactoring Recommendations**: 
  - [Specific recommendation 1]
  - [Specific recommendation 2]
  - [Continue with actionable suggestions]

[Repeat for each significant cluster]

### High-Risk Areas
[Identify and describe files that are particularly problematic:]

**File: [path]**
- **Risk Factors**: [Why this file is high-risk - high complexity, frequent changes, tight coupling, etc.]
- **Impact**: [What happens if this file continues to accumulate technical debt]
- **Recommendations**: [Specific actions to reduce risk]

[Repeat for each high-risk file]

### Patterns and Insights
[Overall observations about the codebase:]

- [Pattern 1]: [Description and implications]
- [Pattern 2]: [Description and implications]
- [Continue with patterns]

### Priority Recommendations
[Top 3-5 refactoring priorities ranked by impact and feasibility:]

1. **[Priority 1]**: [Description, why it's important, estimated impact]
2. **[Priority 2]**: [Description, why it's important, estimated impact]
3. **[Priority 3]**: [Description, why it's important, estimated impact]
[Continue as needed]

## Important Guidelines

- **Read the files**: You must read the actual source code files to provide meaningful analysis. Start by reading the hotspot files and their strongly coupled files.
- Be specific: Reference actual file paths, code patterns, and coupling counts from the data
- Be actionable: Provide concrete, implementable recommendations based on what you see in the code
- Be concise: Keep descriptions clear and focused
- Focus on refactoring opportunities: Identify where code organization can be improved based on actual code structure
- Consider coupling strength: Strong coupling (high counts) indicates tighter relationships - read the code to understand why
- Consider file complexity: High LOC + high modifications = higher refactoring priority - examine the code to see what makes it complex
- Code-based insights: Base your recommendations on actual code patterns, not just metadata

## Analysis Steps

1. Start by reading the JSON file at ${inputFilePath} to understand the hotspot data
2. Then read the hotspot files listed in the data
3. For files with strong coupling, read the coupled files to understand relationships
4. Analyze the code structure, dependencies, and patterns
5. Provide recommendations based on what you observe in the actual code

## Important: After completing your analysis

Once you have finished your analysis and displayed it to the user, you should:
1. Ask the user if they would like to save the analysis to a file
2. If they confirm, save the complete analysis (including all sections) to: ${outputFilePath}

You can use the write tool to save the file. Make sure to save the complete, formatted analysis.

Begin your analysis by reading the JSON file and hotspot files now.`;

  return prompt;
}
