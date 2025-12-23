/**
 * Workflow orchestrator - coordinates the 5-step workflow
 */

import { Effect, pipe } from "effect";
import { Config } from "../types/config.ts";
import { AppError } from "../types/errors.ts";
import { ReviewResult } from "../types/workflow.ts";
import { WorkspaceAnalyzer } from "./workspace-analysis.ts";
import { ContextBuilder } from "./context-building.ts";
import { AIPlan ner } from "./ai-planning.ts";
import { Executor } from "./execution.ts";
import { Reviewer } from "./review.ts";
import { UIService } from "../services/ui.ts";

/**
 * Workflow orchestrator
 */
export class WorkflowOrchestrator {
  private constructor(
    private readonly config: Config,
    private readonly analyzer: WorkspaceAnalyzer,
    private readonly contextBuilder: ContextBuilder,
    private readonly planner: AIPlanner,
    private readonly executor: Executor,
    private readonly reviewer: Reviewer
  ) {}

  /**
   * Create a new workflow orchestrator
   */
  static create(
    config: Config
  ): Effect.Effect<WorkflowOrchestrator, AppError, never> {
    return pipe(
      Effect.all([
        WorkspaceAnalyzer.create(config.workspace),
        ContextBuilder.create(config.workspace),
        AIPlanner.create(config.openai),
        Executor.create(config.workspace),
        Reviewer.create(),
      ]),
      Effect.map(
        ([analyzer, contextBuilder, planner, executor, reviewer]) =>
          new WorkflowOrchestrator(
            config,
            analyzer,
            contextBuilder,
            planner,
            executor,
            reviewer
          )
      ),
      Effect.catchAll((error) =>
        Effect.fail(
          new AppError({
            message: "Failed to create workflow orchestrator",
            cause: error,
          })
        )
      )
    );
  }

  /**
   * Run the complete workflow
   */
  run(): Effect.Effect<ReviewResult, AppError, never> {
    return pipe(
      // Step 1: Analyze workspace
      UIService.showStep("Analyzing workspace..."),
      Effect.flatMap(() => this.analyzer.analyze()),
      Effect.tap((workspace) =>
        UIService.showWorkspaceAnalysis(workspace)
      ),

      // Step 2: Build context
      Effect.flatMap((workspace) =>
        pipe(
          UIService.showStep("Building context..."),
          Effect.flatMap(() => this.contextBuilder.build(workspace)),
          Effect.tap((context) => UIService.showContext(context))
        )
      ),

      // Step 3: Create execution plan
      Effect.flatMap((context) =>
        pipe(
          UIService.showStep("Creating execution plan..."),
          Effect.flatMap(() => this.planner.createPlan(context)),
          Effect.tap((plan) => UIService.showPlan(plan))
        )
      ),

      // Step 4: Execute plan
      Effect.flatMap((plan) =>
        pipe(
          UIService.showStep("Executing plan..."),
          Effect.flatMap(() => this.executor.execute(plan)),
          Effect.tap((result) => UIService.showExecutionResult(result))
        )
      ),

      // Step 5: Review execution
      Effect.flatMap((result) =>
        pipe(
          UIService.showStep("Reviewing execution..."),
          Effect.flatMap(() => this.reviewer.review(result)),
          Effect.tap((review) => UIService.showReview(review))
        )
      ),

      // Error handling
      Effect.catchAll((error) =>
        Effect.fail(
          new AppError({
            message: "Workflow execution failed",
            cause: error,
          })
        )
      )
    );
  }
}
