/**
 * JJ Service - Jujutsu version control integration
 */

import { Effect, pipe } from "effect";
import { JJError, WorkspaceError, ExecutionError } from "../types/errors.ts";
import { FileChange } from "../types/workflow.ts";

/**
 * JJ service for Jujutsu operations
 */
export class JJService {
  private constructor(private readonly workspacePath: string) {}

  /**
   * Create a new JJ service
   */
  static create(
    workspacePath: string
  ): Effect.Effect<JJService, JJError, never> {
    return Effect.succeed(new JJService(workspacePath));
  }

  /**
   * Check if JJ is initialized in the workspace
   */
  isInitialized(): Effect.Effect<boolean, WorkspaceError, never> {
    return pipe(
      this.execute(["status"]),
      Effect.map(() => true),
      Effect.catchAll(() => Effect.succeed(false))
    );
  }

  /**
   * Get the current revision
   */
  getCurrentRevision(): Effect.Effect<string, WorkspaceError, never> {
    return pipe(
      this.execute(["log", "-r", "@", "-T", "change_id"]),
      Effect.map((output) => output.trim()),
      Effect.catchAll((error) =>
        Effect.fail(
          new WorkspaceError({
            message: "Failed to get current revision",
            cause: error,
          })
        )
      )
    );
  }

  /**
   * Get changed files in the current revision
   */
  getChangedFiles(): Effect.Effect<
    ReadonlyArray<FileChange>,
    WorkspaceError,
    never
  > {
    return pipe(
      this.execute(["status"]),
      Effect.map((output) => this.parseStatusOutput(output)),
      Effect.catchAll((error) =>
        Effect.fail(
          new WorkspaceError({
            message: "Failed to get changed files",
            cause: error,
          })
        )
      )
    );
  }

  /**
   * Execute a JJ command
   */
  executeCommand(
    command: string
  ): Effect.Effect<string, ExecutionError, never> {
    // Parse command string into args
    const args = command.split(" ").filter((arg) => arg.length > 0);
    
    return pipe(
      this.execute(args),
      Effect.catchAll((error) =>
        Effect.fail(
          new ExecutionError({
            message: "JJ command failed",
            command,
            cause: error,
          })
        )
      )
    );
  }

  /**
   * Execute a JJ command with arguments
   */
  private execute(
    args: ReadonlyArray<string>
  ): Effect.Effect<string, JJError, never> {
    return Effect.tryPromise({
      try: async () => {
        const proc = Bun.spawn(["jj", ...args], {
          cwd: this.workspacePath,
          stdout: "pipe",
          stderr: "pipe",
        });

        const [stdout, stderr] = await Promise.all([
          new Response(proc.stdout).text(),
          new Response(proc.stderr).text(),
        ]);

        const exitCode = await proc.exited;

        if (exitCode !== 0) {
          throw new Error(
            `JJ command failed with exit code ${exitCode}: ${stderr}`
          );
        }

        return stdout;
      },
      catch: (error) =>
        new JJError({
          message: "Failed to execute JJ command",
          command: args.join(" "),
          cause: error,
        }),
    });
  }

  /**
   * Parse JJ status output into file changes
   */
  private parseStatusOutput(output: string): ReadonlyArray<FileChange> {
    const lines = output.split("\n").filter((line) => line.trim().length > 0);
    const changes: FileChange[] = [];

    for (const line of lines) {
      // Format: "A path/to/file" or "M path/to/file" or "D path/to/file"
      const match = line.match(/^([AMD])\s+(.+)$/);
      if (match) {
        const [, status, path] = match;
        const type =
          status === "A"
            ? "added"
            : status === "M"
              ? "modified"
              : "deleted";
        changes.push({ path, type });
      }
    }

    return changes;
  }
}
