/**
 * Configuration types
 */

/**
 * Application configuration
 */
export interface Config {
  readonly openai: OpenAIConfig;
  readonly workspace: WorkspaceConfig;
  readonly ui: UIConfig;
  readonly watcher: WatcherConfig;
}

/**
 * OpenAI configuration
 */
export interface OpenAIConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly maxTokens: number;
  readonly temperature: number;
}

/**
 * Workspace configuration
 */
export interface WorkspaceConfig {
  readonly rootPath: string;
  readonly includePatterns: ReadonlyArray<string>;
  readonly excludePatterns: ReadonlyArray<string>;
  readonly maxContextFiles: number;
  readonly maxContextTokens: number;
}

/**
 * UI configuration
 */
export interface UIConfig {
  readonly theme: "light" | "dark";
  readonly verbose: boolean;
  readonly showProgress: boolean;
}

/**
 * File watcher configuration
 */
export interface WatcherConfig {
  readonly enabled: boolean;
  readonly debounceMs: number;
  readonly ignorePatterns: ReadonlyArray<string>;
}
