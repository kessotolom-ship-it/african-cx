/**
 * Test de persistance mémoire — Envoie 2 messages sur le même thread
 * Usage: node scripts/test-memory-persistence.js
 */

const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:3000';

async function sendMessage(message, threadId = null) {
    const payload = {
        messages: [{ role: 'user', content: message }],
    };
    if (threadId) payload.threadId = threadId;

    const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const body = await res.text();
    return {
        status: res.status,
        threadId: res.headers.get('x-thread-id'),
        agent: res.headers.get('x-agent-intent'),
        body,
    };
}

async function main() {
    console.log('=== TEST MÉMOIRE PERSISTANTE ===\n');

    // Tour 1
    console.log('[Tour 1] "Je veux payer ma facture d\'électricité"');
    const r1 = await sendMessage("Je veux payer ma facture d'électricité");
    console.log(`  Status: ${r1.status} | Agent: ${r1.agent} | Thread: ${r1.threadId}`);
    console.log(`  Réponse: ${r1.body.substring(0, 120)}...\n`);

    // Tour 2 — même thread
    console.log('[Tour 2] "C\'est quel numéro pour vérifier mon solde?" (même thread)');
    const r2 = await sendMessage("C'est quel numéro pour vérifier mon solde?", r1.threadId);
    console.log(`  Status: ${r2.status} | Agent: ${r2.agent} | Thread: ${r2.threadId}`);
    console.log(`  Réponse: ${r2.body.substring(0, 120)}...\n`);

    console.log(`=== Thread réutilisé: ${r1.threadId} ===`);
}

main().catch(console.error);
