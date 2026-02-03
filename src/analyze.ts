import { readFile } from "fs/promises";
import { spawn } from "child_process";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Run report generation: spawn the AI agent to read the hotspot data JSON and write the report.
 * Used when hotspotter is invoked with --report.
 */
export async function runAnalysis(
  inputFilePath: string,
  outputFilePath: string,
  workspacePath: string
): Promise<void> {
  const absoluteInputPath = resolve(inputFilePath);
  const prompt = await createAnalysisPrompt(absoluteInputPath, outputFilePath);

  const agentArgs = ["--workspace", workspacePath, prompt];

  console.error("Starting AI agent in interactive mode...");
  console.error(
    "The agent will analyze the hotspots and ask if you want to save the results.\n"
  );

  return new Promise<void>((resolvePromise, reject) => {
    const agentProcess = spawn("agent", agentArgs, {
      stdio: ["inherit", "inherit", "inherit"],
    });

    agentProcess.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
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
}

async function createAnalysisPrompt(
  inputFilePath: string,
  outputFilePath: string
): Promise<string> {
  const promptPath = join(__dirname, "..", "src", "prompt.md");
  const template = await readFile(promptPath, "utf-8");
  return template
    .replace(/\{\{INPUT_FILE_PATH\}\}/g, inputFilePath)
    .replace(/\{\{OUTPUT_FILE_PATH\}\}/g, outputFilePath);
}
