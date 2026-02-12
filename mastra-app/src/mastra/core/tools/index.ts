
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import pg from "pg";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Pool unique pour les outils (évite de réouvrir à chaque requête)
let pool: pg.Pool | null = null;

function getPool() {
    if (!pool) {
        if (!process.env.POSTGRES_URL) {
            console.warn("POSTGRES_URL missing, RAG search will fail silently.");
            return null;
        }
        pool = new pg.Pool({
            connectionString: process.env.POSTGRES_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }
    return pool;
}

// --- Outil Universel : Date & Heure Locale (Politesse) ---
export const dateTimeTool = createTool({
    id: "get_current_time",
    description: "Get the current date and time to greet the user correctly (Bonjour vs Bonsoir). always use this for the first message.",
    inputSchema: z.object({}),
    outputSchema: z.object({
        current_time: z.string(),
        greeting_suggestion: z.string()
    }),
    execute: async () => {
        const now = new Date();
        const hour = now.getHours();
        const greeting = hour < 12 ? "Bonjour" : "Bonsoir";
        return {
            current_time: now.toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' }), // GMT
            greeting_suggestion: greeting
        };
    }
});

// --- Outil Fintech (Standard) : Vérifier Transaction ---
export const transactionStatusTool = createTool({
    id: "check_transaction_status",
    description: "Check the status of a Mobile Money transaction (T-Money, Flooz, Wave) using its Reference ID.",
    inputSchema: z.object({
        reference_id: z.string().describe("The transaction ID given by the operator (e.g. 235689)"),
        provider: z.string().optional().describe("The provider name (T-Money, Flooz)")
    }),
    outputSchema: z.object({
        status: z.enum(['SUCCESS', 'PENDING', 'FAILED', 'NOT_FOUND']),
        amount: z.string().optional(),
        message: z.string()
    }),
    execute: async ({ reference_id }) => {
        // MOCK : Simulation d'appel API
        const ref = reference_id;

        console.log(`Checking transaction ${ref}...`);

        if (ref.startsWith("ERR")) {
            return { status: 'FAILED', message: "Transaction échouée chez l'opérateur. Remboursement auto en cours." };
        }
        if (ref.startsWith("PEN")) {
            return { status: 'PENDING', message: "Transaction en attente de confirmation réseau." };
        }

        return {
            status: 'SUCCESS',
            amount: '5000 FCFA',
            message: "Transaction validée. L'argent est sur le compte."
        };
    }
});

// --- Outil Conformité (Standard) : Check KYC Status ---
export const kycCheckTool = createTool({
    id: "check_kyc_status",
    description: "Check if the user has validated their Identity (KYC).",
    inputSchema: z.object({
        phone_number: z.string()
    }),
    outputSchema: z.object({
        is_verified: z.boolean(),
        missing_documents: z.array(z.string())
    }),
    execute: async ({ phone_number }) => {
        // MOCK
        const isVerified = phone_number.endsWith("00");
        return {
            is_verified: isVerified,
            missing_documents: isVerified ? [] : ["CNI Recto/Verso", "Selfie"]
        };
    }
});

// --- Outil Workflow : Lancer un Remboursement ---
export const startRefundTool = createTool({
    id: "start_refund_process",
    description: "Launch the official refund process if a transaction failed. Returns a Ticket ID if successful.",
    inputSchema: z.object({
        transaction_id: z.string().describe("The failed transaction ID"),
        user_phone: z.string().describe("User phone number for notification")
    }),
    outputSchema: z.object({
        result: z.string(),
        workflow_id: z.string().optional()
    }),
    execute: async ({ transaction_id, user_phone }) => {
        console.log(`[Tool] Triggering Refund Workflow for ${transaction_id}`);

        if (transaction_id.startsWith("ERR")) {
            return { result: "Processus de remboursement lancé. Ticket #REF-1234 créé. Vous recevrez un SMS sous 24h.", workflow_id: "wk-1234" };
        }

        return { result: "Impossible de lancer le remboursement. La transaction semble valide ou en attente.", workflow_id: undefined };
    }
});

// --- Outil RAG : Recherche dans la Documentation ---
export const searchDocsTool = createTool({
    id: "search_documentation",
    description: "Search for official Solimi documentation (How-to, FAQ, Pricing, Limits) to answer user questions precisely. Use this tool whenever the user asks 'How to...', 'What is...', or 'Can I...'.",
    inputSchema: z.object({
        query: z.string().describe("The search query keywords")
    }),
    outputSchema: z.object({
        answer_context: z.string()
    }),
    execute: async ({ query }) => {
        const client = getPool();
        if (!client) return { answer_context: "Désolé, ma base de connaissances est inaccessible pour le moment." };

        try {
            // 1. Vectoriser
            const embeddingRes = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: query.substring(0, 8000),
            });
            const vector = embeddingRes.data[0].embedding;

            // 2. Chercher (Limité à 3 chunks pertinents)
            const result = await client.query(
                `SELECT content, url, (embedding <=> $1) as distance 
                 FROM documents 
                 ORDER BY distance ASC 
                 LIMIT 3`,
                [JSON.stringify(vector)]
            );

            if (result.rows.length === 0) {
                return { answer_context: "Aucune information trouvée dans la documentation officielle sur ce sujet." };
            }

            // 3. Formater
            const context = result.rows.map((row: any) =>
                `[Source: ${row.url}]\n${row.content}`
            ).join("\n\n---\n\n");

            return { answer_context: context };

        } catch (error: any) {
            console.error("RAG Tool Error:", error);
            // On ne plante pas l'agent, on dit juste qu'on ne sait pas
            if (error.message && error.message.includes("does not exist")) {
                return { answer_context: "La base de connaissances n'est pas encore initialisée." };
            }
            return { answer_context: "Erreur technique lors de la recherche documentaire." };
        }
    }
});
