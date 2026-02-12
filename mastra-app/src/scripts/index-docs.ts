
import { pg } from 'pg';
import OpenAI from 'openai';
import { JSDOM } from 'jsdom';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pool = new pg.Pool({ connectionString: process.env.POSTGRES_URL, ssl: true });

async function createTableWait() {
    await pool.query(`
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding VECTOR(1536),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
    console.log("✅ Table documents ready (with vector).");
}

async function getEmbedding(text: string) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000), // Max tokens limit
    });
    return response.data[0].embedding;
}

async function scrapeAndIndex(url: string) {
    console.log(`🌐 Indexing: ${url}...`);
    try {
        const res = await fetch(url);
        const html = await res.text();
        const dom = new JSDOM(html);

        // Extraction texte propre (sans scripts/styles)
        const doc = dom.window.document;
        doc.querySelectorAll('script, style, nav, footer').forEach(el => el.remove());
        const content = (doc.body.textContent || "").replace(/\s+/g, ' ').trim();

        if (content.length < 50) {
            console.log(`⚠️ Content too short for ${url}, skipping.`);
            return;
        }

        // Embedding
        const vector = await getEmbedding(content);

        // Insert
        await pool.query(
            `INSERT INTO documents (url, content, embedding) VALUES ($1, $2, $3)`,
            [url, content, JSON.stringify(vector)]
        );
        console.log(`✅ Indexed: ${url} (${content.length} chars)`);

    } catch (error) {
        console.error(`❌ Error indexing ${url}:`, error);
    }
}

// ------------------------------------------------------------------
// LISTE DES PAGES A INDEXER
// Modifiez ou ajoutez vos URLs ici !
// ------------------------------------------------------------------
const URLS_TO_INDEX = [
    "https://solimi.net/faq",      // Exemple
    "https://solimi.net/docs",     // Exemple
    // Ajoutez vos liens ici
];

// RUN
(async () => {
    await createTableWait();
    for (const url of URLS_TO_INDEX) {
        if (url.includes("solimi.net")) { // Safety check example
            // await scrapeAndIndex(url);
            console.log("ℹ️ Skipping mock URL: " + url);
        }
    }
    console.log("🎉 Indexing complete!");
    pool.end();
})();
