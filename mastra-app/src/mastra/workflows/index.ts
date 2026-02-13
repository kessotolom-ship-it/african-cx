
import { createStep, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { mastra } from "../index";

// ==========================================================
// WORKFLOW DE TRIAGE & DISPATCH (HUB & SPOKE)
// ==========================================================

// --- ÉTAPE 1 : CLASSIFICATION ---
// --- DÉFINITION DU WORKFLOW (Mastra v0.1 Style) ---

// 1. CLASSIFICATION (Alignement des noms avec le Trigger)
const classifyStep = createStep({
    id: "classify-intent",
    inputSchema: z.object({
        message: z.string(), // Aligné avec Trigger
        history: z.string().optional(),
    }),
    outputSchema: z.object({
        intent: z.enum(['info', 'payment', 'compliance']),
        history: z.string(), // Aligné avec Input
        message: z.string()  // Aligné avec Input
    }),
    execute: async ({ inputData }) => {
        const context = inputData;
        const dispatcher = mastra.getAgent("solimi_support");
        const result = await dispatcher.generate(context.message);
        const text = result.text.toLowerCase();

        let intent: 'info' | 'payment' | 'compliance' = 'info';
        if (text.includes('[payment]')) intent = 'payment';
        else if (text.includes('[compliance]')) intent = 'compliance';

        console.log(`[WORKFLOW] Classified intent: ${intent}`);

        return {
            intent,
            message: context.message,
            history: context.history || ""
        };
    },
});


export const supportWorkflow = new Workflow({
    id: "support-triage-workflow",
    inputSchema: z.object({
        message: z.string(),
        history: z.string().optional()
    }),
    outputSchema: z.object({
        intent: z.string(),
        history: z.string(),
        message: z.string()
    }),
});

// Chainage sans mapping explicite (Auto-mapping par nom)
supportWorkflow
    .then(classifyStep);

supportWorkflow.commit();
