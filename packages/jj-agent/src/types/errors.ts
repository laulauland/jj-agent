/**
 * Error types for the jj-agent application
 */

import { Data } from "effect";

/**
 * Base error class for all application errors
 */
export class AppError extends Data.TaggedError("AppError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Error during workspace analysis
 */
export class WorkspaceError extends Data.TaggedError("WorkspaceError")<{
  readonly message: string;
  readonly path?: string;
  readonly cause?: unknown;
}> {}

/**
 * Error during context building
 */
export class ContextError extends Data.TaggedError("ContextError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Error during AI planning
 */
export class AIError extends Data.TaggedError("AIError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Error during execution
 */
export class ExecutionError extends Data.TaggedError("ExecutionError")<{
  readonly message: string;
  readonly command?: string;
  readonly cause?: unknown;
}> {}

/**
 * Error during review
 */
export class ReviewError extends Data.TaggedError("ReviewError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Error during JJ operations
 */
export class JJError extends Data.TaggedError("JJError")<{
  readonly message: string;
  readonly command?: string;
  readonly exitCode?: number;
  readonly stderr?: string;
}> {}

/**
 * Error during file operations
 */
export class FileError extends Data.TaggedError("FileError")<{
  readonly message: string;
  readonly path: string;
  readonly cause?: unknown;
}> {}

/**
 * Configuration error
 */
export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly key?: string;
  readonly cause?: unknown;
}> {}
