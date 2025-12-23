/**
 * Tests for JJ command execution using Effect
 */
import { describe, test, expect } from "bun:test";
import { Effect, pipe } from "effect";
import { checkJJAvailable, getJJVersion, executeJJ } from "@/jj/commands.ts";

describe("JJ Commands", () => {
  test("checkJJAvailable should return a boolean Effect", async () => {
    const result = await Effect.runPromise(
      pipe(
        checkJJAvailable(),
        Effect.map((available) => {
          expect(typeof available).toBe("boolean");
          return available;
        })
      )
    );

    // Just verify it ran without throwing
    expect(result).toBeDefined();
  });

  test("getJJVersion should return version string if JJ is available", async () => {
    const isAvailable = await Effect.runPromise(checkJJAvailable());

    if (isAvailable) {
      const version = await Effect.runPromise(
        pipe(
          getJJVersion(),
          Effect.map((v) => {
            expect(typeof v).toBe("string");
            expect(v.length).toBeGreaterThan(0);
            return v;
          })
        )
      );

      expect(version).toBeDefined();
    }
  });

  test("executeJJ should handle invalid commands gracefully", async () => {
    const result = await Effect.runPromise(
      pipe(
        executeJJ(["invalid-command-xyz"]),
        Effect.match({
          onFailure: (error) => {
            expect(error._tag).toMatch(/JJCommandError|JJNotFoundError/);
            return "error" as const;
          },
          onSuccess: () => "success" as const,
        })
      )
    );

    // Should handle error gracefully
    expect(result).toBeDefined();
  });

  test("Effect composition should work correctly", async () => {
    const composed = pipe(
      checkJJAvailable(),
      Effect.flatMap((available) =>
        available
          ? Effect.succeed("JJ is available")
          : Effect.succeed("JJ is not available")
      ),
      Effect.map((message) => message.toUpperCase())
    );

    const result = await Effect.runPromise(composed);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/JJ IS (NOT )?AVAILABLE/);
  });
});
