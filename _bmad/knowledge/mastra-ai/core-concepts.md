# Mastra AI Core Concepts

Mastra is designed around four primary primitives that work together to build reliable AI systems.

## 1. Agents
**Reasoning Engines**
Agents are the "brains" of your application. They use LLMs to process natural language, maintain context (memory), and decide which actions to take (tools).
- **See [Agents Guide](./agents-guide.md)** for details on memory, RAG, and tools.

## 2. Workflows
**Process Orchestration**
Workflows define deterministic, multi-step processes. Unlike agents which are probabilistic, workflows allow you to enforce strict logic, conditional branching, and parallel execution.
- **See [Workflows Guide](./workflows-guide.md)** for details on control flow and state management.

## 3. Tools
**Capabilities**
Tools are the interface between the AI and the outside world. They are strongly typed functions (using Zod) that can be executed by Agents or Workflow Steps.
- Tools can be local JavaScript functions.
- Tools can be remote **MCP** (Model Context Protocol) resources.
- Entire Workflows or Agents can be exposed as Tools (recursive capability).

## 4. Memory & Storage
**Context Management**
Mastra distinguishes between:
- **Conversation History**: linear chat log.
- **Working Memory**: structured or semi-structured state (like a "profile") that persists across the conversation.
- **Vector Storage (RAG)**: semantic search over large datasets.

## Architecture
Mastra applications are typically structured as:
1. **Core**: `src/mastra` (definitions of agents, workflows, tools)
2. **Server**: A Mastra server instance that exposes these primitives.
3. **Client**: A frontend (Next.js/React) that consumes the server via the Client SDK.

```typescript
// src/mastra/index.ts
import { Mastra } from "@mastra/core";
import { myAgent } from "./agent";
import { myWorkflow } from "./workflow";

export const mastra = new Mastra({
  agents: { myAgent },
  workflows: { myWorkflow }
});
```
