
import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL manquante" }, { status: 400 });
        }

        console.log(`Crawling ${url}...`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Impossible d'accéder à ${url}`);
        }

        const html = await response.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const baseUrl = new URL(url);

        const links = new Set<string>();

        // Add the starting page itself
        links.add(url);

        doc.querySelectorAll('a').forEach((el) => {
            const href = el.getAttribute('href');
            if (href) {
                try {
                    const absoluteUrl = new URL(href, baseUrl);
                    // On ne garde que les liens du même domaine
                    if (absoluteUrl.origin === baseUrl.origin) {
                        // On ignore les ancres (#), les fichiers images, etc. si besoin
                        if (!absoluteUrl.pathname.match(/\.(png|jpg|jpeg|gif|pdf|css|js)$/i)) {
                            // Normalisation : on enlève le hash
                            absoluteUrl.hash = '';
                            // On enlève le slash final pour éviter les doublons
                            const cleanUrl = absoluteUrl.href.replace(/\/$/, "");
                            links.add(cleanUrl);
                        }
                    }
                } catch (e) {
                    // Ignorer les URLs invalides
                }
            }
        });

        return NextResponse.json({
            urls: Array.from(links).sort()
        });

    } catch (error: any) {
        console.error("Crawl Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
