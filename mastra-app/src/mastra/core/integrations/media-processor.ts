/**
 * ============================================================
 *  Processeur Multimédia — Voix (Whisper) + Vision (GPT-4o)
 * ============================================================
 *
 *  Ce module gère la transcription audio et l'analyse d'images
 *  pour le chatbot WhatsApp. Il utilise les APIs OpenAI :
 *
 *    🎤 Whisper  → Transcription audio (notes vocales)
 *    🖼️ GPT-4o   → Analyse d'images (reçus, documents, CNI)
 *
 *  Variable d'environnement requise :
 *    - OPENAI_API_KEY
 * ============================================================
 */

import OpenAI from 'openai';

// ─── Client OpenAI ──────────────────────────────────────

function getOpenAI(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set');
    }
    return new OpenAI({ apiKey });
}

// ─── Types ──────────────────────────────────────────────

export interface TranscriptionResult {
    text: string;
    language?: string;
    duration?: number;
}

export interface VisionResult {
    description: string;
    /** Type détecté : receipt, id_card, screenshot, document, photo, unknown */
    detectedType: string;
}

export interface MediaDownloadResult {
    buffer: Buffer;
    mimeType: string;
    fileName: string;
}

// ─── Téléchargement de médias ───────────────────────────

/**
 * Télécharge un fichier média depuis une URL (Evolution API ou WhatsApp CDN)
 * Evolution API expose les médias via son endpoint de téléchargement
 */
export async function downloadMediaFromEvolution(
    messageId: string,
    instanceName: string
): Promise<MediaDownloadResult | null> {
    const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!baseUrl || !apiKey) {
        console.error('[MEDIA] Missing Evolution API config for media download');
        return null;
    }

    try {
        // Evolution API v2 : GET /chat/getBase64FromMediaMessage/{instance}
        const response = await fetch(
            `${baseUrl}/chat/getBase64FromMediaMessage/${instanceName}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey,
                },
                body: JSON.stringify({
                    message: { key: { id: messageId } },
                    convertToMp4: false,
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[MEDIA] Download failed: ${response.status} — ${errorText}`);
            return null;
        }

        const data = await response.json();

        if (!data.base64) {
            console.error('[MEDIA] No base64 data in response');
            return null;
        }

        const buffer = Buffer.from(data.base64, 'base64');
        return {
            buffer,
            mimeType: data.mimetype || 'application/octet-stream',
            fileName: data.fileName || `media_${messageId}`,
        };
    } catch (error) {
        console.error('[MEDIA] Download error:', error);
        return null;
    }
}

/**
 * Télécharge un média directement depuis une URL publique
 */
export async function downloadMediaFromUrl(url: string): Promise<MediaDownloadResult | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`[MEDIA] URL download failed: ${response.status}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'application/octet-stream';

        return {
            buffer,
            mimeType,
            fileName: `media_${Date.now()}`,
        };
    } catch (error) {
        console.error('[MEDIA] URL download error:', error);
        return null;
    }
}

// ─── 🎤 WHISPER — Transcription Audio ───────────────────

/**
 * Transcrit un message audio en texte via OpenAI Whisper
 * 
 * Langues supportées : français, anglais, arabe, wolof, bambara, etc.
 * Whisper détecte automatiquement la langue.
 * 
 * @param audioBuffer - Buffer contenant l'audio (ogg, mp3, m4a, wav, webm)
 * @param mimeType - Type MIME de l'audio
 * @returns Texte transcrit + langue détectée
 */
export async function transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string = 'audio/ogg'
): Promise<TranscriptionResult> {
    const openai = getOpenAI();

    // Déterminer l'extension depuis le mime type
    const extMap: Record<string, string> = {
        'audio/ogg': 'ogg',
        'audio/ogg; codecs=opus': 'ogg',
        'audio/mpeg': 'mp3',
        'audio/mp4': 'm4a',
        'audio/x-m4a': 'm4a',
        'audio/wav': 'wav',
        'audio/webm': 'webm',
        'audio/amr': 'amr',
    };

    // Normaliser le mimeType (enlever les paramètres après ;)
    const baseMime = mimeType.split(';')[0].trim();
    const ext = extMap[baseMime] || 'ogg';

    console.log(`[WHISPER] Transcription audio (${(audioBuffer.length / 1024).toFixed(1)} KB, ${baseMime})`);

    try {
        // Créer un objet compatible pour l'API OpenAI
        // Extraire un ArrayBuffer propre depuis le Buffer pour compatibilité TS stricte
        const ab = audioBuffer.buffer.slice(
            audioBuffer.byteOffset,
            audioBuffer.byteOffset + audioBuffer.byteLength
        ) as ArrayBuffer;
        const file = new File([ab], `voice.${ext}`, { type: baseMime });

        const transcription = await openai.audio.transcriptions.create({
            model: 'whisper-1',
            file: file,
            language: 'fr', // Hint français mais Whisper détecte auto
            response_format: 'verbose_json',
            prompt: 'Ce message est une note vocale WhatsApp. Le locuteur parle probablement français ou une langue africaine.',
        });

        const result: TranscriptionResult = {
            text: transcription.text || '',
            language: (transcription as any).language || 'fr',
            duration: (transcription as any).duration || undefined,
        };

        console.log(`[WHISPER] ✅ Transcrit (${result.language}, ${result.duration?.toFixed(1)}s): "${result.text.substring(0, 80)}..."`);

        return result;
    } catch (error: any) {
        console.error('[WHISPER] Transcription error:', error.message);
        throw new Error(`Whisper transcription failed: ${error.message}`);
    }
}

// ─── 🖼️ GPT-4o VISION — Analyse d'Images ───────────────

/**
 * Analyse une image via GPT-4o Vision pour le contexte fintech
 * 
 * Cas d'usage typiques :
 *  - 📸 Photo d'un reçu de transaction
 *  - 🪪 Photo d'une pièce d'identité (CNI, passeport)
 *  - 📱 Capture d'écran d'une erreur
 *  - 📄 Photo d'un document officiel
 * 
 * @param imageBuffer - Buffer contenant l'image
 * @param mimeType - Type MIME de l'image (image/jpeg, image/png, etc.)
 * @param caption - Légende optionnelle envoyée par l'utilisateur
 * @returns Description textuelle détaillée + type détecté
 */
export async function analyzeImage(
    imageBuffer: Buffer,
    mimeType: string = 'image/jpeg',
    caption?: string
): Promise<VisionResult> {
    const openai = getOpenAI();

    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    console.log(`[VISION] Analyse image (${(imageBuffer.length / 1024).toFixed(1)} KB, ${mimeType})`);

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 500,
            messages: [
                {
                    role: 'system',
                    content: `Tu es un assistant visuel pour Solimi Pay, un service de paiement mobile en Afrique de l'Ouest.

Ton rôle est d'analyser les images envoyées par les clients WhatsApp et de fournir une description précise et utile pour un agent de support.

Types d'images possibles :
- **receipt** : Reçu de transaction (extrais : montant, date, référence, statut, opérateur)
- **id_card** : Pièce d'identité (mentionne le type mais NE LIS PAS les infos personnelles pour la sécurité)
- **screenshot** : Capture d'écran d'app ou d'erreur (décris ce qu'on voit)
- **document** : Document officiel, facture, contrat
- **photo** : Autre photo

Réponds TOUJOURS en français. Sois concis mais précis.
Format ta réponse ainsi :
TYPE: [receipt|id_card|screenshot|document|photo|unknown]
DESCRIPTION: [description détaillée en 2-3 phrases]`,
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: dataUrl,
                                detail: 'low', // Économise les tokens, suffisant pour la plupart des cas
                            },
                        },
                        {
                            type: 'text',
                            text: caption
                                ? `Le client a envoyé cette image avec le message : "${caption}"`
                                : 'Le client a envoyé cette image sans message. Décris ce que tu vois.',
                        },
                    ],
                },
            ],
        });

        const content = response.choices[0]?.message?.content || '';

        // Parser le type et la description
        const typeMatch = content.match(/TYPE:\s*(\w+)/i);
        const descMatch = content.match(/DESCRIPTION:\s*([\s\S]+)/i);

        const result: VisionResult = {
            detectedType: typeMatch?.[1]?.toLowerCase() || 'unknown',
            description: descMatch?.[1]?.trim() || content.trim(),
        };

        console.log(`[VISION] ✅ Type: ${result.detectedType} — "${result.description.substring(0, 80)}..."`);

        return result;
    } catch (error: any) {
        console.error('[VISION] Analysis error:', error.message);
        throw new Error(`Vision analysis failed: ${error.message}`);
    }
}

// ─── Helpers ────────────────────────────────────────────

/**
 * Vérifie si un type MIME est un format audio supporté par Whisper
 */
export function isSupportedAudioFormat(mimeType: string): boolean {
    const supported = [
        'audio/ogg', 'audio/mpeg', 'audio/mp3', 'audio/mp4',
        'audio/x-m4a', 'audio/wav', 'audio/webm', 'audio/amr',
        'audio/aac', 'audio/flac',
    ];
    const baseMime = mimeType.split(';')[0].trim();
    return supported.includes(baseMime);
}

/**
 * Vérifie si un type MIME est un format image supporté par GPT-4o Vision
 */
export function isSupportedImageFormat(mimeType: string): boolean {
    const supported = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'image/webp', 'image/bmp',
    ];
    const baseMime = mimeType.split(';')[0].trim();
    return supported.includes(baseMime);
}

/**
 * Vérifie si le buffer est trop gros pour être traité
 * Whisper : max 25 MB
 * Vision  : max ~20 MB (recommandé < 5 MB)
 */
export function isFileTooLarge(buffer: Buffer, type: 'audio' | 'image'): boolean {
    const maxSizes = {
        audio: 25 * 1024 * 1024,  // 25 MB
        image: 20 * 1024 * 1024,  // 20 MB
    };
    return buffer.length > maxSizes[type];
}
