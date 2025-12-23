/**
 * Review step
 */

import { Effect, pipe } from "effect";
import { ReviewError } from "../types/errors.ts";
import {
  ExecutionResult,
  ReviewResult,
  ValidationResult,
  ValidationCheck,
} from "../types/workflow.ts";

/**
 * Reviewer
 */
export class Reviewer {
  private constructor() {}

  /**
   * Create a new reviewer
   */
  static create(): Effect.Effect<Reviewer, ReviewError, never> {
    return Effect.succeed(new Reviewer());
  }

  /**
   * Review an execution result
   */
  review(
    result: ExecutionResult
  ): Effect.Effect<ReviewResult, ReviewError, never> {
    return pipe(
      this.validateExecution(result),
      Effect.flatMap((validation) =>
        pipe(
          this.generateSuggestions(result, validation),
          Effect.map((suggestions) => ({
            execution: result,
            validation,
            suggestions,
            approved: validation.passed && result.success,
          }))
        )
      ),
      Effect.catchAll((error) =>
        Effect.fail(
          new ReviewError({
            message: "Failed to review execution",
            cause: error,
          })
        )
      )
    );
  }

  private validateExecution(
    result: ExecutionResult
  ): Effect.Effect<ValidationResult, ReviewError, never> {
    return pipe(
      Effect.all([
        this.checkAllStepsCompleted(result),
        this.checkNoErrors(result),
        this.checkReasonableDuration(result),
      ]),
      Effect.map((checks) => ({
        passed: checks.every((c) => c.passed),
        checks,
      }))
    );
  }

  private checkAllStepsCompleted(
    result: ExecutionResult
  ): Effect.Effect<ValidationCheck, ReviewError, never> {
    const allCompleted =
      result.completedSteps.length === result.plan.steps.length;

    return Effect.succeed({
      name: "All steps completed",
      passed: allCompleted,
      message: allCompleted
        ? "All steps were executed"
        : `Only ${result.completedSteps.length}/${result.plan.steps.length} steps completed`,
    });
  }

  private checkNoErrors(
    result: ExecutionResult
  ): Effect.Effect<ValidationCheck, ReviewError, never> {
    const failedSteps = result.completedSteps.filter((s) => !s.success);

    return Effect.succeed({
      name: "No errors",
      passed: failedSteps.length === 0,
      message:
        failedSteps.length === 0
          ? "No errors occurred"
          : `${failedSteps.length} step(s) failed`,
    });
  }

  private checkReasonableDuration(
    result: ExecutionResult
  ): Effect.Effect<ValidationCheck, ReviewError, never> {
    const reasonable = result.duration <= result.plan.estimatedDuration * 2;

    return Effect.succeed({
      name: "Reasonable duration",
      passed: reasonable,
      message: reasonable
        ? `Completed in ${result.duration}ms (estimated ${result.plan.estimatedDuration}ms)`
        : `Took ${result.duration}ms, exceeded 2x estimate (${result.plan.estimatedDuration}ms)`,
    });
  }

  private generateSuggestions(
    result: ExecutionResult,
    validation: ValidationResult
  ): Effect.Effect<ReadonlyArray<string>, ReviewError, never> {
    const suggestions: string[] = [];

    // Suggest improvements based on validation
    if (!validation.passed) {
      const failedChecks = validation.checks.filter((c) => !c.passed);
      suggestions.push(
        ...failedChecks.map((c) => `Address: ${c.message}`)
      );
    }

    // Suggest improvements based on execution
    const failedSteps = result.completedSteps.filter((s) => !s.success);
    if (failedSteps.length > 0) {
      suggestions.push(
        `Retry failed steps: ${failedSteps.map((s) => s.step.id).join(", ")}`
      );
    }

    // Performance suggestions
    if (result.duration > result.plan.estimatedDuration * 1.5) {
      suggestions.push(
        "Consider optimizing slow steps or parallelizing independent operations"
      );
    }

    return Effect.succeed(suggestions);
  }
}
