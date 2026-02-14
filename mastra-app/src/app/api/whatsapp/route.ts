/**
 * ============================================================
 *  WEBHOOK WhatsApp — Evolution API → Mastra Agent
 * ============================================================
 *
 *  Ce endpoint reçoit les webhooks d'Evolution API, traite
 *  le message via notre pipeline Mastra (Triage → Agent),
 *  puis renvoie la réponse au client sur WhatsApp.
 *
 *  Flux :
 *    1. Evolution API envoie un POST avec le message WhatsApp
 *    2. On vérifie l'authenticité (apikey)
 *    3. On extrait le texte du message
 *    4. On passe par le workflow de triage
 *    5. L'agent spécialiste génère la réponse
 *    6. On envoie la réponse via l'API REST d'Evolution
 *
 *  URL : https://african-cx.vercel.app/api/whatsapp
 * ============================================================
 */

import { NextResponse } from 'next/server';
import { mastra } from '../../../mastra/index';
import { supportWorkflow } from '../../../mastra/workflows/index';
import {
    sendTextMessage,
    sendPresence,
    markAsRead,
    extractMessageText,
    extractPhoneNumber,
    isGroupMessage,
    isAudioMessage,
    type EvolutionWebhookPayload,
} from '../../../mastra/core/integrations/evolution-api';

export const maxDuration = 30; // Vercel timeout

// ─── Vérification du secret webhook ──────────────────

function isAuthorized(req: Request, payload: EvolutionWebhookPayload): boolean {
    // Méthode 1 : Header apikey
    const headerKey = req.headers.get('apikey');
    if (headerKey && headerKey === process.env.EVOLUTION_WEBHOOK_SECRET) {
        return true;
    }

    // Méthode 2 : apikey dans le payload (Evolution API l'envoie si configuré)
    if (payload.apikey && payload.apikey === process.env.EVOLUTION_WEBHOOK_SECRET) {
        return true;
    }

    // Méthode 3 : Pas de secret configuré = accepter tout (dev mode)
    if (!process.env.EVOLUTION_WEBHOOK_SECRET) {
        console.warn('[WEBHOOK] No EVOLUTION_WEBHOOK_SECRET set — accepting all requests (DEV MODE)');
        return true;
    }

    return false;
}

// ─── POST Handler ────────────────────────────────────

export async function POST(req: Request) {
    try {
        const payload: EvolutionWebhookPayload = await req.json();

        // Log basique pour debug
        console.log(`[WEBHOOK] Event: ${payload.event} | Instance: ${payload.instance}`);

        // ── 1. Filtrer les événements non pertinents ─────
        if (payload.event !== 'messages.upsert') {
            // On ignore les autres événements (connection.update, qrcode, etc.)
            return NextResponse.json({ status: 'ignored', event: payload.event });
        }

        // ── 2. Ignorer les messages envoyés par nous-mêmes ──
        if (payload.data?.key?.fromMe) {
            return NextResponse.json({ status: 'ignored', reason: 'fromMe' });
        }

        // ── 3. Ignorer les messages de groupe (optionnel) ───
        const remoteJid = payload.data?.key?.remoteJid || '';
        if (isGroupMessage(remoteJid)) {
            console.log(`[WEBHOOK] Ignored group message from ${remoteJid}`);
            return NextResponse.json({ status: 'ignored', reason: 'group' });
        }

        // ── 4. Vérifier l'authentification ──────────────
        if (!isAuthorized(req, payload)) {
            console.warn('[WEBHOOK] Unauthorized request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ── 5. Extraire le contenu du message ───────────
        const messageText = extractMessageText(payload);
        const senderPhone = extractPhoneNumber(remoteJid);
        const senderName = payload.data?.pushName || 'Client';
        const messageId = payload.data?.key?.id || '';

        // Gérer les messages audio (future intégration Whisper)
        if (isAudioMessage(payload)) {
            await sendTextMessage({
                number: senderPhone,
                text: "🎤 Désolé, je ne peux pas encore traiter les messages vocaux. Pouvez-vous écrire votre message ? Merci !",
            });
            return NextResponse.json({ status: 'audio_not_supported' });
        }

        // Pas de texte exploitable
        if (!messageText || messageText.trim().length === 0) {
            console.log(`[WEBHOOK] Empty message from ${senderPhone}`);
            return NextResponse.json({ status: 'ignored', reason: 'empty' });
        }

        console.log(`[WEBHOOK] 📩 Message de ${senderName} (${senderPhone}): "${messageText.substring(0, 80)}..."`);

        // ── 6. Marquer comme lu + indicateur "écrit..." ─
        try {
            await markAsRead(remoteJid, messageId);
            await sendPresence(remoteJid, 'composing');
        } catch (e) {
            // Non bloquant — on continue même si ça échoue
            console.warn('[WEBHOOK] Presence/Read failed:', e);
        }

        // ── 7. Workflow de Triage ───────────────────────
        const run = await supportWorkflow.createRun();
        const runResult = await run.start({
            inputData: {
                message: messageText,
                history: '', // Pas d'historique frontend pour WhatsApp — la mémoire Mastra gère
            }
        });

        if (runResult.status !== 'success') {
            throw new Error('Workflow classification failed: ' + runResult.status);
        }

        const output = (runResult.result || (runResult.steps as any)?.['classify-intent']?.output) as { intent: string };
        if (!output?.intent) {
            throw new Error('No intent returned from workflow');
        }

        const { intent } = output;
        console.log(`[WEBHOOK] 🎯 Intent: ${intent} pour ${senderName}`);

        // ── 8. Agent Spécialiste ────────────────────────
        const agent = mastra.getAgent(intent);
        if (!agent) {
            throw new Error(`Agent "${intent}" not found`);
        }

        // ThreadId basé sur le numéro — chaque utilisateur WhatsApp a un thread unique
        const threadId = `wa-${senderPhone}`;
        const resourceId = `whatsapp-${senderPhone}`;

        // Générer la réponse (non-streaming, on a besoin du texte complet)
        const response = await agent.generate(messageText, {
            threadId,
            resourceId,
        });

        const agentReply = typeof response.text === 'string'
            ? response.text
            : String(response.text);

        console.log(`[WEBHOOK] 📤 Réponse (${agentReply.length} chars) → ${senderPhone}`);

        // ── 9. Envoyer la réponse sur WhatsApp ──────────
        // Découper si le message est trop long (WhatsApp limite ~4096 chars)
        const MAX_WA_LENGTH = 4000;
        const chunks = splitMessage(agentReply, MAX_WA_LENGTH);

        for (const chunk of chunks) {
            await sendTextMessage({
                number: senderPhone,
                text: chunk,
                delay: 800, // Petit délai naturel entre les messages
            });
        }

        // Indicateur "disponible" après avoir envoyé
        try {
            await sendPresence(remoteJid, 'available');
        } catch (e) {
            // Non bloquant
        }

        return NextResponse.json({
            status: 'sent',
            intent,
            sender: senderPhone,
            responseLength: agentReply.length,
            chunks: chunks.length,
        });

    } catch (error: any) {
        console.error('[WEBHOOK] Error:', error);

        // Tenter de notifier l'utilisateur de l'erreur
        try {
            const payload: EvolutionWebhookPayload = await req.clone().json();
            const phone = extractPhoneNumber(payload.data?.key?.remoteJid || '');
            if (phone) {
                await sendTextMessage({
                    number: phone,
                    text: "⚠️ Désolé, une erreur technique est survenue. Veuillez réessayer dans quelques instants.",
                });
            }
        } catch (notifyError) {
            // Double erreur — on log mais on ne crash pas
            console.error('[WEBHOOK] Failed to send error notification:', notifyError);
        }

        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}

// ─── GET Handler (Health Check) ──────────────────────

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'African-CX WhatsApp Webhook',
        timestamp: new Date().toISOString(),
        configured: !!(
            process.env.EVOLUTION_API_URL &&
            process.env.EVOLUTION_API_KEY &&
            process.env.EVOLUTION_INSTANCE
        ),
    });
}

// ─── Utilitaires ─────────────────────────────────────

/**
 * Découpe un long message en morceaux de taille maximale
 * en essayant de couper aux sauts de ligne ou aux phrases
 */
function splitMessage(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining);
            break;
        }

        // Chercher le meilleur point de coupure
        let cutIndex = maxLength;

        // Priorité 1 : double saut de ligne
        const doubleNewline = remaining.lastIndexOf('\n\n', maxLength);
        if (doubleNewline > maxLength * 0.5) {
            cutIndex = doubleNewline + 2;
        } else {
            // Priorité 2 : simple saut de ligne
            const singleNewline = remaining.lastIndexOf('\n', maxLength);
            if (singleNewline > maxLength * 0.5) {
                cutIndex = singleNewline + 1;
            } else {
                // Priorité 3 : point + espace
                const sentence = remaining.lastIndexOf('. ', maxLength);
                if (sentence > maxLength * 0.5) {
                    cutIndex = sentence + 2;
                }
            }
        }

        chunks.push(remaining.substring(0, cutIndex).trim());
        remaining = remaining.substring(cutIndex).trim();
    }

    return chunks;
}
