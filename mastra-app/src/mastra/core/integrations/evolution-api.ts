/**
 * ============================================================
 *  Client REST pour Evolution API
 * ============================================================
 *
 *  Ce module gère TOUTES les communications sortantes vers
 *  WhatsApp via l'API REST d'Evolution API.
 *
 *  Variables d'environnement requises :
 *    - EVOLUTION_API_URL    : URL de base (ex: https://evo.example.com)
 *    - EVOLUTION_API_KEY    : Clé API globale d'Evolution
 *    - EVOLUTION_INSTANCE   : Nom de l'instance WhatsApp (ex: "solimi")
 * ============================================================
 */

// ─── Types ──────────────────────────────────────────────

export interface EvolutionConfig {
    baseUrl: string;
    apiKey: string;
    instance: string;
}

export interface SendTextOptions {
    /** Numéro destinataire au format international sans "+" (ex: "2250700000000") */
    number: string;
    /** Texte du message */
    text: string;
    /** Délai d'apparition "en train d'écrire" en ms (optionnel) */
    delay?: number;
    /** Activer le preview des liens (optionnel) */
    linkPreview?: boolean;
}

export interface SendMediaOptions {
    number: string;
    mediatype: 'image' | 'video' | 'audio' | 'document';
    /** URL publique du média OU base64 */
    media: string;
    caption?: string;
    fileName?: string;
}

// ─── Payload webhook entrant (MESSAGES_UPSERT) ─────────

export interface EvolutionWebhookPayload {
    event: string;
    instance: string;
    data: {
        key: {
            remoteJid: string;
            fromMe: boolean;
            id: string;
        };
        pushName?: string;
        message?: {
            conversation?: string;
            extendedTextMessage?: {
                text: string;
            };
            imageMessage?: {
                caption?: string;
                url?: string;
                mimetype?: string;
            };
            audioMessage?: {
                url?: string;
                mimetype?: string;
                seconds?: number;
            };
            documentMessage?: {
                url?: string;
                fileName?: string;
                mimetype?: string;
            };
        };
        messageType?: string;
        messageTimestamp?: number;
    };
    destination?: string;
    date_time?: string;
    server_url?: string;
    apikey?: string;
}

// ─── Client ──────────────────────────────────────────

function getConfig(): EvolutionConfig {
    const baseUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE;

    if (!baseUrl || !apiKey || !instance) {
        throw new Error(
            'Missing Evolution API config. Set EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE in .env'
        );
    }

    return {
        baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
        apiKey,
        instance,
    };
}

/**
 * Appel générique à l'API REST d'Evolution
 */
async function evolutionFetch(
    path: string,
    method: 'GET' | 'POST' = 'POST',
    body?: Record<string, unknown>
): Promise<any> {
    const config = getConfig();
    const url = `${config.baseUrl}/${path}`;

    console.log(`[EVOLUTION] ${method} ${url}`);

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'apikey': config.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[EVOLUTION] Error ${response.status}: ${errorText}`);
        throw new Error(`Evolution API error ${response.status}: ${errorText}`);
    }

    return response.json();
}

// ─── Fonctions Publiques ─────────────────────────────

/**
 * Envoyer un message texte via WhatsApp
 */
export async function sendTextMessage(options: SendTextOptions): Promise<any> {
    const config = getConfig();
    return evolutionFetch(`message/sendText/${config.instance}`, 'POST', {
        number: options.number,
        text: options.text,
        delay: options.delay || 1200,       // Simule la frappe
        linkPreview: options.linkPreview ?? false,
    });
}

/**
 * Envoyer un média (image, audio, document) via WhatsApp
 */
export async function sendMediaMessage(options: SendMediaOptions): Promise<any> {
    const config = getConfig();
    return evolutionFetch(`message/sendMedia/${config.instance}`, 'POST', {
        number: options.number,
        mediatype: options.mediatype,
        media: options.media,
        caption: options.caption || '',
        fileName: options.fileName,
    });
}

/**
 * Marquer un message comme "lu"
 */
export async function markAsRead(remoteJid: string, messageId: string): Promise<any> {
    const config = getConfig();
    return evolutionFetch(`chat/markMessageAsRead/${config.instance}`, 'POST', {
        read_messages: [
            {
                remoteJid,
                id: messageId,
            }
        ],
    });
}

/**
 * Envoyer l'indicateur "en train d'écrire..."
 */
export async function sendPresence(remoteJid: string, presence: 'composing' | 'paused' | 'available' = 'composing'): Promise<any> {
    const config = getConfig();
    return evolutionFetch(`chat/sendPresence/${config.instance}`, 'POST', {
        number: remoteJid.replace('@s.whatsapp.net', ''),
        presence,
    });
}

/**
 * Vérifier le statut de connexion de l'instance WhatsApp
 */
export async function getConnectionStatus(): Promise<any> {
    const config = getConfig();
    return evolutionFetch(`instance/connectionState/${config.instance}`, 'GET');
}

// ─── Helpers pour parser les webhooks ────────────────

/**
 * Extraire le texte d'un message WhatsApp entrant
 */
export function extractMessageText(payload: EvolutionWebhookPayload): string | null {
    const msg = payload.data?.message;
    if (!msg) return null;

    // Message texte simple
    if (msg.conversation) return msg.conversation;

    // Message texte étendu (avec quote, lien, etc.)
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;

    // Image avec légende
    if (msg.imageMessage?.caption) return msg.imageMessage.caption;

    return null;
}

/**
 * Extraire le numéro de téléphone propre du remoteJid
 * "22507000000@s.whatsapp.net" → "22507000000"
 */
export function extractPhoneNumber(remoteJid: string): string {
    return remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
}

/**
 * Vérifie si le message est un message de groupe
 */
export function isGroupMessage(remoteJid: string): boolean {
    return remoteJid.endsWith('@g.us');
}

/**
 * Vérifie si c'est un message audio (note vocale)
 */
export function isAudioMessage(payload: EvolutionWebhookPayload): boolean {
    return payload.data?.messageType === 'audioMessage' ||
        !!payload.data?.message?.audioMessage;
}
