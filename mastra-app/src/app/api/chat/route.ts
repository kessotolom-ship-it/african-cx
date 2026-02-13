import { mastra } from '../../../mastra/index';
import { supportWorkflow } from '../../../mastra/workflows/index';
import { randomUUID } from 'crypto';

export const maxDuration = 30; // Pour Vercel

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, threadId: clientThreadId } = body;
        const lastUserMessage = messages[messages.length - 1].content;

        // Gestion du threadId pour la persistance
        const threadId = clientThreadId || randomUUID();
        const resourceId = 'solimi-user'; // TODO: Remplacer par l'ID utilisateur réel

        // Construction de l'historique brut (pour le workflow de triage uniquement)
        const history = messages.slice(-5).map((m: any) =>
            `${m.role === 'user' ? 'Client' : 'Toi'}: ${m.content}`
        ).join('\n\n');

        console.log(`[WORKFLOW] Triage pour: "${lastUserMessage.substring(0, 50)}..." (thread: ${threadId})`);

        // 1. EXECUTION DU WORKFLOW DE CLASSIFICATION
        const run = await supportWorkflow.createRun();
        const runResult = await run.start({
            inputData: {
                message: lastUserMessage,
                history: history
            }
        });

        // 2. RECUPERATION DE L'INTENTION
        if (runResult.status !== 'success') {
            throw new Error("Workflow classification failed. Status: " + runResult.status);
        }

        const output = (runResult.result || (runResult.steps as any)?.['classify-intent']?.output) as { intent: string };

        if (!output || !output.intent) {
            console.error("Workflow Output Error:", JSON.stringify(runResult, null, 2));
            throw new Error("No intent returned from workflow.");
        }

        const { intent } = output;
        console.log(`[STREAMING] Agent spécialiste: ${intent} (thread: ${threadId})`);

        const specialistAgent = mastra.getAgent(intent);
        if (!specialistAgent) {
            throw new Error(`Agent ${intent} not found.`);
        }

        // 3. GENERATION EN STREAMING AVEC MEMOIRE PERSISTANTE
        // Quand on passe threadId + resourceId, Mastra Memory:
        //   - Crée le thread s'il n'existe pas
        //   - Sauvegarde le message utilisateur
        //   - Charge l'historique des messages précédents
        //   - Sauvegarde la réponse de l'assistant
        const streamResult = await specialistAgent.stream(lastUserMessage, {
            threadId,
            resourceId,
        });

        // On retourne le flux textuel, encodé en bytes pour la Response standard
        return new Response(
            streamResult.textStream.pipeThrough(new TextEncoderStream()),
            {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Agent-Intent': intent,
                    'X-Thread-Id': threadId, // Le frontend pourra lire ce header
                }
            }
        );

    } catch (error: any) {
        console.error("Mastra & Streaming Error:", error);
        return new Response(`Erreur: ${error.message}`, { status: 500 });
    }
}
