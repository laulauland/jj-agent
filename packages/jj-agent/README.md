# JJ Agent

A JJ-first coding agent that uses Jujutsu version control as its primary workflow mechanism.

## Architecture

This project implements a 5-step workflow using Effect patterns:

### 1. Workspace Analysis
Analyzes the repository structure, detects changes, and identifies the current context.

### 2. Context Building
Gathers relevant files and builds a context for AI processing, respecting token limits.

### 3. AI Planning
Uses OpenAI to create a detailed execution plan based on the workspace context.

### 4. Execution
Executes the planned actions using JJ commands and file operations.

### 5. Review
Validates the execution results and provides feedback and suggestions.

## Features

- **Effect-based Architecture**: All operations use Effect.Effect<T, E> patterns
- **No async/await**: Composition using pipe, Effect.flatMap, and Effect.map
- **Proper Error Handling**: Typed errors with detailed error information
- **File Watching**: Automatic workflow triggers on file changes
- **Terminal UI**: Rich terminal output using pl-tui
- **OpenAI Integration**: Intelligent planning and code generation
- **JJ Integration**: Deep integration with Jujutsu version control

## Installation

```bash
bun install
```

## Configuration

Set the following environment variables:

```bash
# Required
export OPENAI_API_KEY="your-api-key"

# Optional
export OPENAI_MODEL="gpt-4o"
export OPENAI_MAX_TOKENS="4000"
export OPENAI_TEMPERATURE="0.7"
export VERBOSE="true"
export WATCH="true"
```

## Usage

```bash
bun run dev      # Development mode with auto-reload
bun run start    # Production mode
bun run build    # Build
bun test         # Run tests
```

## License

MIT
