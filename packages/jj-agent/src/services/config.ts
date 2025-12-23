/**
 * Config Service - Load and manage configuration
 */

import { Effect, pipe } from "effect";
import { ConfigError } from "../types/errors.ts";
import { Config } from "../types/config.ts";

/**
 * Configuration service
 */
export class ConfigService {
  /**
   * Load configuration from environment and defaults
   */
  static load(): Effect.Effect<Config, ConfigError, never> {
    return pipe(
      Effect.all([
        this.loadOpenAIConfig(),
        this.loadWorkspaceConfig(),
        this.loadUIConfig(),
        this.loadWatcherConfig(),
      ]),
      Effect.map(([openai, workspace, ui, watcher]) => ({
        openai,
        workspace,
        ui,
        watcher,
      })),
      Effect.catchAll((error) =>
        Effect.fail(
          new ConfigError({
            message: "Failed to load configuration",
            cause: error,
          })
        )
      )
    );
  }

  private static loadOpenAIConfig(): Effect.Effect<
    Config["openai"],
    ConfigError,
    never
  > {
    return Effect.try({
      try: () => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error("OPENAI_API_KEY environment variable is required");
        }

        return {
          apiKey,
          model: process.env.OPENAI_MODEL || "gpt-4o",
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "4000", 10),
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
        };
      },
      catch: (error) =>
        new ConfigError({
          message: "Failed to load OpenAI configuration",
          key: "openai",
          cause: error,
        }),
    });
  }

  private static loadWorkspaceConfig(): Effect.Effect<
    Config["workspace"],
    ConfigError,
    never
  > {
    return Effect.succeed({
      rootPath: process.cwd(),
      includePatterns: ["**/*.ts", "**/*.js", "**/*.json"],
      excludePatterns: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.jj/**",
      ],
      maxContextFiles: 50,
      maxContextTokens: 32000,
    });
  }

  private static loadUIConfig(): Effect.Effect<
    Config["ui"],
    ConfigError,
    never
  > {
    return Effect.succeed({
      theme: "dark" as const,
      verbose: process.env.VERBOSE === "true",
      showProgress: true,
    });
  }

  private static loadWatcherConfig(): Effect.Effect<
    Config["watcher"],
    ConfigError,
    never
  > {
    return Effect.succeed({
      enabled: process.env.WATCH !== "false",
      debounceMs: 1000,
      ignorePatterns: [
        "**/node_modules/**",
        "**/.jj/**",
        "**/.git/**",
        "**/dist/**",
      ],
    });
  }
}
