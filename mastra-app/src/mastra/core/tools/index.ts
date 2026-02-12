
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

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
        // Dans le futur, ceci appellera l'API Solimi réelle via fetch()
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
        // Simule un utilisateur non vérifié par défaut sauf si numéro spécial
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
        // Dans une vraie implémentation, on appellerait mastra.workflows.refundWorkflow.execute()
        // Mais ici, l'agent ne connaît pas l'instance Mastra.
        // On va simuler ou appeler une fonction statique si possible.

        console.log(`[Tool] Triggering Refund Workflow for ${transaction_id}`);

        // MOCK : On simule l'exécution du workflow ici pour simplifier l'exemple sans dépendance circulaire
        // Idéalement, cet outil ferait un appel API interne vers /api/workflows/refund/execute

        if (transaction_id.startsWith("ERR")) {
            return { result: "Processus de remboursement lancé. Ticket #REF-1234 créé. Vous recevrez un SMS sous 24h.", workflow_id: "wk-1234" };
        }

        return { result: "Impossible de lancer le remboursement. La transaction semble valide ou en attente.", workflow_id: undefined };
    }
});
