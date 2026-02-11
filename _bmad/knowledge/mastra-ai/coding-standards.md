# Mastra AI Coding Standards & Patterns

## 1. Project Scaffolding
Always use the official CLI for setting up new projects unless integrating into an existing one.
```bash
npm create mastra@latest
```
This sets up `package.json`, environment variables, and `tsconfig.json` correctly.

## 2. Agent Definition Pattern
Keep agents separate from workflows. Use Zod for tool definitions.

### Example: Defining an Agent with Tools
```typescript
import { Agent, Tool } from '@mastra/core';
import { z } from 'zod';

// Define a tool separately
const weatherTool = new Tool({
  name: 'get_weather',
  description: 'Fetches the weather for a city',
  schema: z.object({ city: z.string() }),
  exec: async ({ city }) => {
    // Implementation here
    return { temp: 25, unit: 'C' };
  },
});

export const weatherAgent = new Agent({
  name: 'WeatherBot',
  instructions: 'You are a helpful weather assistant.',
  model: {
    provider: 'openai',
    name: 'gpt-4o',
  },
  tools: {
    weather: weatherTool,
  },
  memory: {
    history: true, // Enable short-term conversation history
  },
});
```

## 3. Workflow Pattern
Workflows manage state and orchestration.

### Example: Workflow with Branching
```typescript
import { Workflow, Step } from '@mastra/core';
import { z } from 'zod';

const fetchUserStep = new Step({ id: 'fetchUser', execute: async () => ({ id: 1, role: 'admin' }) });
const adminStep = new Step({ id: 'adminAction', execute: async () => 'Admin task done' });
const userStep = new Step({ id: 'userAction', execute: async () => 'User task done' });

const permissionWorkflow = new Workflow({
  name: 'PermissionCheck',
  triggerSchema: z.object({ userId: z.number() }),
});

permissionWorkflow
  .step(fetchUserStep)
  .branch((output) => output.role === 'admin', {
    true: adminStep,
    false: userStep,
  });
```

## 4. MCP Server Authoring
To expose your agent or tools via Model Context Protocol:
```typescript
import { McpServer } from '@mastra/mcp';
// Provide your agent or tools to the server constructor
const server = new McpServer({
  agents: [weatherAgent],
  tools: [weatherTool]
});
server.start();
```

## 5. Best Practices
- **Type Safety**: Leverage `zod` for all schemas (inputs, outputs, tool parameters).
- **Environment Variables**: Store sensitive keys in `.env` and access via `process.env`.
- **Modularity**: Define steps in separate files to reuse them across workflows.
- **Error Handling**: Wrap external calls in try/catch blocks within Steps and Tools.
- **Observability**: Use Mastra's built-in logging/tracing for debugging complex agent interactions.
