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

  describe("when --report is set", () => {
    it("invokes runAnalysis with derived json path, report path, and workspace path", async () => {
      await runHotspotter({
        path: "/some/repo",
        since: "1 year ago",
        percentage: "10",
        limit: "30",
        couplingThreshold: "5",
        report: true,
        output: "report",
      });

      expect(runAnalysis).toHaveBeenCalledTimes(1);
      expect(runAnalysis).toHaveBeenCalledWith(
        "report.json",
        "report.md",
        "/some/repo"
      );
    });
  });
});
