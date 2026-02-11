# Mastra Client SDK & React Integration

## Installing Dependencies

```bash
npm install @mastra/ai-sdk@latest @ai-sdk/react ai
npx ai-elements@latest
```

This installs the necessary components and SDKs for Next.js integration.

## React Hook Usage

In Next.js, create a `src/app/chat/page.tsx`:

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from '@ai-sdk/ai';

export default function ChatPage() {
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat', // Use a route handler to process requests
    }),
  });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}
      <button onClick={() => sendMessage({ role: 'user', content: 'Hello!' })}>Send</button>
    </div>
  );
}
```

## Creating a Chat Route

Create `src/app/api/chat/route.ts`:

```typescript
import { handleChatStream } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import { mastra } from '@/mastra'; // Your initialized Mastra instance
import { NextResponse } from 'next/server';

const AGENT_ID = 'support-agent';

export async function POST(req: Request) {
  const params = await req.json();

  const stream = await handleChatStream({
    mastra,
    agentId: AGENT_ID,
    params: {
      ...params,
    },
  });

  return createUIMessageStreamResponse({ stream });
}

export async function GET() {
  // Optional: Recall memory and restore chat history
  const memory = await mastra.getAgentById(AGENT_ID).getMemory();
  // ... recall logic
  return NextResponse.json([]);
}
```

This pattern allows the Client (React) to stream responses directly from the Agent (Mastra) via the server-side API route.
