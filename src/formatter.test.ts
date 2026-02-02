import { describe, it, expect } from "vitest";
import { formatAsTable } from "./formatter.js";
import type { HotspotResult } from "./analyzer.js";

function hotspot(
  file: string,
  modificationCount: number,
  linesOfCode: number
): HotspotResult {
  return { file, modificationCount, linesOfCode, coupling: [] };
}

describe("formatAsTable", () => {
  it('returns "No hotspots found." for empty results', () => {
    expect(formatAsTable([])).toBe("No hotspots found.");
  });

  it("outputs correct CSV header for non-empty results", () => {
    const result = formatAsTable([hotspot("src/foo.ts", 5, 100)]);
    expect(result).toMatch(/^File,Modifications,Lines of Code\n/);
  });

  it("outputs one row per result with file, modificationCount, linesOfCode", () => {
    const result = formatAsTable([
      hotspot("src/foo.ts", 5, 100),
      hotspot("src/bar.ts", 3, 50),
    ]);
    const lines = result.trim().split("\n");
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[1]).toBe("src/foo.ts,5,100");
    expect(lines[2]).toBe("src/bar.ts,3,50");
  });

  it("escapes commas in file path with quotes", () => {
    const result = formatAsTable([hotspot("src/foo,bar.ts", 1, 10)]);
    expect(result).toContain('"src/foo,bar.ts",1,10');
  });

  it("escapes quotes in file path by doubling them", () => {
    const result = formatAsTable([hotspot('src/foo"bar.ts', 1, 10)]);
    expect(result).toContain('"src/foo""bar.ts",1,10');
  });
});
