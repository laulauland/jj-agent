/**
 * Execution step
 */

import { Effect, pipe } from "effect";
import { WorkspaceConfig } from "../types/config.ts";
import { ExecutionError } from "../types/errors.ts";
import {
  ExecutionPlan,
  ExecutionResult,
  ExecutionStep,
  StepResult,
} from "../types/workflow.ts";
import { JJService } from "../services/jj.ts";
import { WorkspaceService } from "../services/workspace.ts";

/**
 * Executor
 */
export class Executor {
  private constructor(
    private readonly config: WorkspaceConfig,
    private readonly jjService: JJService,
    private readonly workspaceService: WorkspaceService
  ) {}

  /**
   * Create a new executor
   */
  static create(
    config: WorkspaceConfig
  ): Effect.Effect<Executor, ExecutionError, never> {
    return pipe(
      Effect.all([
        JJService.create(config.rootPath),
        WorkspaceService.create(config.rootPath),
      ]),
      Effect.map(
        ([jjService, workspaceService]) =>
          new Executor(config, jjService, workspaceService)
      ),
      Effect.catchAll((error) =>
        Effect.fail(
          new ExecutionError({
            message: "Failed to create executor",
            cause: error,
          })
        )
      )
    );
  }

  /**
   * Execute a plan
   */
  execute(
    plan: ExecutionPlan
  ): Effect.Effect<ExecutionResult, ExecutionError, never> {
    const startTime = Date.now();

    return pipe(
      this.executeSteps(plan.steps),
      Effect.map((completedSteps) => ({
        plan,
        completedSteps,
        success: completedSteps.every((s) => s.success),
        duration: Date.now() - startTime,
      })),
      Effect.catchAll((error) =>
        Effect.fail(
          new ExecutionError({
            message: "Failed to execute plan",
            cause: error,
          })
        )
      )
    );
  }

  private executeSteps(
    steps: ReadonlyArray<ExecutionStep>
  ): Effect.Effect<ReadonlyArray<StepResult>, ExecutionError, never> {
    return pipe(
      Effect.succeed([] as StepResult[]),
      Effect.flatMap((results) =>
        Effect.reduce(
          steps,
          results,
          (acc, step) =>
            pipe(
              this.executeStep(step),
              Effect.map((result) => [...acc, result])
            )
        )
      )
    );
  }

  private executeStep(
    step: ExecutionStep
  ): Effect.Effect<StepResult, ExecutionError, never> {
    const startTime = Date.now();

    return pipe(
      this.executeStepByType(step),
      Effect.map((output) => ({
        step,
        success: true,
        output,
        duration: Date.now() - startTime,
      })),
      Effect.catchAll((error) =>
        Effect.succeed({
          step,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        })
      )
    );
  }

  private executeStepByType(
    step: ExecutionStep
  ): Effect.Effect<string, ExecutionError, never> {
    switch (step.type) {
      case "jj_command":
        return this.executeJJCommand(step);
      case "file_write":
        return this.executeFileWrite(step);
      case "file_delete":
        return this.executeFileDelete(step);
      case "analysis":
        return Effect.succeed("Analysis completed");
      case "validation":
        return Effect.succeed("Validation completed");
      default:
        return Effect.fail(
          new ExecutionError({
            message: `Unknown step type: ${step.type}`,
          })
        );
    }
  }

  private executeJJCommand(
    step: ExecutionStep
  ): Effect.Effect<string, ExecutionError, never> {
    if (!step.command) {
      return Effect.fail(
        new ExecutionError({
          message: "JJ command step missing command",
        })
      );
    }

    return this.jjService.executeCommand(step.command);
  }

  private executeFileWrite(
    step: ExecutionStep
  ): Effect.Effect<string, ExecutionError, never> {
    if (!step.files || step.files.length === 0) {
      return Effect.fail(
        new ExecutionError({
          message: "File write step missing files",
        })
      );
    }

    return pipe(
      Effect.all(
        step.files.map((file) =>
          file.content
            ? this.workspaceService.writeFile(file.path, file.content)
            : Effect.fail(
                new ExecutionError({
                  message: `File write missing content: ${file.path}`,
                })
              )
        )
      ),
      Effect.map((results) => `Wrote ${results.length} file(s)`)
    );
  }

  private executeFileDelete(
    step: ExecutionStep
  ): Effect.Effect<string, ExecutionError, never> {
    if (!step.files || step.files.length === 0) {
      return Effect.fail(
        new ExecutionError({
          message: "File delete step missing files",
        })
      );
    }

    return pipe(
      Effect.all(
        step.files.map((file) => this.workspaceService.deleteFile(file.path))
      ),
      Effect.map((results) => `Deleted ${results.length} file(s)`)
    );
  }
}
