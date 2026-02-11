# Mastra AI Framework - Documentation

Mastra is a TypeScript-first framework designed to move AI applications from prototype to production. It integrates seamlessly with Next.js, React, and Node.js.

## Documentation Modules

| Module | Description |
| :--- | :--- |
| **[Agents Guide](./agents-guide.md)** | Comprehensive guide on creating Agents, Tools, Memory (RAG & Working Memory), and Sub-agents. |
| **[Workflows Guide](./workflows-guide.md)** | Detailed documentation on Workflow orchestration, Control Flow, State, and Suspend/Resume patterns. |
| **[Workspace Guide](./workspace-guide.md)** | Guide on Filesystem, Sandbox, Skills (`SKILL.md`), and Search capabilities. |
| **[Client SDK](./client-sdk.md)** | Guide on integrating Mastra with frontend frameworks like Next.js and React. |
| **[Core Concepts](./core-concepts.md)** | High-level summary of the framework's architecture and primitives. |
| **[Integrations](./integrations.md)** | Setup for LLM providers (OpenAI, Anthropic) and deployment configurations. |

## Quick Start

Start a new project with the CLI:

```bash
npm create mastra@latest
```

## Key Features

- **Model Routing**: Unified interface for 40+ providers.
- **Durable Workflows**: Graph-based state machines with "time travel" reliability.
- **Memory & RAG**: Built-in vector database integrations and structured working memory.
- **Human-in-the-Loop**: Native `suspend()` and `resume()` for approval flows.
- **Observability**: Full tracing open telemetry support.
