/**
 * Core types for JJ operations using Effect
 */

/**
 * Represents a JJ revision
 */
export interface JJRevision {
  readonly changeId: string;
  readonly commitId: string;
  readonly description: string;
  readonly author: string;
  readonly timestamp: Date;
}

/**
 * Represents a JJ branch
 */
export interface JJBranch {
  readonly name: string;
  readonly target: string;
}

/**
 * Represents the status of the working copy
 */
export interface JJStatus {
  readonly workingCopyRevision: string;
  readonly hasChanges: boolean;
  readonly modifiedFiles: readonly string[];
  readonly addedFiles: readonly string[];
  readonly removedFiles: readonly string[];
}

/**
 * Represents a JJ diff
 */
export interface JJDiff {
  readonly from: string;
  readonly to: string;
  readonly content: string;
}

/**
 * Represents a JJ log entry
 */
export interface JJLogEntry {
  readonly revision: JJRevision;
  readonly parents: readonly string[];
  readonly children: readonly string[];
}

/**
 * Error types for JJ operations
 */
export class JJCommandError {
  readonly _tag = "JJCommandError";
  constructor(
    readonly command: string,
    readonly exitCode: number,
    readonly stderr: string,
    readonly stdout: string
  ) {}
}

export class JJNotFoundError {
  readonly _tag = "JJNotFoundError";
  constructor(readonly message: string) {}
}

export class JJParseError {
  readonly _tag = "JJParseError";
  constructor(
    readonly raw: string,
    readonly reason: string
  ) {}
}

export type JJError = JJCommandError | JJNotFoundError | JJParseError;
