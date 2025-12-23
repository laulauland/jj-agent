/**
 * Workspace Service - File system and workspace operations
 */

import { Effect, pipe } from "effect";
import { readdir, readFile, writeFile, unlink, stat } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import { FileError, WorkspaceError } from "../types/errors.ts";
import { Dependency, ProjectType } from "../types/workflow.ts";

/**
 * Workspace service for file system operations
 */
export class WorkspaceService {
  private constructor(private readonly rootPath: string) {}

  /**
   * Create a new workspace service
   */
  static create(
    rootPath: string
  ): Effect.Effect<WorkspaceService, WorkspaceError, never> {
    return Effect.succeed(new WorkspaceService(rootPath));
  }

  /**
   * Read a file
   */
  readFile(path: string): Effect.Effect<string, FileError, never> {
    const fullPath = join(this.rootPath, path);

    return Effect.tryPromise({
      try: () => readFile(fullPath, "utf-8"),
      catch: (error) =>
        new FileError({
          message: "Failed to read file",
          path,
          cause: error,
        }),
    });
  }

  /**
   * Write a file
   */
  writeFile(
    path: string,
    content: string
  ): Effect.Effect<void, FileError, never> {
    const fullPath = join(this.rootPath, path);

    return pipe(
      Effect.tryPromise({
        try: async () => {
          // Ensure directory exists
          const dir = dirname(fullPath);
          await Bun.write(Bun.file(dir), ""); // Create directory if needed
          await writeFile(fullPath, content, "utf-8");
        },
        catch: (error) =>
          new FileError({
            message: "Failed to write file",
            path,
            cause: error,
          }),
      })
    );
  }

  /**
   * Delete a file
   */
  deleteFile(path: string): Effect.Effect<void, FileError, never> {
    const fullPath = join(this.rootPath, path);

    return Effect.tryPromise({
      try: () => unlink(fullPath),
      catch: (error) =>
        new FileError({
          message: "Failed to delete file",
          path,
          cause: error,
        }),
    });
  }

  /**
   * Find related files based on changed paths
   */
  findRelatedFiles(
    changedPaths: ReadonlyArray<string>
  ): Effect.Effect<ReadonlyArray<string>, WorkspaceError, never> {
    return pipe(
      Effect.all(
        changedPaths.map((path) => this.findImports(path))
      ),
      Effect.map((imports) => Array.from(new Set(imports.flat())))
    );
  }

  /**
   * Find files that import the given file
   */
  private findImports(
    path: string
  ): Effect.Effect<ReadonlyArray<string>, WorkspaceError, never> {
    // Simplified: return empty array
    // TODO: Implement proper import analysis
    return Effect.succeed([]);
  }

  /**
   * Get dependencies from package.json
   */
  getDependencies(): Effect.Effect<
    ReadonlyArray<Dependency>,
    WorkspaceError,
    never
  > {
    return pipe(
      this.readFile("package.json"),
      Effect.flatMap((content) => this.parseDependencies(content)),
      Effect.catchAll(() => Effect.succeed([]))
    );
  }

  private parseDependencies(
    content: string
  ): Effect.Effect<ReadonlyArray<Dependency>, WorkspaceError, never> {
    return Effect.try({
      try: () => {
        const pkg = JSON.parse(content);
        const deps: Dependency[] = [];

        if (pkg.dependencies) {
          for (const [name, version] of Object.entries(pkg.dependencies)) {
            deps.push({ name, version: version as string, type: "runtime" });
          }
        }

        if (pkg.devDependencies) {
          for (const [name, version] of Object.entries(pkg.devDependencies)) {
            deps.push({ name, version: version as string, type: "dev" });
          }
        }

        return deps;
      },
      catch: (error) =>
        new WorkspaceError({
          message: "Failed to parse dependencies",
          cause: error,
        }),
    });
  }

  /**
   * Detect project type
   */
  detectProjectType(): Effect.Effect<ProjectType, WorkspaceError, never> {
    return pipe(
      Effect.all([
        this.fileExists("package.json"),
        this.fileExists("tsconfig.json"),
        this.fileExists("Cargo.toml"),
        this.fileExists("requirements.txt"),
        this.fileExists("pyproject.toml"),
      ]),
      Effect.map(
        ([hasPackageJson, hasTsConfig, hasCargo, hasRequirements, hasPyProject]) => {
          if (hasTsConfig) return "typescript";
          if (hasPackageJson) return "javascript";
          if (hasCargo) return "rust";
          if (hasRequirements || hasPyProject) return "python";
          return "unknown";
        }
      )
    );
  }

  private fileExists(path: string): Effect.Effect<boolean, never, never> {
    const fullPath = join(this.rootPath, path);

    return pipe(
      Effect.tryPromise({
        try: () => stat(fullPath),
        catch: () => null,
      }),
      Effect.map((stats) => stats !== null)
    );
  }
}
