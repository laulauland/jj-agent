/**
 * Core JJ command execution using Effect
 * No async/await or try/catch - pure Effect-based flow control
 */
import { Effect, pipe } from "effect";
import type { JJCommandError, JJNotFoundError } from "./types.ts";

/**
 * Execute a JJ command and return stdout
 */
export const executeJJ = (
  args: readonly string[],
  cwd?: string
): Effect.Effect<string, JJCommandError | JJNotFoundError> =>
  pipe(
    Effect.tryPromise({
      try: () => {
        const proc = Bun.spawn(["jj", ...args], {
          cwd: cwd ?? process.cwd(),
          stdout: "pipe",
          stderr: "pipe",
        });
        return proc.exited.then(() => ({
          exitCode: proc.exitCode,
          stdout: proc.stdout,
          stderr: proc.stderr,
        }));
      },
      catch: (error) => ({
        _tag: "JJNotFoundError" as const,
        message:
          error instanceof Error
            ? error.message
            : "Failed to execute jj command",
      }),
    }),
    Effect.flatMap((result) =>
      Effect.tryPromise({
        try: async () => {
          const stdout = await new Response(result.stdout).text();
          const stderr = await new Response(result.stderr).text();
          return { ...result, stdout, stderr };
        },
        catch: (error) => ({
          _tag: "JJNotFoundError" as const,
          message:
            error instanceof Error
              ? error.message
              : "Failed to read command output",
        }),
      })
    ),
    Effect.flatMap(({ exitCode, stdout, stderr }) =>
      exitCode === 0
        ? Effect.succeed(stdout.trim())
        : Effect.fail({
            _tag: "JJCommandError" as const,
            command: `jj ${args.join(" ")}`,
            exitCode,
            stderr,
            stdout,
          })
    )
  );

/**
 * Check if JJ is available in the system
 */
export const checkJJAvailable = (): Effect.Effect<
  boolean,
  JJCommandError | JJNotFoundError
> =>
  pipe(
    executeJJ(["--version"]),
    Effect.map(() => true),
    Effect.catchAll(() => Effect.succeed(false))
  );

/**
 * Get the current JJ version
 */
export const getJJVersion = (): Effect.Effect<
  string,
  JJCommandError | JJNotFoundError
> =>
  pipe(
    executeJJ(["--version"]),
    Effect.map((output) => {
      const match = output.match(/jj\s+([\d.]+)/);
      return match?.[1] ?? output;
    })
  );
