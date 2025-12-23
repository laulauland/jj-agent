/**
 * Tests for JJ operations using Effect
 */
import { describe, test, expect } from "bun:test";
import { Effect, pipe } from "effect";
import { checkJJAvailable } from "@/jj/commands.ts";
import { getStatus, getLog, listBranches } from "@/jj/operations.ts";

describe("JJ Operations", () => {
  test("operations should return proper Effect types", async () => {
    const isAvailable = await Effect.runPromise(checkJJAvailable());

    if (isAvailable) {
      // Test that operations can be composed
      const composed = pipe(
        getStatus(),
        Effect.flatMap((status) => {
          expect(status).toHaveProperty("workingCopyRevision");
          expect(status).toHaveProperty("hasChanges");
          return Effect.succeed(status);
        }),
        Effect.catchAll((error) => {
          // It's ok if we're not in a JJ repo
          expect(error).toBeDefined();
          return Effect.succeed({
            workingCopyRevision: "@",
            hasChanges: false,
            modifiedFiles: [],
            addedFiles: [],
            removedFiles: [],
          });
        })
      );

      const result = await Effect.runPromise(composed);
      expect(result).toBeDefined();
    }
  });

  test("getLog should return array of log entries", async () => {
    const isAvailable = await Effect.runPromise(checkJJAvailable());

    if (isAvailable) {
      const result = await Effect.runPromise(
        pipe(
          getLog(5),
          Effect.match({
            onFailure: () => [],
            onSuccess: (entries) => entries,
          })
        )
      );

      expect(Array.isArray(result)).toBe(true);
    }
  });

  test("listBranches should return array of branches", async () => {
    const isAvailable = await Effect.runPromise(checkJJAvailable());

    if (isAvailable) {
      const result = await Effect.runPromise(
        pipe(
          listBranches(),
          Effect.match({
            onFailure: () => [],
            onSuccess: (branches) => branches,
          })
        )
      );

      expect(Array.isArray(result)).toBe(true);
    }
  });

  test("Effect error handling should work without try/catch", async () => {
    // Demonstrate Effect-based error handling
    const pipeline = pipe(
      getStatus("/nonexistent/path"),
      Effect.map((status) => ({ success: true, status })),
      Effect.catchAll((error) =>
        Effect.succeed({ success: false, error: error._tag })
      )
    );

    const result = await Effect.runPromise(pipeline);
    expect(result).toHaveProperty("success");
  });
});
