/**
 * Workspace analysis step
 */

import { Effect, pipe } from "effect";
import { WorkspaceConfig } from "../types/config.ts";
import { WorkspaceError } from "../types/errors.ts";
import { WorkspaceAnalysis, FileChange, ProjectType } from "../types/workflow.ts";
import { JJService } from "../services/jj.ts";
import { WorkspaceService } from "../services/workspace.ts";

/**
 * Workspace analyzer
 */
export class WorkspaceAnalyzer {
  private constructor(
    private readonly config: WorkspaceConfig,
    private readonly jjService: JJService,
    private readonly workspaceService: WorkspaceService
  ) {}

  /**
   * Create a new workspace analyzer
   */
  static create(
    config: WorkspaceConfig
  ): Effect.Effect<WorkspaceAnalyzer, WorkspaceError, never> {
    return pipe(
      Effect.all([
        JJService.create(config.rootPath),
        WorkspaceService.create(config.rootPath),
      ]),
      Effect.map(
        ([jjService, workspaceService]) =>
          new WorkspaceAnalyzer(config, jjService, workspaceService)
      ),
      Effect.catchAll((error) =>
        Effect.fail(
          new WorkspaceError({
            message: "Failed to create workspace analyzer",
            path: config.rootPath,
            cause: error,
          })
        )
      )
    );
  }

  /**
   * Analyze the workspace
   */
  analyze(): Effect.Effect<WorkspaceAnalysis, WorkspaceError, never> {
    return pipe(
      Effect.all([
        this.checkJJInitialized(),
        this.getCurrentRevision(),
        this.getChangedFiles(),
        this.getDependencies(),
        this.detectProjectType(),
      ]),
      Effect.map(
        ([jjInitialized, currentRevision, changedFiles, dependencies, projectType]) => ({
          rootPath: this.config.rootPath,
          jjInitialized,
          currentRevision,
          changedFiles,
          dependencies,
          projectType,
        })
      ),
      Effect.catchAll((error) =>
        Effect.fail(
          new WorkspaceError({
            message: "Failed to analyze workspace",
            path: this.config.rootPath,
            cause: error,
          })
        )
      )
    );
  }

  private checkJJInitialized(): Effect.Effect<boolean, WorkspaceError, never> {
    return this.jjService.isInitialized();
  }

  private getCurrentRevision(): Effect.Effect<string, WorkspaceError, never> {
    return pipe(
      this.jjService.getCurrentRevision(),
      Effect.map((rev) => rev || "unknown")
    );
  }

  private getChangedFiles(): Effect.Effect<
    ReadonlyArray<FileChange>,
    WorkspaceError,
    never
  > {
    return this.jjService.getChangedFiles();
  }

  private getDependencies(): Effect.Effect<
    ReadonlyArray<import("../types/workflow.ts").Dependency>,
    WorkspaceError,
    never
  > {
    return this.workspaceService.getDependencies();
  }

  private detectProjectType(): Effect.Effect<ProjectType, WorkspaceError, never> {
    return this.workspaceService.detectProjectType();
  }
}
