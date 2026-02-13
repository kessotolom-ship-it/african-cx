
async function testFrontendFetch() {
    try {
        console.log("Testing fetch API compatibility...");
        const response = await fetch('http://127.0.0.1:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: "Je veux payer ma facture d'électricité" }]
            })
        });

        if (!response.ok) {
            console.error("Response not OK:", response.status, response.statusText);
            return;
        }

        if (!response.body) {
            console.error("No response body");
            return;
        }

        console.log("Response headers:", response.headers.get('content-type'));

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let chunkCount = 0;

        console.log("Starting stream reading...");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            accumulatedContent += text;
            chunkCount++;
            process.stdout.write(`Chunk ${chunkCount}: ${text.substring(0, 20)}... \r`);
        }

        console.log("\nStream complete.");
        console.log("Total chunks:", chunkCount);
        console.log("Final content length:", accumulatedContent.length);
        console.log("Final content preview:", accumulatedContent.substring(0, 50) + "...");

    } catch (error) {
        console.error("Fetch test failed:", error);
    }
}

testFrontendFetch();
