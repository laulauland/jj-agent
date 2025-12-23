# JJ Agent Architecture

This document provides a comprehensive overview of the jj-agent architecture.

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [5-Step Workflow](#5-step-workflow)
4. [Core Services](#core-services)
5. [Type System](#type-system)
6. [Effect Patterns](#effect-patterns)
7. [Integration Points](#integration-points)
8. [Error Handling](#error-handling)

## Overview

jj-agent is a JJ-first coding agent that uses Jujutsu version control as its primary workflow mechanism. The architecture is built entirely on Effect patterns, providing type-safe, composable operations without async/await or try/catch.

### Key Features

- **Effect-based Architecture**: Pure functional composition
- **5-Step Workflow**: Analyze → Build Context → Plan → Execute → Review
- **Type Safety**: Comprehensive type system with typed errors
- **File Watching**: Automatic workflow triggers
- **OpenAI Integration**: Intelligent code planning
- **JJ Integration**: Deep Jujutsu version control support

## Design Principles

### 1. Effect All the Way Down

Every function returns `Effect.Effect<Success, Error, Requirements>`:

```typescript
// Good
function doSomething(): Effect.Effect<Result, MyError, never> {
  return pipe(
    Effect.succeed(value),
    Effect.flatMap(transform)
  );
}

// Bad - Don't use async/await
async function doSomething(): Promise<Result> {
  try {
    return await operation();
  } catch (error) {
    throw error;
  }
}
```

### 2. Composition Over Callbacks

Use `pipe` and Effect operators for composition:

```typescript
const program = pipe(
  step1(),
  Effect.flatMap((a) => step2(a)),
  Effect.flatMap((b) => step3(b)),
  Effect.map((c) => transform(c)),
  Effect.catchAll(handleError)
);
```

### 3. Typed Errors

All errors are typed and extend from base error classes:

```typescript
export class MyError extends Data.TaggedError("MyError")<{
  readonly message: string;
  readonly context?: unknown;
}> {}
```

### 4. Immutability

All data structures are readonly:

```typescript
export interface WorkspaceAnalysis {
  readonly rootPath: string;
  readonly changedFiles: ReadonlyArray<FileChange>;
}
```

## 5-Step Workflow

### Step 1: Workspace Analysis

**File**: `src/workflow/workspace-analysis.ts`

**Purpose**: Analyze the current state of the workspace

**Operations**:
- Check if JJ is initialized
- Get current revision
- Detect changed files
- Analyze dependencies
- Detect project type

**Output**: `WorkspaceAnalysis`

```typescript
interface WorkspaceAnalysis {
  readonly rootPath: string;
  readonly jjInitialized: boolean;
  readonly currentRevision: string;
  readonly changedFiles: ReadonlyArray<FileChange>;
  readonly dependencies: ReadonlyArray<Dependency>;
  readonly projectType: ProjectType;
}
```

### Step 2: Context Building

**File**: `src/workflow/context-building.ts`

**Purpose**: Build context for AI planning

**Operations**:
- Select relevant files based on changes
- Load file contents
- Rank files by relevance
- Limit context to token budget

**Output**: `Context`

```typescript
interface Context {
  readonly workspace: WorkspaceAnalysis;
  readonly relevantFiles: ReadonlyArray<ContextFile>;
  readonly totalTokens: number;
  readonly intent?: string;
}
```

### Step 3: AI Planning

**File**: `src/workflow/ai-planning.ts`

**Purpose**: Generate execution plan using OpenAI

**Operations**:
- Build prompt from context
- Call OpenAI API
- Parse response
- Validate plan structure
- Check step dependencies

**Output**: `ExecutionPlan`

```typescript
interface ExecutionPlan {
  readonly intent: string;
  readonly steps: ReadonlyArray<ExecutionStep>;
  readonly estimatedDuration: number;
  readonly risks: ReadonlyArray<string>;
}
```

### Step 4: Execution

**File**: `src/workflow/execution.ts`

**Purpose**: Execute the plan

**Operations**:
- Execute steps in order
- Handle different step types:
  - `jj_command`: Run JJ commands
  - `file_write`: Create/update files
  - `file_delete`: Delete files
  - `analysis`: Analyze code
  - `validation`: Validate results
- Track execution time
- Collect results

**Output**: `ExecutionResult`

```typescript
interface ExecutionResult {
  readonly plan: ExecutionPlan;
  readonly completedSteps: ReadonlyArray<StepResult>;
  readonly success: boolean;
  readonly duration: number;
}
```

### Step 5: Review

**File**: `src/workflow/review.ts`

**Purpose**: Validate execution and provide feedback

**Operations**:
- Check all steps completed
- Check for errors
- Validate duration
- Generate suggestions
- Provide approval status

**Output**: `ReviewResult`

```typescript
interface ReviewResult {
  readonly execution: ExecutionResult;
  readonly validation: ValidationResult;
  readonly suggestions: ReadonlyArray<string>;
  readonly approved: boolean;
}
```

## Core Services

### AI Service

**File**: `src/services/ai.ts`

**Purpose**: OpenAI API integration

**Key Methods**:
- `create(config)`: Initialize AI service
- `generatePlan(prompt)`: Generate execution plan

**Features**:
- Configurable model and parameters
- JSON response parsing
- Error handling

### JJ Service

**File**: `src/services/jj.ts`

**Purpose**: Jujutsu version control integration

**Key Methods**:
- `isInitialized()`: Check JJ status
- `getCurrentRevision()`: Get current revision
- `getChangedFiles()`: List changed files
- `executeCommand(cmd)`: Run JJ command

**Features**:
- Status parsing
- Command execution
- Error handling

### Workspace Service

**File**: `src/services/workspace.ts`

**Purpose**: File system and workspace operations

**Key Methods**:
- `readFile(path)`: Read file
- `writeFile(path, content)`: Write file
- `deleteFile(path)`: Delete file
- `getDependencies()`: Parse package.json
- `detectProjectType()`: Detect project type
- `findRelatedFiles(paths)`: Find related files

**Features**:
- Safe file operations
- Dependency detection
- Project type detection

### File Watcher Service

**File**: `src/services/file-watcher.ts`

**Purpose**: Watch for file changes

**Key Methods**:
- `start(orchestrator)`: Start watching
- `stop()`: Stop watching

**Features**:
- Chokidar integration
- Debounced changes
- Configurable ignore patterns
- Automatic workflow triggering

### UI Service

**File**: `src/services/ui.ts`

**Purpose**: Terminal output management

**Key Methods**:
- `initialize()`: Initialize UI
- `showWelcome()`: Show welcome message
- `log(level, message)`: Log messages
- `showStep(step)`: Show workflow step
- `showWorkspaceAnalysis(workspace)`: Display analysis
- `showContext(context)`: Display context
- `showPlan(plan)`: Display plan
- `showExecutionResult(result)`: Display results
- `showReview(review)`: Display review
- `showError(error)`: Display errors

### Config Service

**File**: `src/services/config.ts`

**Purpose**: Configuration management

**Key Methods**:
- `load()`: Load configuration

**Features**:
- Environment variable loading
- Validation
- Sensible defaults

**Configuration**:
```typescript
interface Config {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  workspace: {
    rootPath: string;
    includePatterns: string[];
    excludePatterns: string[];
    maxContextFiles: number;
    maxContextTokens: number;
  };
  ui: {
    theme: "light" | "dark";
    verbose: boolean;
    showProgress: boolean;
  };
  watcher: {
    enabled: boolean;
    debounceMs: number;
    ignorePatterns: string[];
  };
}
```

## Type System

### Error Types

**File**: `src/types/errors.ts`

All errors extend from `Data.TaggedError`:

- `AppError` - Base application error
- `WorkspaceError` - Workspace operations
- `ContextError` - Context building
- `AIError` - AI operations
- `ExecutionError` - Execution failures
- `ReviewError` - Review issues
- `JJError` - JJ command failures
- `FileError` - File operations
- `ConfigError` - Configuration issues

### Workflow Types

**File**: `src/types/workflow.ts`

Complete type definitions for:
- Workspace analysis data
- Context building data
- Execution plans and results
- Review results
- Validation checks

### Config Types

**File**: `src/types/config.ts`

Configuration interfaces for:
- OpenAI settings
- Workspace settings
- UI settings
- Watcher settings

## Effect Patterns

### Basic Effect Creation

```typescript
// From value
const effect = Effect.succeed(42);

// From error
const effect = Effect.fail(new MyError({ message: "Failed" }));

// From side effect
const effect = Effect.sync(() => console.log("Hello"));

// From Promise
const effect = Effect.tryPromise({
  try: () => fetch("..."),
  catch: (error) => new MyError({ message: "...", cause: error })
});
```

### Composition

```typescript
// Sequential composition
const program = pipe(
  effect1,
  Effect.flatMap((a) => effect2(a)),
  Effect.flatMap((b) => effect3(b))
);

// Parallel composition
const program = Effect.all([effect1, effect2, effect3]);

// Transformation
const program = pipe(
  effect,
  Effect.map((value) => transform(value))
);
```

### Error Handling

```typescript
// Catch all errors
const program = pipe(
  effect,
  Effect.catchAll((error) => handleError(error))
);

// Catch specific errors
const program = pipe(
  effect,
  Effect.catchTag("MyError", (error) => handle(error))
);

// Retry
const program = pipe(
  effect,
  Effect.retry({ times: 3 })
);
```

### Execution

```typescript
// Run as Promise
Effect.runPromise(program)
  .then((result) => console.log(result))
  .catch((error) => console.error(error));

// Run synchronously (if possible)
Effect.runSync(program);
```

## Integration Points

### OpenAI Integration

```typescript
import OpenAI from "openai";

const client = new OpenAI({ apiKey: "..." });

const effect = Effect.tryPromise({
  try: () => client.chat.completions.create({...}),
  catch: (error) => new AIError({...})
});
```

### Chokidar Integration

```typescript
import chokidar from "chokidar";

const watcher = chokidar.watch(".", {
  ignored: ["node_modules", ".jj"],
  persistent: true
});

watcher.on("all", (event, path) => {
  // Trigger workflow
});
```

### pl-tui Integration

TODO: Full integration when library is set up

```typescript
// Placeholder for pl-tui components
import { Terminal, ProgressBar, Spinner } from "@mariozechner/pl-tui";
```

### pl-mono Integration

TODO: Workspace management integration

```typescript
// Placeholder for pl-mono workspace management
import { Workspace } from "@mariozechner/pl-mono";
```

## Error Handling

### Error Type Hierarchy

```
AppError (base)
├── WorkspaceError
├── ContextError
├── AIError
├── ExecutionError
├── ReviewError
├── JJError
├── FileError
└── ConfigError
```

### Error Creation

```typescript
export class MyError extends Data.TaggedError("MyError")<{
  readonly message: string;
  readonly context?: unknown;
  readonly cause?: unknown;
}> {}

// Usage
const error = new MyError({
  message: "Something went wrong",
  context: { path: "...", data: {...} },
  cause: originalError
});
```

### Error Handling Pattern

```typescript
const program = pipe(
  riskyOperation(),
  Effect.catchAll((error) => {
    // Log error
    return pipe(
      UIService.showError(error),
      // Recover or fail
      Effect.flatMap(() => Effect.fail(error))
    );
  })
);
```

### Error Recovery

```typescript
const program = pipe(
  operation(),
  Effect.catchTag("RecoverableError", (error) => {
    // Attempt recovery
    return fallbackOperation();
  }),
  Effect.catchTag("FatalError", (error) => {
    // Log and fail
    return pipe(
      Effect.log(`Fatal error: ${error.message}`),
      Effect.flatMap(() => Effect.fail(error))
    );
  })
);
```

## Testing Strategy

### Unit Testing

Test individual functions with mock Effects:

```typescript
test("workspace analysis", async () => {
  const mockJJService = {
    isInitialized: () => Effect.succeed(true),
    getCurrentRevision: () => Effect.succeed("abc123")
  };
  
  const analyzer = new WorkspaceAnalyzer(config, mockJJService, ...);
  const result = await Effect.runPromise(analyzer.analyze());
  
  expect(result.jjInitialized).toBe(true);
});
```

### Integration Testing

Test workflow steps together:

```typescript
test("full workflow", async () => {
  const orchestrator = await Effect.runPromise(
    WorkflowOrchestrator.create(config)
  );
  
  const result = await Effect.runPromise(orchestrator.run());
  
  expect(result.approved).toBe(true);
});
```

### End-to-End Testing

Test with real dependencies:

```typescript
test("e2e workflow", async () => {
  // Set up test repository
  // Run agent
  // Verify results
});
```

## Future Enhancements

1. **Full pl-tui Integration**: Rich terminal UI components
2. **Advanced Import Analysis**: Better context building
3. **Parallel Execution**: Execute independent steps in parallel
4. **State Persistence**: Save and resume workflows
5. **Interactive Mode**: User confirmations and input
6. **Plugin System**: Extensible workflow steps
7. **Metrics Collection**: Performance monitoring
8. **Caching**: Cache AI responses and analysis results
9. **Multi-repo Support**: Work across multiple repositories
10. **Collaboration**: Multi-user workflows

## Contributing

When contributing, please follow these guidelines:

1. **Use Effect patterns**: No async/await or try/catch
2. **Type everything**: Full type coverage
3. **Immutable data**: Use readonly everywhere
4. **Compose functions**: Use pipe and Effect operators
5. **Handle errors**: Use typed errors
6. **Document code**: Clear comments and documentation
7. **Test thoroughly**: Unit, integration, and e2e tests

## Resources

- [Effect Documentation](https://effect.website/)
- [Jujutsu Documentation](https://github.com/martinvonz/jj)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Chokidar Documentation](https://github.com/paulmillr/chokidar)
