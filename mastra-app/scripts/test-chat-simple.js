const http = require('http');

const data = JSON.stringify({
    messages: [{ role: 'user', content: "Je veux payer ma facture d'électricité" }]
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

    // Simulate streaming read logic similar to fetch reader
    res.on('data', (chunk) => {
        // console.log(`CHUNK: ${chunk.length} bytes`);
        process.stdout.write(`RAW CHUNK: ${chunk.substring(0, 50).replace(/\n/g, '\\n')}...\n`);
        body += chunk;
    });

    res.on('end', () => {
        console.log('BODY END');
        console.log("Full Body Length:", body.length);
        console.log(body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(data);
req.end();
