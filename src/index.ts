/**
 * JJ Agent - Main entry point
 * Uses Effect for flow control throughout the application
 */
import { Effect, pipe } from "effect";
import { checkJJAvailable, getJJVersion } from "./jj/index.ts";

/**
 * Main program using Effect
 */
const program = pipe(
  Effect.log("Starting JJ Agent..."),
  Effect.flatMap(() => checkJJAvailable()),
  Effect.flatMap((available) =>
    available
      ? pipe(
          getJJVersion(),
          Effect.flatMap((version) =>
            Effect.log(`JJ is available (version: ${version})`)
          )
        )
      : Effect.fail(new Error("JJ is not available on this system"))
  ),
  Effect.flatMap(() => Effect.log("JJ Agent initialized successfully")),
  Effect.catchAll((error) =>
    Effect.log(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    )
  )
);

// Run the program
Effect.runPromise(program);
