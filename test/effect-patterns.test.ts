/**
 * Example tests demonstrating Effect patterns
 * No async/await or try/catch - pure Effect composition
 */
import { describe, test, expect } from "bun:test";
import { Effect, pipe } from "effect";

describe("Effect Patterns", () => {
  test("Effect.succeed creates a successful Effect", async () => {
    const effect = Effect.succeed(42);
    const result = await Effect.runPromise(effect);
    expect(result).toBe(42);
  });

  test("Effect.fail creates a failed Effect", async () => {
    const effect = pipe(
      Effect.fail("error"),
      Effect.catchAll((error) => Effect.succeed(`caught: ${error}`))
    );
    const result = await Effect.runPromise(effect);
    expect(result).toBe("caught: error");
  });

  test("pipe chains Effect transformations", async () => {
    const effect = pipe(
      Effect.succeed(10),
      Effect.map((n) => n * 2),
      Effect.map((n) => n + 5),
      Effect.map((n) => n.toString())
    );
    const result = await Effect.runPromise(effect);
    expect(result).toBe("25");
  });

  test("Effect.flatMap handles dependent operations", async () => {
    const effect = pipe(
      Effect.succeed(5),
      Effect.flatMap((n) => Effect.succeed(n * 2)),
      Effect.flatMap((n) => Effect.succeed(`result: ${n}`))
    );
    const result = await Effect.runPromise(effect);
    expect(result).toBe("result: 10");
  });

  test("Effect.match handles both success and failure", async () => {
    const successEffect = pipe(
      Effect.succeed(42),
      Effect.match({
        onFailure: () => "failed",
        onSuccess: (value) => `success: ${value}`,
      })
    );
    const successResult = await Effect.runPromise(successEffect);
    expect(successResult).toBe("success: 42");

    const failureEffect = pipe(
      Effect.fail("error"),
      Effect.match({
        onFailure: (error) => `failed: ${error}`,
        onSuccess: () => "success",
      })
    );
    const failureResult = await Effect.runPromise(failureEffect);
    expect(failureResult).toBe("failed: error");
  });

  test("Effect.all runs multiple effects in parallel", async () => {
    const effects = [
      Effect.succeed(1),
      Effect.succeed(2),
      Effect.succeed(3),
    ];
    const result = await Effect.runPromise(Effect.all(effects));
    expect(result).toEqual([1, 2, 3]);
  });

  test("Effect.tryPromise wraps promises without async/await", async () => {
    const effect = Effect.tryPromise({
      try: () => Promise.resolve("async value"),
      catch: (error) => `error: ${error}`,
    });
    const result = await Effect.runPromise(effect);
    expect(result).toBe("async value");
  });

  test("Effect provides type-safe error handling", async () => {
    type MyError = { _tag: "MyError"; message: string };

    const riskyOperation = (shouldFail: boolean): Effect.Effect<number, MyError> =>
      shouldFail
        ? Effect.fail({ _tag: "MyError", message: "Operation failed" })
        : Effect.succeed(42);

    const successResult = await Effect.runPromise(
      pipe(
        riskyOperation(false),
        Effect.match({
          onFailure: (error) => -1,
          onSuccess: (value) => value,
        })
      )
    );
    expect(successResult).toBe(42);

    const failureResult = await Effect.runPromise(
      pipe(
        riskyOperation(true),
        Effect.match({
          onFailure: (error) => error.message,
          onSuccess: (value) => value.toString(),
        })
      )
    );
    expect(failureResult).toBe("Operation failed");
  });
});
