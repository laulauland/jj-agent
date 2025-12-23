# Quick Start Guide

Get started with jj-agent in 5 minutes.

## Prerequisites

- [Bun](https://bun.sh/) installed
- [Jujutsu (jj)](https://github.com/martinvonz/jj) installed
- OpenAI API key

## Installation

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/laulauland/jj-agent.git
cd jj-agent

# Install dependencies
bun install
```

### 2. Configure Environment

```bash
# Copy example env file
cp packages/jj-agent/.env.example packages/jj-agent/.env

# Edit with your API key
# Required:
export OPENAI_API_KEY="sk-..."

# Optional:
export OPENAI_MODEL="gpt-4o"
export VERBOSE="true"
```

### 3. Initialize JJ Repository

```bash
# If not already a JJ repository
jj init
jj describe -m "Initial commit"
```

## Running jj-agent

### Development Mode

Run with auto-reload on file changes:

```bash
bun run dev
```

### Production Mode

```bash
bun run start
```

## Your First Workflow

### Example 1: Analyze Current Workspace

The agent will automatically:

1. **Analyze** your workspace
   - Detect JJ initialization
   - Find changed files
   - Identify project type
   - Parse dependencies

2. **Build Context**
   - Select relevant files
   - Load and rank by relevance
   - Stay within token limits

3. **Plan**
   - Generate execution plan via OpenAI
   - Validate plan structure
   - Identify risks

4. **Execute**
   - Run JJ commands
   - Modify files as needed
   - Track progress

5. **Review**
   - Validate results
   - Provide suggestions
   - Approve/reject changes

### Example 2: Watch Mode

With watch mode enabled (default), the agent monitors file changes:

```bash
# Start in watch mode
bun run dev

# In another terminal, make changes
echo "// TODO: implement feature" >> src/feature.ts

# Agent automatically triggers workflow!
```

### Example 3: Manual Trigger

Disable watch mode and trigger manually:

```bash
# Disable watch mode
export WATCH="false"

# Run once
bun run start
```

## Understanding the Output

### Welcome Screen

```
╔═══════════════════════════════════════════════╗
║          JJ Agent - Jujutsu Workflow          ║
╚═══════════════════════════════════════════════╝
```

### Workflow Steps

```
▸ Analyzing workspace...
  Root: /path/to/project
  Project Type: typescript
  Current Revision: abc123
  Changed Files: 3
    - modified: src/index.ts
    - added: src/feature.ts
    - deleted: src/old.ts

▸ Building context...
  Files in context: 5
  Total tokens: 2,450

▸ Creating execution plan...
  Intent: Implement new feature
  Steps: 4
  Estimated Duration: 5000ms
  
  Execution Steps:
    1. [analysis] Analyze existing code
    2. [file_write] Create feature implementation
    3. [jj_command] Create new change
    4. [validation] Validate implementation

▸ Executing plan...
  Status: ✓ Success
  Duration: 4,823ms
  Completed: 4/4 steps

▸ Reviewing execution...
  Validation: ✓ Passed
  Approved: ✓ Yes
  
  Validation Checks:
    ✓ All steps completed: All steps were executed
    ✓ No errors: No errors occurred
    ✓ Reasonable duration: Completed in 4823ms
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ | - | OpenAI API key |
| `OPENAI_MODEL` | ❌ | `gpt-4o` | Model to use |
| `OPENAI_MAX_TOKENS` | ❌ | `4000` | Max tokens per request |
| `OPENAI_TEMPERATURE` | ❌ | `0.7` | Temperature (0-2) |
| `VERBOSE` | ❌ | `false` | Enable verbose logging |
| `WATCH` | ❌ | `true` | Enable file watching |

### File Patterns

The agent automatically includes/excludes files:

**Included:**
- `**/*.ts` - TypeScript files
- `**/*.js` - JavaScript files
- `**/*.json` - JSON files

**Excluded:**
- `**/node_modules/**`
- `**/dist/**`
- `**/build/**`
- `**/.jj/**`
- `**/.git/**`

### Context Limits

- **Max files**: 50
- **Max tokens**: 32,000

Files are ranked by relevance and limited to stay within bounds.

## Common Workflows

### Workflow 1: Feature Development

```bash
# 1. Create new change
jj new -m "Add feature X"

# 2. Start agent
bun run dev

# 3. Make changes
# Agent watches and assists

# 4. Review changes
jj diff

# 5. Commit
jj describe -m "Implement feature X"
```

### Workflow 2: Bug Fix

```bash
# 1. Create bug fix change
jj new -m "Fix bug Y"

# 2. Describe the issue
echo "Bug: Application crashes when..." > ISSUE.md

# 3. Start agent
bun run dev

# Agent analyzes issue and suggests fixes
```

### Workflow 3: Refactoring

```bash
# 1. Create refactoring change
jj new -m "Refactor module Z"

# 2. Agent analyzes and plans refactoring
bun run dev

# 3. Review and approve changes
jj diff
```

## Troubleshooting

### Agent doesn't start

**Check:**
1. Bun is installed: `bun --version`
2. Dependencies installed: `bun install`
3. OpenAI API key set: `echo $OPENAI_API_KEY`

### JJ not detected

**Check:**
1. JJ is installed: `jj --version`
2. Repository is initialized: `jj status`
3. You're in the repo root

### File watching not working

**Check:**
1. Watch mode enabled: `echo $WATCH`
2. Files not in ignore patterns
3. System file watch limits (Linux: `fs.inotify.max_user_watches`)

### OpenAI errors

**Check:**
1. API key is valid
2. API key has credits
3. Model name is correct
4. Network connectivity

### High token usage

**Solutions:**
1. Reduce `OPENAI_MAX_TOKENS`
2. Exclude more file patterns
3. Reduce max context files in config

## Advanced Usage

### Custom Ignore Patterns

Edit `packages/jj-agent/src/services/config.ts`:

```typescript
excludePatterns: [
  "**/node_modules/**",
  "**/dist/**",
  "**/test/**",       // Add custom patterns
  "**/*.test.ts",     // Exclude test files
]
```

### Custom Step Types

Extend the executor in `packages/jj-agent/src/workflow/execution.ts`:

```typescript
private executeStepByType(step: ExecutionStep) {
  switch (step.type) {
    case "custom_step":
      return this.executeCustomStep(step);
    // ...
  }
}
```

### Custom UI

Modify `packages/jj-agent/src/services/ui.ts` to customize output.

## Next Steps

1. **Read the [Architecture Guide](./ARCHITECTURE.md)** to understand the internals
2. **Explore [Examples](./examples/)** for common use cases
3. **Check the [API Reference](./API.md)** for detailed function docs
4. **Join the community** to share experiences

## Getting Help

- 📖 [Documentation](./README.md)
- 🏗️ [Architecture](./ARCHITECTURE.md)
- 💬 [GitHub Discussions](https://github.com/laulauland/jj-agent/discussions)
- 🐛 [Issue Tracker](https://github.com/laulauland/jj-agent/issues)

## Tips & Tricks

### Tip 1: Start Small

Begin with small, focused changes. The agent works best with clear, scoped tasks.

### Tip 2: Use Descriptive Messages

Write clear JJ commit messages. The agent uses them for context.

```bash
# Good
jj describe -m "Add user authentication with JWT"

# Better
jj describe -m "Add user authentication

Implement JWT-based auth:
- Add login endpoint
- Create token service
- Add middleware"
```

### Tip 3: Review Plans

Always review the execution plan before proceeding. You can modify the AI service to require confirmation.

### Tip 4: Iterative Development

Use JJ's change evolution to iterate:

```bash
jj new -m "Initial implementation"
# Agent helps with first version

jj new -m "Refine implementation"
# Agent helps with improvements

jj squash  # Combine if desired
```

### Tip 5: Learn from Reviews

Pay attention to the review step's suggestions. They can help improve your code quality.

## What's Next?

Now that you're set up, try:

1. ✅ Make a small change and watch the workflow
2. ✅ Review the generated execution plan
3. ✅ Customize the configuration
4. ✅ Explore the codebase
5. ✅ Contribute improvements!

Happy coding! 🚀
