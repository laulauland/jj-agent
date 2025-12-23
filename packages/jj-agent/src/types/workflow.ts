/**
 * Type definitions for workflow components
 */

import { Effect } from "effect";
import {
  WorkspaceError,
  ContextError,
  AIError,
  ExecutionError,
  ReviewError,
} from "./errors.ts";

/**
 * Workspace analysis result
 */
export interface WorkspaceAnalysis {
  readonly rootPath: string;
  readonly jjInitialized: boolean;
  readonly currentRevision: string;
  readonly changedFiles: ReadonlyArray<FileChange>;
  readonly dependencies: ReadonlyArray<Dependency>;
  readonly projectType: ProjectType;
}

/**
 * File change information
 */
export interface FileChange {
  readonly path: string;
  readonly type: "added" | "modified" | "deleted";
  readonly content?: string;
}

/**
 * Dependency information
 */
export interface Dependency {
  readonly name: string;
  readonly version: string;
  readonly type: "runtime" | "dev";
}

/**
 * Project type detection
 */
export type ProjectType =
  | "typescript"
  | "javascript"
  | "rust"
  | "python"
  | "unknown";

/**
 * Context for AI planning
 */
export interface Context {
  readonly workspace: WorkspaceAnalysis;
  readonly relevantFiles: ReadonlyArray<ContextFile>;
  readonly totalTokens: number;
  readonly intent?: string;
}

/**
 * File included in context
 */
export interface ContextFile {
  readonly path: string;
  readonly content: string;
  readonly tokens: number;
  readonly relevance: number;
}

/**
 * AI execution plan
 */
export interface ExecutionPlan {
  readonly intent: string;
  readonly steps: ReadonlyArray<ExecutionStep>;
  readonly estimatedDuration: number;
  readonly risks: ReadonlyArray<string>;
}

/**
 * Single execution step
 */
export interface ExecutionStep {
  readonly id: string;
  readonly type: StepType;
  readonly description: string;
  readonly command?: string;
  readonly files?: ReadonlyArray<FileOperation>;
  readonly dependencies: ReadonlyArray<string>;
}

/**
 * Step type
 */
export type StepType =
  | "jj_command"
  | "file_write"
  | "file_delete"
  | "analysis"
  | "validation";

/**
 * File operation
 */
export interface FileOperation {
  readonly path: string;
  readonly operation: "create" | "update" | "delete";
  readonly content?: string;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  readonly plan: ExecutionPlan;
  readonly completedSteps: ReadonlyArray<StepResult>;
  readonly success: boolean;
  readonly duration: number;
}

/**
 * Result of a single step
 */
export interface StepResult {
  readonly step: ExecutionStep;
  readonly success: boolean;
  readonly output?: string;
  readonly error?: string;
  readonly duration: number;
}

/**
 * Review result
 */
export interface ReviewResult {
  readonly execution: ExecutionResult;
  readonly validation: ValidationResult;
  readonly suggestions: ReadonlyArray<string>;
  readonly approved: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  readonly passed: boolean;
  readonly checks: ReadonlyArray<ValidationCheck>;
}

/**
 * Single validation check
 */
export interface ValidationCheck {
  readonly name: string;
  readonly passed: boolean;
  readonly message: string;
}

/**
 * Workflow step function signature
 */
export type WorkflowStep<T, E> = Effect.Effect<T, E, never>;

/**
 * Workspace analysis step
 */
export type AnalyzeWorkspace = () => WorkflowStep<
  WorkspaceAnalysis,
  WorkspaceError
>;

/**
 * Context building step
 */
export type BuildContext = (
  workspace: WorkspaceAnalysis
) => WorkflowStep<Context, ContextError>;

/**
 * AI planning step
 */
export type CreatePlan = (context: Context) => WorkflowStep<ExecutionPlan, AIError>;

/**
 * Execution step
 */
export type ExecutePlan = (
  plan: ExecutionPlan
) => WorkflowStep<ExecutionResult, ExecutionError>;

/**
 * Review step
 */
export type ReviewExecution = (
  result: ExecutionResult
) => WorkflowStep<ReviewResult, ReviewError>;
