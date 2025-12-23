/**
 * JJ Agent - Main Entry Point
 * 
 * This is the main entry point for the jj-agent application.
 * It orchestrates the 5-step workflow using Effect patterns.
 */

import { Effect, pipe } from "effect";
import { WorkflowOrchestrator } from "./src/workflow/orchestrator.ts";
import { UIService } from "./src/services/ui.ts";
import { ConfigService } from "./src/services/config.ts";
import { FileWatcherService } from "./src/services/file-watcher.ts";
import { AppError } from "./src/types/errors.ts";

/**
 * Initialize and run the application
 */
const program = pipe(
  // Initialize services
  Effect.all([
    ConfigService.load(),
    UIService.initialize(),
  ]),
  
  // Start the UI
  Effect.flatMap(([config, ui]) =>
    pipe(
      UIService.showWelcome(),
      Effect.flatMap(() => Effect.succeed({ config, ui }))
    )
  ),
  
  // Initialize workflow orchestrator
  Effect.flatMap(({ config }) =>
    pipe(
      WorkflowOrchestrator.create(config),
      Effect.flatMap((orchestrator) =>
        pipe(
          UIService.log("info", "JJ Agent initialized successfully"),
          Effect.flatMap(() => Effect.succeed(orchestrator))
        )
      )
    )
  ),
  
  // Start file watching if enabled
  Effect.flatMap((orchestrator) =>
    pipe(
      FileWatcherService.start(orchestrator),
      Effect.flatMap(() =>
        pipe(
          UIService.log("info", "File watcher started"),
          Effect.map(() => orchestrator)
        )
      )
    )
  ),
  
  // Run initial workflow
  Effect.flatMap((orchestrator) =>
    pipe(
      orchestrator.run(),
      Effect.flatMap(() =>
        UIService.log("success", "Initial workflow completed")
      )
    )
  ),
  
  // Keep the process running
  Effect.flatMap(() =>
    Effect.log("JJ Agent is now watching for changes...")
  ),
  
  // Error handling
  Effect.catchAll((error: AppError) =>
    pipe(
      UIService.showError(error),
      Effect.flatMap(() => Effect.fail(error))
    )
  )
);

// Run the program
Effect.runPromise(program)
  .then(() => {
    console.log("JJ Agent started successfully");
  })
  .catch((error) => {
    console.error("Failed to start JJ Agent:", error);
    process.exit(1);
  });
