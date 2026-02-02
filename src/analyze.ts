#!/usr/bin/env node

import { Command } from "commander";
import { readFile } from "fs/promises";
import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const program = new Command();

program
  .name("hotspotter-analyze")
  .description(
    "Analyze Hotspotter report using AI agent to identify refactoring opportunities"
  )
  .requiredOption(
    "--input <file>",
    "Path to the JSON output file from Hotspotter"
  )
  .requiredOption(
    "--output <file>",
    "Path to the output markdown file where the agent will save the analysis"
  )
  .option(
    "--workspace <path>",
    "Workspace directory (repository path) for context",
    process.cwd()
  )
  .option("--model <model>", "Model to use for analysis")
  .action(async (options) => {
    try {
      // Read the JSON input file to extract repository path
      const jsonContent = await readFile(options.input, "utf-8");
      const data = JSON.parse(jsonContent);

      // Extract repository path from arguments
      const repoPath = data.arguments?.path || options.workspace;

      // Get absolute path to input file for the agent to read
      const { resolve } = await import("path");
      const inputFilePath = resolve(options.input);

      // Build the agent command arguments for interactive mode
      let agentArgs = ["--workspace", repoPath];

      if (options.model) {
        agentArgs.push("--model", options.model);
      }

      // Load prompt template and inject paths
      const prompt = await createAnalysisPrompt(inputFilePath, options.output);

      agentArgs.push(prompt);

      console.error("Starting AI agent in interactive mode...");
      console.error(
        "The agent will analyze the hotspots and ask if you want to save the results.\n"
      );

      // Execute the agent in interactive mode (no --print flag)
      return new Promise<void>((resolve, reject) => {
        const agentProcess = spawn("agent", agentArgs, {
          stdio: ["inherit", "inherit", "inherit"],
        });

        agentProcess.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Agent process exited with code ${code}`));
          }
        });

        agentProcess.on("error", (error) => {
          console.error("\n✗ Error starting agent process:");
          console.error(`  ${error.message}`);

          if (
            error.message.includes("ENOENT") ||
            error.message.includes("spawn")
          ) {
            console.error(
              '\n  This usually means the "agent" command is not found.'
            );
            console.error(
              "  Make sure Cursor Agent is installed and available in your PATH."
            );
            console.error(
              "  You may need to install it or add it to your PATH."
            );
          }

          reject(new Error(`Failed to start agent: ${error.message}`));
        });
      });
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

program.parse();

const __dirname = dirname(fileURLToPath(import.meta.url));

async function createAnalysisPrompt(
  inputFilePath: string,
  outputFilePath: string
): Promise<string> {
  // When running from dist/analyze.js, prompt lives in src/prompt.md
  const promptPath = join(__dirname, "..", "src", "prompt.md");
  const template = await readFile(promptPath, "utf-8");
  return template
    .replace(/\{\{INPUT_FILE_PATH\}\}/g, inputFilePath)
    .replace(/\{\{OUTPUT_FILE_PATH\}\}/g, outputFilePath);
}
