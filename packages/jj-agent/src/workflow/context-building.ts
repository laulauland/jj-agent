/**
 * Context building step
 */

import { Effect, pipe } from "effect";
import { WorkspaceConfig } from "../types/config.ts";
import { ContextError } from "../types/errors.ts";
import { Context, WorkspaceAnalysis, ContextFile } from "../types/workflow.ts";
import { WorkspaceService } from "../services/workspace.ts";

/**
 * Context builder
 */
export class ContextBuilder {
  private constructor(
    private readonly config: WorkspaceConfig,
    private readonly workspaceService: WorkspaceService
  ) {}

  /**
   * Create a new context builder
   */
  static create(
    config: WorkspaceConfig
  ): Effect.Effect<ContextBuilder, ContextError, never> {
    return pipe(
      WorkspaceService.create(config.rootPath),
      Effect.map(
        (workspaceService) => new ContextBuilder(config, workspaceService)
      ),
      Effect.catchAll((error) =>
        Effect.fail(
          new ContextError({
            message: "Failed to create context builder",
            cause: error,
          })
        )
      )
    );
  }

  /**
   * Build context from workspace analysis
   */
  build(
    workspace: WorkspaceAnalysis
  ): Effect.Effect<Context, ContextError, never> {
    return pipe(
      this.selectRelevantFiles(workspace),
      Effect.flatMap((files) => this.loadFileContents(files)),
      Effect.flatMap((files) => this.rankByRelevance(files, workspace)),
      Effect.flatMap((files) => this.limitContext(files)),
      Effect.map((relevantFiles) => ({
        workspace,
        relevantFiles,
        totalTokens: relevantFiles.reduce((sum, f) => sum + f.tokens, 0),
      })),
      Effect.catchAll((error) =>
        Effect.fail(
          new ContextError({
            message: "Failed to build context",
            cause: error,
          })
        )
      )
    );
  }

  private selectRelevantFiles(
    workspace: WorkspaceAnalysis
  ): Effect.Effect<ReadonlyArray<string>, ContextError, never> {
    return pipe(
      Effect.succeed(workspace.changedFiles.map((f) => f.path)),
      Effect.flatMap((changedPaths) =>
        this.workspaceService.findRelatedFiles(changedPaths)
      ),
      Effect.map((related) => [
        ...workspace.changedFiles.map((f) => f.path),
        ...related,
      ]),
      Effect.map((files) => Array.from(new Set(files)))
    );
  }

  private loadFileContents(
    paths: ReadonlyArray<string>
  ): Effect.Effect<ReadonlyArray<ContextFile>, ContextError, never> {
    return pipe(
      Effect.all(
        paths.map((path) =>
          pipe(
            this.workspaceService.readFile(path),
            Effect.map((content) => ({
              path,
              content,
              tokens: this.estimateTokens(content),
              relevance: 0, // Will be calculated later
            }))
          )
        )
      )
    );
  }

  private rankByRelevance(
    files: ReadonlyArray<ContextFile>,
    workspace: WorkspaceAnalysis
  ): Effect.Effect<ReadonlyArray<ContextFile>, ContextError, never> {
    return Effect.succeed(
      files.map((file) => ({
        ...file,
        relevance: this.calculateRelevance(file, workspace),
      }))
    );
  }

  private limitContext(
    files: ReadonlyArray<ContextFile>
  ): Effect.Effect<ReadonlyArray<ContextFile>, ContextError, never> {
    return pipe(
      Effect.succeed(files),
      Effect.map((fs) =>
        fs.sort((a, b) => b.relevance - a.relevance)
      ),
      Effect.map((fs) => {
        const result: ContextFile[] = [];
        let totalTokens = 0;

        for (const file of fs) {
          if (
            result.length >= this.config.maxContextFiles ||
            totalTokens + file.tokens > this.config.maxContextTokens
          ) {
            break;
          }
          result.push(file);
          totalTokens += file.tokens;
        }

        return result;
      })
    );
  }

  private estimateTokens(content: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(content.length / 4);
  }

  private calculateRelevance(
    file: ContextFile,
    workspace: WorkspaceAnalysis
  ): number {
    let relevance = 0;

    // Higher relevance for changed files
    if (workspace.changedFiles.some((f) => f.path === file.path)) {
      relevance += 100;
    }

    // Higher relevance for smaller files
    if (file.tokens < 1000) {
      relevance += 50;
    } else if (file.tokens < 5000) {
      relevance += 25;
    }

    return relevance;
  }
}
