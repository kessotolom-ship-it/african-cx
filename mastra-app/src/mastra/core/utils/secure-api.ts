
import { NextResponse } from 'next/server';

/**
 * STANDARD API CLIENT
 * Wrapper sécurisé pour appeler l'API interne Solimi
 */
export async function secureApiClient(endpoint: string, method: string = 'GET', body?: any) {
    const apiKey = process.env.SOLIMI_INTERNAL_API_KEY;

    if (!apiKey) {
        console.error("CRITICAL: SOLIMI_INTERNAL_API_KEY is missing in environment variables.");
        throw new Error("Configuration Erreur: Clé API manquante.");
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey, // Authentification standardisée
        'x-agent-id': 'mastra-support-bot', // Traçabilité
    };

    try {
        // Dans un vrai contexte, ceci appellerait https://api.solimi.net/v1/...
        // Ici on simule pour le MVP local
        console.log(`[SECURE API CALL] ${method} ${endpoint}`, body ? JSON.stringify(body) : '');

        // Simulation de latence réseau
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulation de réponse
        return { ok: true, data: { status: 'success', ticket_id: `TKT-${Math.floor(Math.random() * 10000)}` } };

    } catch (error) {
        console.error(`[SECURE API ERROR] ${endpoint}`, error);
        throw error;
    }
}
