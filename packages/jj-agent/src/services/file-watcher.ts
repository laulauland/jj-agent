/**
 * File Watcher Service - Watch for file changes
 */

import { Effect, pipe } from "effect";
import chokidar from "chokidar";
import { WorkflowOrchestrator } from "../workflow/orchestrator.ts";
import { AppError } from "../types/errors.ts";

/**
 * File watcher service
 */
export class FileWatcherService {
  private static watcher: chokidar.FSWatcher | null = null;
  private static debounceTimer: Timer | null = null;

  /**
   * Start watching for file changes
   */
  static start(
    orchestrator: WorkflowOrchestrator
  ): Effect.Effect<void, AppError, never> {
    return Effect.try({
      try: () => {
        const cwd = process.cwd();

        this.watcher = chokidar.watch(cwd, {
          ignored: [
            /(^|[\/\\])\../,
            "**/node_modules/**",
            "**/.jj/**",
            "**/.git/**",
            "**/dist/**",
            "**/build/**",
          ],
          persistent: true,
          ignoreInitial: true,
        });

        this.watcher.on("all", (event, path) => {
          // Debounce changes
          if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
          }

          this.debounceTimer = setTimeout(() => {
            console.log(`File ${event}: ${path}`);
            // Trigger workflow
            Effect.runPromise(
              orchestrator.run()
            ).catch((error) => {
              console.error("Workflow execution failed:", error);
            });
          }, 1000);
        });
      },
      catch: (error) =>
        new AppError({
          message: "Failed to start file watcher",
          cause: error,
        }),
    });
  }

  /**
   * Stop watching for file changes
   */
  static stop(): Effect.Effect<void, AppError, never> {
    return Effect.try({
      try: async () => {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = null;
        }

        if (this.watcher) {
          await this.watcher.close();
          this.watcher = null;
        }
      },
      catch: (error) =>
        new AppError({
          message: "Failed to stop file watcher",
          cause: error,
        }),
    });
  }
}
