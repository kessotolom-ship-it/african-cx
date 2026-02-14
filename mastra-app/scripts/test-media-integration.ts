/**
 * Test d'intégration locale pour le processeur média (Audio/Image)
 * Usage: npx tsx scripts/test-media-integration.ts
 * 
 * Ce script simule le téléchargement et l'analyse de médias :
 * 1. Télécharge une image de test publique
 * 2. Télécharge un audio de test public
 * 3. Appelle les fonctions de media-processor.ts (si OPENAI_API_KEY est présent)
 */

import { analyzeImage, transcribeAudio, downloadMediaFromUrl } from '../src/mastra/core/integrations/media-processor';
import * as fs from 'fs';
import * as path from 'path';

// URL de test
const TEST_IMAGE_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/640px-Image_created_with_a_mobile_phone.png';
const TEST_AUDIO_URL = 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg'; // Petit fichier OGG

async function main() {
    console.log('=== TEST MEDIA INTEGRATION ===\n');

    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  OPENAI_API_KEY manquant. Le test va échouer sur les appels API.');
        console.warn('ℹ️  Set OPENAI_API_KEY dans votre terminal avant de lancer.\n');
        // On continue juste pour tester le download
    }

    // ─── 1. Test Image ──────────────────────────────────
    console.log(`[1] Test Image Download: ${TEST_IMAGE_URL}`);
    const image = await downloadMediaFromUrl(TEST_IMAGE_URL);

    if (image) {
        console.log(`✅ Image téléchargée: ${image.fileName} (${image.mimeType}, ${image.buffer.length} bytes)`);

        if (process.env.OPENAI_API_KEY) {
            console.log('🔍 Analyse vision en cours...');
            try {
                const result = await analyzeImage(image.buffer, image.mimeType);
                console.log('✅ Résultat Vision:', result);
            } catch (e: any) {
                console.error('❌ Erreur Vision:', e.message);
            }
        } else {
            console.log('⏩ Vision skipped (no API key)');
        }
    } else {
        console.error('❌ Echec téléchargement image');
    }

    console.log('\n-----------------------------------\n');

    // ─── 2. Test Audio ──────────────────────────────────
    console.log(`[2] Test Audio Download: ${TEST_AUDIO_URL}`);
    const audio = await downloadMediaFromUrl(TEST_AUDIO_URL);

    if (audio) {
        console.log(`✅ Audio téléchargé: ${audio.fileName} (${audio.mimeType}, ${audio.buffer.length} bytes)`);

        if (process.env.OPENAI_API_KEY) {
            console.log('🎙️ Transcription Whisper en cours...');
            try {
                const result = await transcribeAudio(audio.buffer, audio.mimeType);
                console.log('✅ Résultat Whisper:', result);
            } catch (e: any) {
                console.error('❌ Erreur Whisper:', e.message);
            }
        } else {
            console.log('⏩ Whisper skipped (no API key)');
        }
    } else {
        console.error('❌ Echec téléchargement audio');
    }
}

main().catch(console.error);
