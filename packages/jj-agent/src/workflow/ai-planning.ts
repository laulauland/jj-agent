/**
 * AI planning step
 */

import { Effect, pipe } from "effect";
import { OpenAIConfig } from "../types/config.ts";
import { AIError } from "../types/errors.ts";
import { Context, ExecutionPlan, ExecutionStep } from "../types/workflow.ts";
import { AIService } from "../services/ai.ts";

/**
 * AI planner
 */
export class AIPlanner {
  private constructor(
    private readonly config: OpenAIConfig,
    private readonly aiService: AIService
  ) {}

  /**
   * Create a new AI planner
   */
  static create(
    config: OpenAIConfig
  ): Effect.Effect<AIPlanner, AIError, never> {
    return pipe(
      AIService.create(config),
      Effect.map((aiService) => new AIPlanner(config, aiService)),
      Effect.catchAll((error) =>
        Effect.fail(
          new AIError({
            message: "Failed to create AI planner",
            cause: error,
          })
        )
      )
    );
  }

  /**
   * Create an execution plan from context
   */
  createPlan(
    context: Context
  ): Effect.Effect<ExecutionPlan, AIError, never> {
    return pipe(
      this.buildPrompt(context),
      Effect.flatMap((prompt) => this.aiService.generatePlan(prompt)),
      Effect.map((plan) => this.validatePlan(plan)),
      Effect.catchAll((error) =>
        Effect.fail(
          new AIError({
            message: "Failed to create execution plan",
            cause: error,
          })
        )
      )
    );
  }

  private buildPrompt(
    context: Context
  ): Effect.Effect<string, AIError, never> {
    return Effect.succeed(`
You are a JJ-first coding agent. Analyze the following workspace context and create a detailed execution plan.

## Workspace Analysis
- Root: ${context.workspace.rootPath}
- Current Revision: ${context.workspace.currentRevision}
- Project Type: ${context.workspace.projectType}
- Changed Files: ${context.workspace.changedFiles.length}

## Context Files
${context.relevantFiles
  .map(
    (f) => `
### ${f.path}
\`\`\`
${f.content.slice(0, 1000)}${f.content.length > 1000 ? "..." : ""}
\`\`\`
`
  )
  .join("\n")}

## Instructions
Create a step-by-step execution plan that:
1. Uses JJ commands for version control operations
2. Modifies or creates files as needed
3. Validates the results
4. Provides clear descriptions for each step

Return the plan as a JSON object with the following structure:
{
  "intent": "string",
  "steps": [
    {
      "id": "string",
      "type": "jj_command" | "file_write" | "file_delete" | "analysis" | "validation",
      "description": "string",
      "command": "string (optional)",
      "files": [{"path": "string", "operation": "create|update|delete", "content": "string"}],
      "dependencies": ["string"]
    }
  ],
  "estimatedDuration": number,
  "risks": ["string"]
}
    `);
  }

  private validatePlan(plan: ExecutionPlan): ExecutionPlan {
    // Ensure all steps have unique IDs
    const ids = new Set<string>();
    for (const step of plan.steps) {
      if (ids.has(step.id)) {
        throw new Error(`Duplicate step ID: ${step.id}`);
      }
      ids.add(step.id);
    }

    // Validate dependencies exist
    for (const step of plan.steps) {
      for (const dep of step.dependencies) {
        if (!ids.has(dep)) {
          throw new Error(
            `Step ${step.id} depends on non-existent step ${dep}`
          );
        }
      }
    }

    return plan;
  }
}
