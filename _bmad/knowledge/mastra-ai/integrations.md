# Mastra AI Integrations

## LLM Providers

Mastra supports OpenAI and Anthropic natively.

### Configuration

Set your API keys in `.env`:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
```

Then reference them in Agent configuration:

```typescript
const agent = new Agent({
  model: "openai/gpt-4o",
  // OR
  model: "anthropic/claude-3-opus",
});
```

## Vercel Deployment

When deploying to Vercel (Next.js), you must configure `next.config.ts` to include Mastra packages as server externalities to avoid build issues.

### next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/*"],
};

export default nextConfig;
```

This ensures that the `@mastra/core` and related packages are bundled correctly for the serverless environment.
