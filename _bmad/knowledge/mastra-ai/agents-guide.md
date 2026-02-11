# Mastra AI - Agents Guide

Agents in Mastra are autonomous reasoning engines capable of tool use, memory management, and complex decision-making.

## 1. Defining an Agent

An agent is defined with instructions, a model, and optional tools and memory configuration.

```typescript
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

export const supportAgent = new Agent({
  id: "support-agent",
  name: "Customer Support",
  instructions: "You are a helpful support agent. resolving tickets.", 
  // Instructions can also be array of messages or an async function
  model: {
    provider: "openai",
    name: "gpt-4o",
    toolChoice: "auto",
  },
  tools: {
    // defined tools
  },
  memory: new Memory({
    options: {
      workingMemory: { enabled: true },
      history: { enabled: true }
    }
  })
});
```

### Provider Options & Dynamic Instructions

You can customize behavior per provider (e.g., caching for Anthropic) and use dynamic instructions based on context.

```typescript
instructions: {
  role: "system",
  content: "Analyze this code...",
  providerOptions: {
    anthropic: { cacheControl: { type: "ephemeral" } },
    openai: { reasoningEffort: "high" }
  }
}

// Dynamic Instructions
instructions: async ({ requestContext }) => {
  const userRole = requestContext?.get("role");
  return userRole === "admin" ? "You are an admin assistant." : "You are a user assistant.";
}
```

## 2. Tools

Tools are the primary way agents interact with the world. They are typed using Zod schemas.

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const lookUpOrder = createTool({
  id: "lookup-order",
  description: "Keys an order by ID",
  inputSchema: z.object({ orderId: z.string() }),
  outputSchema: z.object({ status: z.string() }),
  execute: async ({ context }) => {
    return { status: "shipped" };
  }
});
```

## 3. Working Memory

Working memory allows the agent to maintain a persistent "scratchpad" of information across a conversation thread. It can be **Template-based** (Markdown) or **Schema-based** (JSON).

### Template-based (Default)
The agent updates a Markdown text designed to hold relevant facts.
`memory: new Memory({ options: { workingMemory: { enabled: true } } })`

### Schema-based (Structured)
The agent updates a JSON object adhering to a Zod schema.

```typescript
import { z } from "zod";

const memory = new Memory({
  options: {
    workingMemory: {
      enabled: true,
      schema: z.object({
        userName: z.string(),
        preferences: z.array(z.string()),
        lastAction: z.string()
      })
    }
  }
});
```

### Scope
- **Resource-Scoped**: Tied to a user or resource ID (default). Persists across multiple threads for that user.
- **Thread-Scoped**: Isolated to the specific conversation thread.

## 4. RAG (Retrieval-Augmented Generation)

Mastra provides built-in utilities for document processing and vector storage.

### Setup Example
```typescript
import { embedMany } from "ai";
import { PgVector } from "@mastra/pg";
import { MDocument } from "@mastra/rag";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";

// 1. Chunking
const doc = MDocument.fromText(rawText);
const chunks = await doc.chunk({ strategy: "recursive", size: 512 });

// 2. Embedding
const { embeddings } = await embedMany({
  values: chunks.map(c => c.text),
  model: new ModelRouterEmbeddingModel("openai/text-embedding-3-small")
});

// 3. Storage (PgVector)
const vectorStore = new PgVector({ connectionString: process.env.DB_URL });
await vectorStore.upsert({ indexName: "knowledge_base", vectors: embeddings });

// 4. Retrieval
const results = await vectorStore.query({ 
  indexName: "knowledge_base", 
  queryVector: userQueryEmbedding,
  topK: 3 
});
```

## 5. Advanced Features

### Sub-Agents
Agents can be registered as tools for other agents.
```typescript
const researchAgent = new Agent({ ... });
const mainAgent = new Agent({
  tools: { researcher: researchAgent }
});
```

### Image Analysis
Pass images in the content array.
```typescript
await agent.generate([
  { role: "user", content: [
    { type: "image", image: "https://..." }, 
    { type: "text", text: "Describe this." } 
  ]}
]);
```

### Request Context
Access per-request data to drive logic in tools or instructions.
```typescript
const res = await agent.generate("Hello", {
  requestContext: { userId: "123", plan: "pro" }
});
```
