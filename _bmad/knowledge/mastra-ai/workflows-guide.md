# Mastra AI - Workflows Guide

Workflows in Mastra are durable, graph-based state machines designed for orchestrating complex, multi-step processes.

## 1. Creating Workflows

Workflows are composed of **Steps**. Each step has an input schema, output schema, and execution logic.

```typescript
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

// Define a Step
const fetchUser = createStep({
  id: "fetch-user",
  inputSchema: z.object({ userId: z.string() }),
  outputSchema: z.object({ email: z.string(), role: z.string() }),
  execute: async ({ inputData }) => {
    // Fetch logic
    return { email: "user@example.com", role: "admin" };
  }
});

// Define Workflow
const workflow = createWorkflow({
  id: "onboarding",
  inputSchema: z.object({ userId: z.string() }),
  outputSchema: z.object({ success: z.boolean() })
})
  .step(fetchUser)
  .commit();
```

## 2. Control Flow

Mastra supports various control flow primitives to manage execution logic.

### Sequential (`.then`)
Executes steps one after another.
```typescript
workflow.step(stepA).then(stepB);
```

### Branched (`.branch`)
Conditionally executes paths based on the output of the previous step.
```typescript
workflow.step(stepA).branch(
  (data) => data.role === 'admin', 
  {
    true: adminStep,
    false: userStep
  }
);
```

### Parallel (`.parallel`)
Executes multiple steps concurrently.
```typescript
workflow.step(stepA).parallel([stepB, stepC]);
```

## 3. Workflow State

Steps can share data via a global workflow **State**, avoiding the need to pass everything through input/output schemas.

```typescript
const stepA = createStep({
  stateSchema: z.object({ count: z.number() }),
  execute: async ({ state, setState }) => {
    // Read and update state
    await setState({ ...state, count: state.count + 1 });
    return {};
  }
});
```

## 4. Suspend & Resume (Human-in-the-Loop)

Workflows can pause execution to wait for external input (e.g., user approval).

### Suspending
Inside a step, use the `suspend()` helper. You can pass `suspendData` to persist context.

```typescript
execute: async ({ context, suspend, resumeData }) => {
  // Check if we have received approval data
  if (!resumeData?.approved) {
    return await suspend({
      reason: "Waiting for admin approval",
      ticketId: context.ticketId
    });
  }
  
  // Continue execution if approved
  return { status: "approved" };
}
```

### Resuming
Resume a workflow run by providing the `stepId` and `resumeData`.

```typescript
const workflow = mastra.getWorkflow("onboarding");
const run = await workflow.createRun({ runId: "active-run-id" });

await run.resume({
  step: "approval-step",
  resumeData: { approved: true } // Matches resumeSchema of the step
});
```

## 5. Execution & Observability

### Running Modes
- **Start**: Await the final result.
  ```typescript
  const result = await run.start({ inputData });
  ```
- **Stream**: Receive events as steps complete.
  ```typescript
  const stream = run.stream({ inputData });
  for await (const chunk of stream.fullStream) { ... }
  ```

### Managing Runs
- **List Active Runs**: `workflow.listActiveWorkflowRuns()`
- **Restart Run**: `run.restart()` (restarts from last active step)
- **Restart All**: `workflow.restartAllActiveWorkflowRuns()`

## 6. Nesting

Workflows can be used as steps within other workflows, allowing for modular composition.

```typescript
const childWorkflow = createWorkflow({ ... }).commit();

const parentWorkflow = createWorkflow({ ... })
  .step(childWorkflow)
  .commit();
```
