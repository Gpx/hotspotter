import { describe, it, expect } from "vitest";
import { parseArgs, getReportOutputPaths } from "./args.js";

describe("parseArgs", () => {
  describe("valid options", () => {
    it("returns expected shape for minimal valid options", () => {
      const result = parseArgs({
        path: "/repo",
        since: "12 months ago",
        percentage: "10",
        limit: "30",
        couplingThreshold: "5",
      });
      expect(result).toEqual({
        path: "/repo",
        since: "12 months ago",
        until: undefined,
        percentage: 10,
        limit: 30,
        couplingThreshold: 5,
        output: undefined,
        report: false,
        exclude: undefined,
      });
    });

    it("sets report true when options.report is true", () => {
      const result = parseArgs({
        path: "/repo",
        since: "12 months ago",
        percentage: "10",
        limit: "30",
        couplingThreshold: "5",
        report: true,
        output: "report",
      });
      expect(result.report).toBe(true);
      expect(result.output).toBe("report");
    });

    it("sets report false when options.report is absent", () => {
      const result = parseArgs({
        path: "/repo",
        since: "12 months ago",
        percentage: "10",
        limit: "30",
        couplingThreshold: "5",
        output: "out.json",
      });
      expect(result.report).toBe(false);
    });

    it("parses percentage, limit, couplingThreshold as numbers", () => {
      const result = parseArgs({
        path: "/repo",
        since: "2024-01-01",
        until: "2024-12-31",
        percentage: "25",
        limit: "50",
        couplingThreshold: "0",
        output: "out.json",
      });
      expect(result.percentage).toBe(25);
      expect(result.limit).toBe(50);
      expect(result.couplingThreshold).toBe(0);
      expect(result.until).toBe("2024-12-31");
      expect(result.output).toBe("out.json");
    });

    it("accepts valid exclude regex patterns", () => {
      const result = parseArgs({
        path: "/repo",
        since: "1 year ago",
        percentage: "10",
        limit: "30",
        couplingThreshold: "5",
        exclude: ["node_modules", "\\.test\\.ts$"],
      });
      expect(result.exclude).toEqual(["node_modules", "\\.test\\.ts$"]);
    });
  });

  describe("invalid options", () => {
    it("throws when percentage is out of range (0)", () => {
      expect(() =>
        parseArgs({
          path: "/repo",
          since: "1 year ago",
          percentage: "0",
          limit: "30",
          couplingThreshold: "5",
        })
      ).toThrow("Percentage must be a number between 1 and 100");
    });

    it("throws when percentage is out of range (> 100)", () => {
      expect(() =>
        parseArgs({
          path: "/repo",
          since: "1 year ago",
          percentage: "101",
          limit: "30",
          couplingThreshold: "5",
        })
      ).toThrow("Percentage must be a number between 1 and 100");
    });

    it("throws when percentage is not a number", () => {
      expect(() =>
        parseArgs({
          path: "/repo",
          since: "1 year ago",
          percentage: "ten",
          limit: "30",
          couplingThreshold: "5",
        })
      ).toThrow("Percentage must be a number between 1 and 100");
    });

    it("throws when limit is zero or negative", () => {
      expect(() =>
        parseArgs({
          path: "/repo",
          since: "1 year ago",
          percentage: "10",
          limit: "0",
          couplingThreshold: "5",
        })
      ).toThrow("Limit must be a positive number");
    });

    it("throws when limit is not a number", () => {
      expect(() =>
        parseArgs({
          path: "/repo",
          since: "1 year ago",
          percentage: "10",
          limit: "many",
          couplingThreshold: "5",
        })
      ).toThrow("Limit must be a positive number");
    });

    it("throws when couplingThreshold is negative", () => {
      expect(() =>
        parseArgs({
          path: "/repo",
          since: "1 year ago",
          percentage: "10",
          limit: "30",
          couplingThreshold: "-1",
        })
      ).toThrow("Coupling threshold must be a non-negative number");
    });

    it("throws when exclude contains invalid regex", () => {
      expect(() =>
        parseArgs({
          path: "/repo",
          since: "1 year ago",
          percentage: "10",
          limit: "30",
          couplingThreshold: "5",
          exclude: ["[invalid"],
        })
      ).toThrow("Invalid regex pattern: [invalid");
    });
  });
});

describe("getReportOutputPaths", () => {
  it("strips extension and returns .json and .md paths", () => {
    const { jsonPath, reportPath } = getReportOutputPaths("report.md");
    expect(jsonPath).toBe("report.json");
    expect(reportPath).toBe("report.md");
  });

  it("uses path as base when it has no extension", () => {
    const { jsonPath, reportPath } = getReportOutputPaths("out");
    expect(jsonPath).toBe("out.json");
    expect(reportPath).toBe("out.md");
  });

  it("strips extension and preserves directory", () => {
    const { jsonPath, reportPath } = getReportOutputPaths("dir/report.md");
    expect(jsonPath).toBe("dir/report.json");
    expect(reportPath).toBe("dir/report.md");
  });
});
