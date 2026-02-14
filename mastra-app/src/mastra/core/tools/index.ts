
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import pg from "pg";
import OpenAI from "openai";
import { secureApiClient } from "../utils/secure-api";

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
            return { status: 'FAILED', message: "Transaction échouée chez l'opérateur. Remboursement auto en cours.", amount: undefined };
        }
        if (ref.startsWith("PEN")) {
            return { status: 'PENDING', message: "Transaction en attente de confirmation réseau.", amount: undefined };
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

// --- Outil Workflow : Ouvrir un contentieux (Pas de remboursement direct) ---
export const logDisputeTool = createTool({
    id: "log_dispute_ticket",
    description: "Open a dispute/complaint ticket for a failed transaction. NEVER say the refund is done. Say the request is logged for human review.",
    inputSchema: z.object({
        transaction_id: z.string().describe("The failed transaction ID"),
        user_phone: z.string().describe("User phone number"),
        issue_details: z.string().describe("Details of the issue (e.g. 'Money debited but not received')")
    }),
    outputSchema: z.object({
        ticket_id: z.string(),
        status: z.string(),
        message: z.string()
    }),
    execute: async ({ transaction_id, user_phone, issue_details }) => {
        console.log(`[Tool] Logging dispute for ${transaction_id}`);

        try {
            // Appel API Sécurisé Standardisé
            await secureApiClient('/api/tickets/create', 'POST', {
                transaction_id,
                user_phone,
                issue_details,
                source: 'MASTRA_AGENT'
            });

            // MOCK ID pour la démo
            const ticketId = `TKT-${Math.floor(Math.random() * 100000)}`;

            return {
                ticket_id: ticketId,
                status: 'OPEN',
                message: `Dossier de réclamation #${ticketId} ouvert. Un agent humain va vérifier les preuves sous 24h.`
            };
        } catch (error) {
            return {
                ticket_id: 'ERR',
                status: 'ERROR',
                message: "Impossible de créer le ticket pour le moment. Veuillez contacter le support par téléphone."
            };
        }
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

/**
 * Outil CRM Simulé (Niveau 2 - Escalade)
 * En production, remplacer les console.log par des appels axios vers Zendesk/Salesforce/HubSpot.
 */
export const crmTool = createTool({
    id: 'create-crm-ticket',
    description: 'Crée un ticket de support dans le CRM (Zendesk) pour escalader une conversation vers un agent humain.',
    inputSchema: z.object({
        subject: z.string().describe('Le sujet court du ticket (ex: "Erreur paiement Mobile Money")'),
        description: z.string().describe('Le résumé complet du problème et l\'historique pertinent de la conversation.'),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).describe('La priorité jugée par l\'IA.'),
        category: z.enum(['billing', 'technical', 'fraud', 'general']).describe('La catégorie du ticket.'),
        customerSentiment: z.string().describe('Sentiment détecté (ex: "Angry", "Confused", "Neutral").'),
    }),
    execute: async ({ subject, priority, customerSentiment, description }) => {
        console.log('--- 🎫 CRM TICKET CRÉATION ---');
        console.log('Sujet:', subject);
        console.log('Priorité:', priority);
        console.log('Sentiment:', customerSentiment);
        console.log('Description:', description.substring(0, 50) + '...');

        // Simulation d'appel API (Latence réseau)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Générer un faux ID de ticket
        const ticketId = `TICKET-${Math.floor(Math.random() * 10000)}`;

        console.log(`✅ Ticket créé avec succès: ${ticketId}`);
        console.log('------------------------------');

        return {
            success: true,
            ticketId: ticketId,
            message: `Le ticket de support ${ticketId} a été créé pour l'équipe humaine.`,
            estimatedWaitTime: '2 heures'
        };
    },
});
