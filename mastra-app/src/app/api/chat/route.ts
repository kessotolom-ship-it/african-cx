import { mastra } from '../../../mastra/index';
import { supportWorkflow } from '../../../mastra/workflows/index';
import { randomUUID } from 'crypto';
import { transcribeAudio, analyzeImage, isSupportedAudioFormat, isSupportedImageFormat } from '../../../mastra/core/integrations/media-processor';

export const maxDuration = 60; // Augmenté pour le traitement média

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, threadId: clientThreadId, attachment } = body;
        let lastUserMessage = messages[messages.length - 1].content;

        // Gestion du threadId pour la persistance
        const threadId = clientThreadId || randomUUID();
        const resourceId = 'solimi-user-sim';

        // ── TRAITEMENT MÉDIA (AUDIO/IMAGE) ──
        if (attachment && attachment.base64 && attachment.mimeType) {
            const buffer = Buffer.from(attachment.base64, 'base64');
            const mimeType = attachment.mimeType;

            console.log(`[MEDIA] Réception attachment de type ${mimeType}`);

            if (isSupportedAudioFormat(mimeType)) {
                // Audio -> Whisper
                const result = await transcribeAudio(buffer, mimeType);
                lastUserMessage = `[AUDIO TRANSCRIT] ${result.text}`;
                console.log(`[MEDIA] Audio transcrit: "${result.text}"`);

            } else if (isSupportedImageFormat(mimeType)) {
                // Image -> GPT-4o Vision
                const result = await analyzeImage(buffer, mimeType, lastUserMessage);
                lastUserMessage = `[IMAGE ANALYSÉE]
Type: ${result.detectedType}
Description: ${result.description}
--
Message utilisateur accompagnant l'image: "${lastUserMessage}"`;
                console.log(`[MEDIA] Image analysée (${result.detectedType})`);
            } else {
                console.warn(`[MEDIA] Format non supporté: ${mimeType}`);
            }
        }

        // Met à jour le contenu du dernier message pour le workflow et l'agent
        // Note: On ne modifie pas l'objet `messages` original pour ne pas casser l'UI stream, 
        // mais l'agent recevra ce nouveau texte enrichi.

        // Construction de l'historique (pour le workflow de triage)
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
        const streamResult = await specialistAgent.stream(lastUserMessage, {
            threadId,
            resourceId,
        });

        // On retourne le flux textuel
        return new Response(
            streamResult.textStream.pipeThrough(new TextEncoderStream()),
            {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Agent-Intent': intent,
                    'X-Thread-Id': threadId,
                }
            }
        );

    } catch (error: any) {
        console.error("Mastra & Streaming Error:", error);
        return new Response(`Erreur: ${error.message}`, { status: 500 });
    }
}
