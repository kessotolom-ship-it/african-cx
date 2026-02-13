const http = require('http');

// Test de persistance mémoire : envoie un 2ème message avec le même threadId
// L'agent devrait se souvenir du contexte de la 1ère conversation
const threadId = '6373cd27-be2e-4bd7-a6bc-061a51786926';

const data = JSON.stringify({
    messages: [
        { role: 'user', content: "Je veux payer ma facture d'électricité" },
        { role: 'assistant', content: "Pour vous aider avec votre paiement de facture..." },
        { role: 'user', content: "C'est quel numéro pour vérifier mon solde?" }
    ],
    threadId: threadId // Réutilise le même thread
});

const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`X-Thread-Id: ${res.headers['x-thread-id'] || 'N/A'}`);
    console.log(`X-Agent-Intent: ${res.headers['x-agent-intent'] || 'N/A'}`);
    res.setEncoding('utf8');
    let body = '';

    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('\n--- REPONSE COMPLETE ---');
        console.log(body);
        console.log('\n--- Thread réutilisé: ' + threadId + ' ---');
    });
});

req.on('error', (e) => {
    console.error(`Erreur: ${e.message}`);
});

req.write(data);
req.end();
