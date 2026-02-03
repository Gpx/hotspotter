import { HotspotResult } from "./analyzer.js";

function escapeCsvField(field: string): string {
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function formatAsTable(results: HotspotResult[]): string {
  if (results.length === 0) {
    return "No hotspots found.";
  }

  // CSV header
  let csv = "File,Modifications,Lines of Code\n";

  // CSV rows
  for (const result of results) {
    csv += `${escapeCsvField(result.file)},${result.modificationCount},${result.linesOfCode}\n`;
  }

  return csv;
}
