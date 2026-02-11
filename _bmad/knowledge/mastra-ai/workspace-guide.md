# Mastra AI - Workspace Guide

Workspaces in Mastra provide agents with a sandboxed environment to interact with the filesystem, execute commands, and use specialized skills.

## 1. Overview

A `Workspace` aggregates three main capabilities:
1.  **Filesystem**: Read/write access to a specific directory.
2.  **Sandbox**: Command execution in a secure environment.
3.  **Skills**: Reusable capabilities defined in `SKILL.md` files.
4.  **Search**: Indexing and retrieval of workspace content.

### Initialization

```typescript
import { Workspace, LocalFilesystem, LocalSandbox } from '@mastra/core/workspace';
import { Agent } from '@mastra/core/agent';

const workspace = new Workspace({
  filesystem: new LocalFilesystem({ basePath: './workspace_data' }),
  sandbox: new LocalSandbox({ workingDirectory: './workspace_data' }),
  skills: ['./skills-repo'], // Array of paths to skill directories
  bm25: true, // Enable keyword search over workspace content
});

// Assign to an Agent
const devAgent = new Agent({
  id: 'dev-agent', 
  model: 'openai/gpt-4o',
  workspace // Agent inherits tools for file/command ops
});
```

## 2. Filesystem

The `LocalFilesystem` provider gives the agent tools to manage files.

-   **Tools Added**: `read_file`, `write_file`, `list_files`, `delete_file`, `mkdir`.
-   **Security**: Restricted to `basePath`.
-   **Read-Only Mode**: Set `readOnly: true` to prevent modifications.

```typescript
new LocalFilesystem({ 
  basePath: './data',
  readOnly: false 
})
```

## 3. Sandbox

The `LocalSandbox` provider allows command execution.

-   **Tools Added**: `execute_command`.
-   **Usage**: The agent can run shell commands like `npm install`, `git status`, or run scripts.

## 4. Skills (`SKILL.md`)

Skills are modular capabilities that agents can "learn" by reading a specification file.

### Structure
A skill is a directory containing a `SKILL.md` file and optional scripts.

**`SKILL.md` Example:**
```markdown
---
name: code-review
description: Reviews code for quality and security
version: 1.0.0
tags: [development, review]
---

# Code Review

You are a code reviewer. When reviewing code:
1. Check for bugs and edge cases.
2. Verify adherence to style guides.
3. Run the linter using `scripts/lint.ts`.

## What to look for
- Security vulnerabilities
- Performance issues
```

### Dynamic Skills
You can dynamically assign skills based on context (e.g., user role).

```typescript
const workspace = new Workspace({
  skills: (context) => {
    return context.user.role === 'admin' ? ['/admin-skills'] : ['/basic-skills'];
  }
});
```

## 5. Search & Indexing

Workspaces support **BM25** (keyword) and **Vector** (semantic) search to help agents find relevant files or skills.

### Configuration
```typescript
const workspace = new Workspace({
  filesystem: new LocalFilesystem({ basePath: './docs' }),
  bm25: true, // Enable keyword search
  autoIndexPaths: ['/docs'], // Automatically index these folders on init
});

await workspace.init(); // Triggers indexing
```

### Manual Indexing
```typescript
await workspace.index('/manual/doc.md', 'Content...', { metadata: { type: 'manual' } });
```

### Searching
Agents can use search tools, or you can query programmatically:
```typescript
const results = await workspace.search('password reset policies');
```
