import { writeFile, readFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { generateText, tool } from "ai";
import { z } from "zod";
import { resolveModel, getEnvVarForProvider } from "./modelRegistry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Maximum steps for tool-augmented report generation (read_report + read_file calls + final report). */
const MAX_ANALYSIS_STEPS = 25;

/**
 * Create a read_report tool that returns the hotspot report JSON. Call this first to get the data.
 */
function createReadReportTool(reportJsonPath: string) {
  return tool({
    description:
      "Read the hotspot report JSON. Call this first to get the analysis data (arguments, results, coupling). Use the returned data to identify which repository files to read with read_file.",
    parameters: z.object({}),
    execute: async () => {
      try {
        const content = await readFile(reportJsonPath, "utf-8");
        return { content };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: `Failed to read report: ${message}` };
      }
    },
  });
}

/**
 * Create a read_file tool that reads files from the repository. Paths are relative to workspacePath.
 * Resolves path safely and rejects reads outside the workspace.
 */
function createReadFileTool(workspacePath: string) {
  const workspaceRoot = resolve(workspacePath);
  return tool({
    description:
      "Read the contents of a source file in the repository. Use the file path as it appears in the hotspot JSON (relative to the repository root, e.g. 'src/foo.ts' or 'apps/tk-checkout/package.json').",
    parameters: z.object({
      path: z
        .string()
        .describe(
          "File path relative to repository root (e.g. src/analyze.ts, package.json)"
        ),
    }),
    execute: async ({ path: filePath }, _options) => {
      const normalized = resolve(workspaceRoot, filePath);
      if (!normalized.startsWith(workspaceRoot)) {
        return { error: `Path is outside repository: ${filePath}` };
      }
      try {
        const content = await readFile(normalized, "utf-8");
        return { content };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: `Failed to read ${filePath}: ${message}` };
      }
    },
  });
}

/**
 * Run report generation: call the AI SDK with the given model to produce the report from
 * hotspot data, then write the result to the output path. Used when hotspotter is invoked with --report.
 * The model can use the read_file tool to read source files from the repository (workspacePath).
 */
export async function runAnalysis(
  inputFilePath: string,
  outputFilePath: string,
  workspacePath: string,
  modelId: string
): Promise<void> {
  const absoluteInputPath = resolve(inputFilePath);
  const prompt = await createAnalysisPrompt(absoluteInputPath, outputFilePath);
  const model = resolveModel(modelId);
  const tools = {
    read_report: createReadReportTool(absoluteInputPath),
    read_file: createReadFileTool(workspacePath),
  };

  try {
    console.error("Generating report with AI...");
    const { text } = await generateText({
      model,
      prompt,
      tools,
      maxSteps: MAX_ANALYSIS_STEPS,
    });
    await writeFile(outputFilePath, text, "utf-8");
    console.error(`Report written to ${outputFilePath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const provider = modelId.trim().split(":")[0]?.toLowerCase();
    if (
      provider &&
      (message.includes("401") ||
        message.includes("API key") ||
        message.includes("authentication") ||
        message.includes("Invalid API key") ||
        message.includes("API key not found"))
    ) {
      const envVar = getEnvVarForProvider(provider);
      console.error(`\n✗ ${message}`);
      console.error(`  Set ${envVar} for the ${provider} provider.`);
      throw new Error(
        `${message}. Set ${envVar} for the ${provider} provider.`
      );
    }
    throw error;
  }
}

async function createAnalysisPrompt(
  inputFilePath: string,
  outputFilePath: string
): Promise<string> {
  const promptPath = join(__dirname, "prompt.md");
  const template = await readFile(promptPath, "utf-8");
  return template
    .replace(/\{\{INPUT_FILE_PATH\}\}/g, inputFilePath)
    .replace(/\{\{OUTPUT_FILE_PATH\}\}/g, outputFilePath);
}
