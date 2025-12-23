/**
 * Terminal UI Components
 * Integration with @mariozechner/pl-tui
 */

import { Effect } from "effect";
import { AppError } from "../types/errors.ts";

/**
 * Terminal UI wrapper
 * TODO: Full integration with pl-tui when the library is properly set up
 */
export class Terminal {
  /**
   * Create a progress bar
   */
  static createProgressBar(
    total: number
  ): Effect.Effect<ProgressBar, AppError, never> {
    return Effect.succeed(new ProgressBar(total));
  }

  /**
   * Create a spinner
   */
  static createSpinner(
    message: string
  ): Effect.Effect<Spinner, AppError, never> {
    return Effect.succeed(new Spinner(message));
  }

  /**
   * Clear the terminal
   */
  static clear(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      console.clear();
    });
  }

  /**
   * Move cursor up
   */
  static moveCursorUp(lines: number): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      process.stdout.write(`\x1b[${lines}A`);
    });
  }

  /**
   * Clear current line
   */
  static clearLine(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      process.stdout.write("\x1b[2K\r");
    });
  }
}

/**
 * Progress bar component
 */
export class ProgressBar {
  private current = 0;

  constructor(private readonly total: number) {}

  /**
   * Update progress
   */
  update(current: number): Effect.Effect<void, never, never> {
    this.current = current;
    return this.render();
  }

  /**
   * Increment progress
   */
  increment(): Effect.Effect<void, never, never> {
    this.current++;
    return this.render();
  }

  /**
   * Complete the progress bar
   */
  complete(): Effect.Effect<void, never, never> {
    this.current = this.total;
    return this.render();
  }

  private render(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      const percent = Math.floor((this.current / this.total) * 100);
      const filled = Math.floor(percent / 2);
      const empty = 50 - filled;
      const bar = "█".repeat(filled) + "░".repeat(empty);
      process.stdout.write(`\r[${bar}] ${percent}%`);
      if (this.current >= this.total) {
        process.stdout.write("\n");
      }
    });
  }
}

/**
 * Spinner component
 */
export class Spinner {
  private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private currentFrame = 0;
  private interval: Timer | null = null;

  constructor(private message: string) {}

  /**
   * Start the spinner
   */
  start(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.interval = setInterval(() => {
        this.render();
      }, 80);
    });
  }

  /**
   * Stop the spinner
   */
  stop(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      process.stdout.write("\r\x1b[2K");
    });
  }

  /**
   * Update the message
   */
  updateMessage(message: string): Effect.Effect<void, never, never> {
    this.message = message;
    return Effect.succeed(undefined);
  }

  private render(): void {
    const frame = this.frames[this.currentFrame];
    this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    process.stdout.write(`\r${frame} ${this.message}`);
  }
}
