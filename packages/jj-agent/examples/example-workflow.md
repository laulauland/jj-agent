# Example Workflows

Practical examples of using jj-agent.

## Example 1: Adding a New Feature

### Scenario

You want to add a new user profile feature to your application.

### Steps

```bash
# 1. Create a new change
jj new -m "Add user profile feature"

# 2. Create a feature file
cat > src/profile.ts << 'EOF'
// User profile interface
export interface UserProfile {
  id: string;
  name: string;
  email: string;
}
EOF

# 3. Start the agent (watches automatically)
bun run dev
```

### What the Agent Does

1. **Analyzes** the workspace
   - Detects new file: `src/profile.ts`
   - Identifies TypeScript project
   - Checks existing code

2. **Builds Context**
   - Includes `profile.ts`
   - Includes related files (e.g., `src/user.ts`)
   - Includes type definitions

3. **Creates Plan**
   ```json
   {
     "intent": "Implement user profile feature",
     "steps": [
       {
         "id": "1",
         "type": "file_write",
         "description": "Add profile service",
         "files": [{
           "path": "src/profile-service.ts",
           "operation": "create",
           "content": "..."
         }]
       },
       {
         "id": "2",
         "type": "file_write",
         "description": "Add profile tests",
         "files": [{
           "path": "src/profile.test.ts",
           "operation": "create",
           "content": "..."
         }]
       },
       {
         "id": "3",
         "type": "jj_command",
         "description": "Commit changes",
         "command": "jj describe -m 'Implement profile feature'"
       }
     ]
   }
   ```

4. **Executes** the plan
   - Creates service file
   - Creates test file
   - Commits changes

5. **Reviews** the results
   - Validates all files created
   - Checks for errors
   - Suggests improvements

## Example 2: Fixing a Bug

### Scenario

You discover a null pointer exception in the login function.

### Steps

```bash
# 1. Create a bug fix change
jj new -m "Fix login null pointer exception"

# 2. Document the bug
cat > BUG_REPORT.md << 'EOF'
# Bug Report

## Issue
Application crashes when login with null email.

## Stack Trace
```
TypeError: Cannot read property 'toLowerCase' of null
  at validateEmail (src/auth.ts:45)
```

## Expected
Should show validation error.
EOF

# 3. Start the agent
bun run dev
```

### Agent's Analysis

```
▸ Analyzing workspace...
  Changed Files: 1
    - added: BUG_REPORT.md

▸ Building context...
  Files in context: 3
    - BUG_REPORT.md
    - src/auth.ts
    - src/validation.ts

▸ Creating execution plan...
  Intent: Fix null pointer exception in login validation
  Steps: 3
  
  1. [analysis] Analyze auth.ts validateEmail function
  2. [file_write] Add null check before toLowerCase()
  3. [file_write] Add test case for null email
```

### Generated Fix

```typescript
// Before
function validateEmail(email: string): boolean {
  return email.toLowerCase().includes('@');
}

// After (Agent's suggestion)
function validateEmail(email: string | null): boolean {
  if (!email) {
    return false;
  }
  return email.toLowerCase().includes('@');
}
```

## Example 3: Refactoring Code

### Scenario

Refactor a large function into smaller, testable units.

### Steps

```bash
# 1. Create refactoring change
jj new -m "Refactor processUserData function"

# 2. Add a comment in the code
cat > src/user.ts << 'EOF'
// TODO: Refactor this function - it's too long and does too much
export function processUserData(data: any) {
  // 100 lines of complex logic...
}
EOF

# 3. Start agent
bun run dev
```

### Agent's Plan

```
Intent: Refactor processUserData into smaller functions

Steps:
  1. [analysis] Analyze processUserData complexity
  2. [file_write] Extract validation logic
  3. [file_write] Extract transformation logic
  4. [file_write] Extract error handling
  5. [file_write] Update main function
  6. [file_write] Add unit tests
  7. [validation] Verify refactoring
```

### Result

```typescript
// New structure
export function validateUserData(data: any): ValidationResult {
  // Validation logic
}

export function transformUserData(data: any): User {
  // Transformation logic
}

export function handleUserError(error: Error): void {
  // Error handling
}

export function processUserData(data: any): User {
  const validation = validateUserData(data);
  if (!validation.valid) {
    handleUserError(validation.error);
  }
  return transformUserData(data);
}
```

## Example 4: Adding Tests

### Scenario

Add comprehensive tests for an existing module.

### Steps

```bash
# 1. Create testing change
jj new -m "Add tests for auth module"

# 2. Create test file stub
cat > src/auth.test.ts << 'EOF'
// TODO: Add comprehensive tests
import { describe, test, expect } from 'bun:test';
import { login, logout, validateToken } from './auth';

describe('Auth Module', () => {
  // Tests needed:
  // - login with valid credentials
  // - login with invalid credentials
  // - logout
  // - token validation
});
EOF

# 3. Start agent
bun run dev
```

### Agent's Plan

```
Intent: Add comprehensive tests for auth module

Steps:
  1. [analysis] Analyze auth.ts functions
  2. [file_write] Implement login tests
  3. [file_write] Implement logout tests
  4. [file_write] Implement token validation tests
  5. [file_write] Add edge case tests
  6. [validation] Run tests
```

## Example 5: Documentation

### Scenario

Generate documentation for an undocumented module.

### Steps

```bash
# 1. Create documentation change
jj new -m "Add documentation for API module"

# 2. Create doc file
cat > src/api/README.md << 'EOF'
# API Module Documentation

TODO: Document all endpoints and usage examples
EOF

# 3. Start agent
bun run dev
```

### Agent's Output

Generates comprehensive documentation:

```markdown
# API Module Documentation

## Overview
The API module provides HTTP endpoints for user management.

## Endpoints

### POST /api/users
Create a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com"
}
```

## Usage Examples

```typescript
import { createUser } from './api';

const user = await createUser({
  name: 'John Doe',
  email: 'john@example.com'
});
```
```

## Example 6: Dependency Updates

### Scenario

Update dependencies and fix breaking changes.

### Steps

```bash
# 1. Update dependencies
bun update

# 2. Create update change
jj new -m "Update dependencies and fix breaking changes"

# 3. Start agent
bun run dev
```

### Agent's Analysis

```
▸ Analyzing workspace...
  Changed Files: 1
    - modified: package.json
  Dependencies Updated: 5
    - effect: 3.9.0 → 3.10.0
    - typescript: 5.3.2 → 5.3.3

▸ Creating execution plan...
  Intent: Handle breaking changes from dependency updates
  
  Steps:
    1. [analysis] Check for breaking changes
    2. [file_write] Update type definitions
    3. [file_write] Update imports
    4. [validation] Run type checker
    5. [validation] Run tests
```

## Example 7: Performance Optimization

### Scenario

Optimize a slow function identified in profiling.

### Steps

```bash
# 1. Create optimization change
jj new -m "Optimize data processing function"

# 2. Document the issue
cat > PERFORMANCE.md << 'EOF'
# Performance Issue

Function: processLargeDataset
Location: src/data.ts:123
Current: 2.5s
Target: <500ms

Profiling shows:
- 80% time in nested loops
- Redundant array copies
- Inefficient filtering
EOF

# 3. Start agent
bun run dev
```

### Agent's Optimization

```typescript
// Before
function processLargeDataset(data: Item[]): Item[] {
  return data
    .map(item => transform(item))
    .filter(item => validate(item))
    .map(item => enrich(item));
}

// After (Agent's optimization)
function processLargeDataset(data: Item[]): Item[] {
  const result: Item[] = [];
  for (const item of data) {
    const transformed = transform(item);
    if (validate(transformed)) {
      result.push(enrich(transformed));
    }
  }
  return result;
}

// Reduces: 2.5s → 450ms ✓
```

## Best Practices

### 1. Clear Intent

Provide clear context for the agent:

```bash
# Good
jj new -m "Add user authentication

Implement JWT-based authentication with:
- Login endpoint
- Token generation
- Token validation middleware"

# Less effective
jj new -m "auth stuff"
```

### 2. Incremental Changes

Make focused changes:

```bash
# Better: Multiple small changes
jj new -m "Add auth types"
jj new -m "Add auth service"
jj new -m "Add auth tests"

# Avoid: One large change
jj new -m "Add complete auth system"
```

### 3. Review Plans

Always review the agent's execution plan before proceeding.

### 4. Use JJ Features

```bash
# Squash related changes
jj squash

# Create branches for experiments
jj new -m "Experiment: try alternative approach"

# Abandon failed attempts
jj abandon
```

## Tips

- Start with documentation or types for better context
- Use TODO comments to guide the agent
- Keep changes focused and atomic
- Review and iterate on generated code
- Use JJ's evolution features to refine changes

## Next Steps

Explore more examples in the `examples/` directory:
- `examples/typescript-project/`
- `examples/rest-api/`
- `examples/cli-tool/`
