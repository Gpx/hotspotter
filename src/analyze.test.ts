import { describe, it, expect, vi, beforeEach } from "vitest";
import { runAnalysis } from "./analyze.js";
import { generateText } from "ai";
import * as fsPromises from "fs/promises";

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    generateText: vi.fn().mockResolvedValue({
      text: "# Refactoring Opportunities Report\n\nMocked report content.",
    }),
  };
});

vi.mock("./modelRegistry.js", () => ({
  resolveModel: vi.fn().mockReturnValue({}),
  getEnvVarForProvider: vi.fn((p: string) =>
    p === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"
  ),
}));

const mockTemplate =
  "Input: {{INPUT_FILE_PATH}}. Output: {{OUTPUT_FILE_PATH}}.";
const mockReportJson = '{"arguments":{"path":"."},"results":[]}';

vi.mock("fs/promises", () => ({
  readFile: vi.fn((path: string) =>
    Promise.resolve(
      String(path).endsWith("prompt.md") ? mockTemplate : mockReportJson
    )
  ),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe("runAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateText).mockResolvedValue({
      text: "# Refactoring Opportunities Report\n\nMocked report content.",
    } as Awaited<ReturnType<typeof generateText>>);
  });

  it("calls generateText with resolved model and prompt, then writes result to output path", async () => {
    await runAnalysis(
      "/path/to/input.json",
      "/path/to/report.md",
      "/workspace",
      "openai:gpt-4o"
    );

    expect(generateText).toHaveBeenCalledTimes(1);
    const call = vi.mocked(generateText).mock.calls[0][0] as unknown as {
      model: unknown;
      prompt: string;
      tools: Record<string, { execute: (args: { path: string }) => Promise<unknown> }>;
      maxSteps: number;
    };
    expect(call.prompt).toContain("/path/to/input.json");
    expect(call.prompt).toContain("/path/to/report.md");
    expect(call.prompt).not.toContain(mockReportJson);
    expect(call.model).toBeDefined();
    expect(call.tools).toBeDefined();
    expect(call.tools.read_report).toBeDefined();
    expect(typeof call.tools.read_report.execute).toBe("function");
    expect(call.tools.read_file).toBeDefined();
    expect(typeof call.tools.read_file.execute).toBe("function");
    expect(call.maxSteps).toBe(25);

    expect(vi.mocked(fsPromises.writeFile)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fsPromises.writeFile)).toHaveBeenCalledWith(
      "/path/to/report.md",
      "# Refactoring Opportunities Report\n\nMocked report content.",
      "utf-8"
    );
  });

  it("read_file tool reads files under workspace and rejects path traversal", async () => {
    const workspaceDir = "/repo/root";
    vi.mocked(fsPromises.readFile).mockImplementation((path: unknown) => {
      const p = String(path);
      if (p.endsWith("prompt.md")) return Promise.resolve(mockTemplate);
      if (p === "/path/to/input.json") return Promise.resolve(mockReportJson);
      const normalized = p.replace(/\\/g, "/");
      if (normalized.endsWith("src/foo.ts") && normalized.includes("repo/root"))
        return Promise.resolve("export function foo() {}");
      return Promise.reject(new Error("ENOENT"));
    });

    await runAnalysis(
      "/path/to/input.json",
      "/path/to/report.md",
      workspaceDir,
      "openai:gpt-4o"
    );

    const call = vi.mocked(generateText).mock.calls[0][0] as unknown as {
      tools: {
        read_report: { execute: (args?: unknown) => Promise<{ content?: string; error?: string }> };
        read_file: { execute: (args: { path: string }) => Promise<{ content?: string; error?: string }> };
      };
    };
    const readReportTool = call.tools.read_report;
    const readFileTool = call.tools.read_file;

    const reportResult = await readReportTool.execute({});
    expect(reportResult).toEqual({ content: mockReportJson });

    const ok = await readFileTool.execute({ path: "src/foo.ts" });
    expect(ok).toEqual({ content: "export function foo() {}" });

    const outside = await readFileTool.execute({ path: "../../etc/passwd" });
    expect(outside).toHaveProperty("error");
    expect((outside as { error: string }).error).toContain("outside repository");
  });
});
