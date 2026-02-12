
import { NextResponse } from 'next/server';
import pg from 'pg';
import OpenAI from 'openai';
import { JSDOM } from 'jsdom';

// ---------------------------------------------------------
// CONFIGURATION DU CERVEAU (Mastra RAG Backend)
// ---------------------------------------------------------
// Utilise PGVector pour stocker les connaissances.

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// On utilise une pool PG unique (Singleton pattern simplifié pour Next.js)
let pool: pg.Pool;

function getPool() {
    if (!pool) {
        if (!process.env.POSTGRES_URL) {
            throw new Error("POSTGRES_URL missing");
        }
        pool = new pg.Pool({
            connectionString: process.env.POSTGRES_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
    }
    return pool;
}

export async function POST(req: Request) {
    try {
        const { url, secret } = await req.json();

        // Sécurité Basique (MVP)
        // Idéalement, on aura un password admin dans .env
        // if (secret !== process.env.ADMIN_SECRET) return NextResponse.json({error: "Unauthorized"}, {status: 401});
        if (!url) return NextResponse.json({ error: "URL missing" }, { status: 400 });

        const client = await getPool().connect();

        // 1. Initialiser la Table (Au premier appel)
        await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
        await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding VECTOR(1536),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

        // 2. Crawler la page
        console.log(`Ingesting ${url}...`);
        const pageRes = await fetch(url);
        if (!pageRes.ok) throw new Error(`Failed to fetch ${url}`);
        const html = await pageRes.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Nettoyage (On garde le corps, on vire le bruit)
        doc.querySelectorAll('script, style, nav, footer, header').forEach(el => el.remove());
        const textContent = (doc.body.textContent || "")
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 8000); // OpenAI Embedding limit

        if (textContent.length < 50) {
            client.release();
            return NextResponse.json({ error: "Page content too short or empty" }, { status: 400 });
        }

        // 3. Vectoriser (OpenAI Embeddings)
        const embeddingRes = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: textContent,
        });
        const vector = embeddingRes.data[0].embedding;

        // 4. Sauvegarder (Upsert basique: on insère direct)
        // On pourrait delete l'ancienne version de l'URL avant
        await client.query('DELETE FROM documents WHERE url = $1', [url]);
        await client.query(
            `INSERT INTO documents (url, content, embedding) VALUES ($1, $2, $3)`,
            [url, textContent, JSON.stringify(vector)]
        );

        client.release();
        console.log(`Successfully ingested ${url}`);

        return NextResponse.json({
            success: true,
            url,
            chars: textContent.length
        });

    } catch (error: any) {
        console.error("Ingest Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
