/**
 * AI Service - OpenAI integration
 */

import { Effect, pipe } from "effect";
import OpenAI from "openai";
import { OpenAIConfig } from "../types/config.ts";
import { AIError } from "../types/errors.ts";
import { ExecutionPlan } from "../types/workflow.ts";

/**
 * AI service for OpenAI integration
 */
export class AIService {
  private constructor(
    private readonly config: OpenAIConfig,
    private readonly client: OpenAI
  ) {}

  /**
   * Create a new AI service
   */
  static create(
    config: OpenAIConfig
  ): Effect.Effect<AIService, AIError, never> {
    return pipe(
      Effect.try({
        try: () =>
          new OpenAI({
            apiKey: config.apiKey,
          }),
        catch: (error) =>
          new AIError({
            message: "Failed to create OpenAI client",
            cause: error,
          }),
      }),
      Effect.map((client) => new AIService(config, client))
    );
  }

  /**
   * Generate an execution plan from a prompt
   */
  generatePlan(
    prompt: string
  ): Effect.Effect<ExecutionPlan, AIError, never> {
    return pipe(
      this.callOpenAI(prompt),
      Effect.flatMap((response) => this.parsePlanFromResponse(response)),
      Effect.catchAll((error) =>
        Effect.fail(
          new AIError({
            message: "Failed to generate plan",
            cause: error,
          })
        )
      )
    );
  }

  private callOpenAI(
    prompt: string
  ): Effect.Effect<string, AIError, never> {
    return Effect.tryPromise({
      try: async () => {
        const completion = await this.client.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: "system",
              content:
                "You are a JJ-first coding agent. You help developers work with Jujutsu version control and create precise execution plans.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          response_format: { type: "json_object" },
        });

        return completion.choices[0]?.message?.content || "";
      },
      catch: (error) =>
        new AIError({
          message: "OpenAI API call failed",
          cause: error,
        }),
    });
  }

  private parsePlanFromResponse(
    response: string
  ): Effect.Effect<ExecutionPlan, AIError, never> {
    return Effect.try({
      try: () => {
        const parsed = JSON.parse(response);
        return {
          intent: parsed.intent || "Unknown intent",
          steps: parsed.steps || [],
          estimatedDuration: parsed.estimatedDuration || 0,
          risks: parsed.risks || [],
        };
      },
      catch: (error) =>
        new AIError({
          message: "Failed to parse AI response",
          cause: error,
        }),
    });
  }
}
