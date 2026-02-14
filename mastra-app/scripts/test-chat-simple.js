/**
 * Test simple — Envoie un message et affiche la réponse
 * Usage: node scripts/test-chat-simple.js
 */

const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:3000';

async function main() {
    const message = "Je veux payer ma facture d'électricité";
    console.log(`Envoi: "${message}"`);
    console.log(`URL: ${BASE_URL}/api/chat\n`);

    const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{ role: 'user', content: message }],
        }),
    });

    console.log(`STATUS: ${res.status}`);
    console.log(`X-Thread-Id: ${res.headers.get('x-thread-id') || 'N/A'}`);
    console.log(`X-Agent-Intent: ${res.headers.get('x-agent-intent') || 'N/A'}`);

    const body = await res.text();
    console.log('\n--- REPONSE ---');
    console.log(body);
}

main().catch(console.error);
