/**
 * UI Service - Terminal UI using pl-tui
 */

import { Effect } from "effect";
import { AppError } from "../types/errors.ts";
import {
  WorkspaceAnalysis,
  Context,
  ExecutionPlan,
  ExecutionResult,
  ReviewResult,
} from "../types/workflow.ts";

/**
 * UI service for terminal output
 * TODO: Integrate with @mariozechner/pl-tui for rich terminal UI
 */
export class UIService {
  /**
   * Initialize the UI
   */
  static initialize(): Effect.Effect<void, AppError, never> {
    return Effect.succeed(undefined);
  }

  /**
   * Show welcome message
   */
  static showWelcome(): Effect.Effect<void, AppError, never> {
    return Effect.sync(() => {
      console.log("\n╔═══════════════════════════════════════════════╗");
      console.log("║          JJ Agent - Jujutsu Workflow          ║");
      console.log("╚═══════════════════════════════════════════════╝\n");
    });
  }

  /**
   * Log a message
   */
  static log(
    level: "info" | "success" | "warn" | "error",
    message: string
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      const prefix =
        level === "info"
          ? "ℹ"
          : level === "success"
            ? "✓"
            : level === "warn"
              ? "⚠"
              : "✗";
      console.log(`${prefix} ${message}`);
    });
  }

  /**
   * Show a workflow step
   */
  static showStep(step: string): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      console.log(`\n▸ ${step}`);
    });
  }

  /**
   * Show workspace analysis
   */
  static showWorkspaceAnalysis(
    workspace: WorkspaceAnalysis
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      console.log(`  Root: ${workspace.rootPath}`);
      console.log(`  Project Type: ${workspace.projectType}`);
      console.log(`  Current Revision: ${workspace.currentRevision}`);
      console.log(`  Changed Files: ${workspace.changedFiles.length}`);
      if (workspace.changedFiles.length > 0) {
        workspace.changedFiles.forEach((f) => {
          console.log(`    - ${f.type}: ${f.path}`);
        });
      }
    });
  }

  /**
   * Show context
   */
  static showContext(context: Context): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      console.log(`  Files in context: ${context.relevantFiles.length}`);
      console.log(`  Total tokens: ${context.totalTokens}`);
      if (context.intent) {
        console.log(`  Intent: ${context.intent}`);
      }
    });
  }

  /**
   * Show execution plan
   */
  static showPlan(plan: ExecutionPlan): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      console.log(`  Intent: ${plan.intent}`);
      console.log(`  Steps: ${plan.steps.length}`);
      console.log(`  Estimated Duration: ${plan.estimatedDuration}ms`);
      if (plan.risks.length > 0) {
        console.log(`  Risks:`);
        plan.risks.forEach((risk) => {
          console.log(`    - ${risk}`);
        });
      }
      console.log(`\n  Execution Steps:`);
      plan.steps.forEach((step, i) => {
        console.log(`    ${i + 1}. [${step.type}] ${step.description}`);
      });
    });
  }

  /**
   * Show execution result
   */
  static showExecutionResult(
    result: ExecutionResult
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      console.log(`  Status: ${result.success ? "✓ Success" : "✗ Failed"}`);
      console.log(`  Duration: ${result.duration}ms`);
      console.log(
        `  Completed: ${result.completedSteps.length}/${result.plan.steps.length} steps`
      );

      const failed = result.completedSteps.filter((s) => !s.success);
      if (failed.length > 0) {
        console.log(`\n  Failed Steps:`);
        failed.forEach((step) => {
          console.log(`    - ${step.step.description}`);
          if (step.error) {
            console.log(`      Error: ${step.error}`);
          }
        });
      }
    });
  }

  /**
   * Show review result
   */
  static showReview(review: ReviewResult): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      console.log(
        `  Validation: ${review.validation.passed ? "✓ Passed" : "✗ Failed"}`
      );
      console.log(`  Approved: ${review.approved ? "✓ Yes" : "✗ No"}`);

      if (review.validation.checks.length > 0) {
        console.log(`\n  Validation Checks:`);
        review.validation.checks.forEach((check) => {
          const icon = check.passed ? "✓" : "✗";
          console.log(`    ${icon} ${check.name}: ${check.message}`);
        });
      }

      if (review.suggestions.length > 0) {
        console.log(`\n  Suggestions:`);
        review.suggestions.forEach((suggestion) => {
          console.log(`    - ${suggestion}`);
        });
      }
    });
  }

  /**
   * Show an error
   */
  static showError(error: AppError): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      console.error(`\n✗ Error: ${error.message}`);
      if (error.cause) {
        console.error(`  Cause: ${error.cause}`);
      }
    });
  }
}
