import { describe, it, expect, vi, beforeEach } from "vitest";
import { runHotspotter } from "./index.js";

vi.mock("./analyze.js", () => ({
  runAnalysis: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./analyzer.js", () => ({
  analyzeHotspots: vi.fn().mockResolvedValue([]),
}));

vi.mock("fs/promises", () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./dateResolver.js", () => ({
  resolveDateRange: vi.fn().mockResolvedValue({
    since: "2024-01-01T00:00:00.000Z",
    until: "2025-01-01T00:00:00.000Z",
  }),
  getCommitRangeForRange: vi.fn().mockResolvedValue({}),
}));

const runAnalysis = (await import("./analyze.js")).runAnalysis as ReturnType<
  typeof vi.fn
>;

describe("runHotspotter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when --report is set without --model", () => {
    it("throws that --model is required when using --report", async () => {
      await expect(
        runHotspotter({
          path: "/some/repo",
          since: "1 year ago",
          percentage: "10",
          limit: "30",
          couplingThreshold: "5",
          report: true,
          output: "report",
        })
      ).rejects.toThrow("--model is required when using --report");
      expect(runAnalysis).not.toHaveBeenCalled();
    });
  });

  describe("when --report is set with --model", () => {
    it("invokes runAnalysis with derived json path, report path, workspace path, and model id", async () => {
      await runHotspotter({
        path: "/some/repo",
        since: "1 year ago",
        percentage: "10",
        limit: "30",
        couplingThreshold: "5",
        report: true,
        output: "report",
        model: "openai:gpt-4o",
      });

      expect(runAnalysis).toHaveBeenCalledTimes(1);
      expect(runAnalysis).toHaveBeenCalledWith(
        "report.json",
        "report.md",
        "/some/repo",
        "openai:gpt-4o"
      );
    });
  });

  describe("when --report is not set", () => {
    it("succeeds without --model and does not invoke runAnalysis", async () => {
      await runHotspotter({
        path: "/some/repo",
        since: "1 year ago",
        percentage: "10",
        limit: "30",
        couplingThreshold: "5",
        output: "out",
      });

      expect(runAnalysis).not.toHaveBeenCalled();
    });
  });
});
