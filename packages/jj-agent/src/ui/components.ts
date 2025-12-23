/**
 * Reusable UI components
 */

import { Effect } from "effect";

/**
 * Box component for bordered output
 */
export class Box {
  static render(
    title: string,
    content: string[],
    width = 60
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      const topBorder = `╔${'═'.repeat(width - 2)}╗`;
      const bottomBorder = `╚${'═'.repeat(width - 2)}╝`;
      console.log(topBorder);
      console.log(`║ ${title.padEnd(width - 4)} ║`);
      console.log(`╠${'═'.repeat(width - 2)}╣`);
      content.forEach((line) => {
        const padded = line.padEnd(width - 4);
        console.log(`║ ${padded} ║`);
      });
      console.log(bottomBorder);
    });
  }
}

/**
 * Table component
 */
export class Table {
  static render(
    headers: string[],
    rows: string[][]
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      const widths = headers.map((header, i) => {
        const maxRowWidth = Math.max(...rows.map((row) => (row[i] || "").length));
        return Math.max(header.length, maxRowWidth);
      });
      const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join(" │ ");
      console.log(headerRow);
      console.log(widths.map((w) => "─".repeat(w)).join("─┼─"));
      rows.forEach((row) => {
        const rowStr = row.map((cell, i) => (cell || "").padEnd(widths[i])).join(" │ ");
        console.log(rowStr);
      });
    });
  }
}

/**
 * List component
 */
export class List {
  static render(
    items: string[],
    ordered = false
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      items.forEach((item, i) => {
        const prefix = ordered ? `${i + 1}.` : "•";
        console.log(`  ${prefix} ${item}`);
      });
    });
  }
}

/**
 * Status badge component
 */
export class Badge {
  static render(
    status: "success" | "error" | "warning" | "info",
    text: string
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      const colors = {
        success: "\x1b[32m",
        error: "\x1b[31m",
        warning: "\x1b[33m",
        info: "\x1b[34m",
      };
      const reset = "\x1b[0m";
      console.log(`${colors[status]}[${text}]${reset}`);
    });
  }
}
