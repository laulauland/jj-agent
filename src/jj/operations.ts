/**
 * High-level JJ operations using Effect for composability
 */
import { Effect, pipe } from "effect";
import { executeJJ } from "./commands.ts";
import type {
  JJStatus,
  JJRevision,
  JJBranch,
  JJLogEntry,
  JJError,
  JJParseError,
} from "./types.ts";

/**
 * Get the current status of the working copy
 */
export const getStatus = (cwd?: string): Effect.Effect<JJStatus, JJError> =>
  pipe(
    executeJJ(["status", "--no-pager"], cwd),
    Effect.map((output) => {
      const hasChanges = !output.includes("The working copy is clean");
      const workingCopyMatch = output.match(/Working copy changes:\s*@\s+(\w+)/);
      const workingCopyRevision = workingCopyMatch?.[1] ?? "@";

      return {
        workingCopyRevision,
        hasChanges,
        modifiedFiles: [],
        addedFiles: [],
        removedFiles: [],
      };
    })
  );

/**
 * Create a new change with a description
 */
export const createChange = (
  description: string,
  cwd?: string
): Effect.Effect<string, JJError> =>
  pipe(
    executeJJ(["new", "-m", description], cwd),
    Effect.map((output) => {
      const match = output.match(/Created new change ([a-z0-9]+)/);
      return match?.[1] ?? "@";
    })
  );

/**
 * Get the log of revisions
 */
export const getLog = (
  limit?: number,
  cwd?: string
): Effect.Effect<readonly JJLogEntry[], JJError> =>
  pipe(
    executeJJ(
      [
        "log",
        "--no-pager",
        "-T",
        'concat(change_id, "|", commit_id, "|", description.first_line(), "|", author.email(), "|", committer.timestamp(), "\\n")',
        ...(limit ? ["-r", `::@-${limit}`] : []),
      ],
      cwd
    ),
    Effect.flatMap((output) => {
      if (!output.trim()) {
        return Effect.succeed([]);
      }

      return pipe(
        Effect.try({
          try: () =>
            output
              .trim()
              .split("\n")
              .map((line) => {
                const [changeId, commitId, description, author, timestamp] =
                  line.split("|");
                if (!changeId || !commitId) {
                  throw new Error(`Invalid log line: ${line}`);
                }
                return {
                  revision: {
                    changeId,
                    commitId,
                    description: description ?? "",
                    author: author ?? "",
                    timestamp: new Date(timestamp ?? Date.now()),
                  },
                  parents: [],
                  children: [],
                };
              }),
          catch: (error) => ({
            _tag: "JJParseError" as const,
            raw: output,
            reason:
              error instanceof Error ? error.message : "Failed to parse log",
          }),
        })
      );
    })
  );

/**
 * List all branches
 */
export const listBranches = (
  cwd?: string
): Effect.Effect<readonly JJBranch[], JJError> =>
  pipe(
    executeJJ(["branch", "list", "--no-pager"], cwd),
    Effect.map((output) => {
      if (!output.trim()) {
        return [];
      }

      return output
        .trim()
        .split("\n")
        .map((line) => {
          const match = line.match(/^([^:]+):\s*(.+)$/);
          if (!match) return null;
          return {
            name: match[1]?.trim() ?? "",
            target: match[2]?.trim() ?? "",
          };
        })
        .filter((branch): branch is JJBranch => branch !== null);
    })
  );

/**
 * Describe (amend) the current change
 */
export const describe = (
  description: string,
  cwd?: string
): Effect.Effect<void, JJError> =>
  pipe(
    executeJJ(["describe", "-m", description], cwd),
    Effect.map(() => undefined)
  );

/**
 * Squash the current change into its parent
 */
export const squash = (cwd?: string): Effect.Effect<void, JJError> =>
  pipe(
    executeJJ(["squash"], cwd),
    Effect.map(() => undefined)
  );
