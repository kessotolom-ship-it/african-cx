
'use client';
import { useState } from 'react';

export default function AdminPage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [foundUrls, setFoundUrls] = useState<string[]>([]);
    const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);

    // 1. Scanner la page pour trouver des liens
    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setMessage('🔍 Analyse de la page et recherche de liens...');
        setFoundUrls([]);

        try {
            const res = await fetch('/api/crawl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur scan');

            setFoundUrls(data.urls || []);
            setMessage(`✅ Trouvé ${data.urls?.length || 0} pages liées. Prêt à ingérer.`);
        } catch (err: any) {
            setMessage(`❌ Erreur Scan : ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 2. Ingérer une URL unique (interne)
    const ingestSingleUrl = async (targetUrl: string) => {
        const res = await fetch('/api/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl }),
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Erreur ingestion');
        }
        return await res.json();
    };

    // 3. Ingérer tout le lot
    const handleIngestAll = async () => {
        if (foundUrls.length === 0) return;

        setLoading(true);
        setProgress({ current: 0, total: foundUrls.length });
        setMessage('🚀 Démarrage de l\'ingestion massive...');

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < foundUrls.length; i++) {
            const currentUrl = foundUrls[i];
            try {
                await ingestSingleUrl(currentUrl);
                successCount++;
            } catch (err) {
                console.error(`Failed to ingest ${currentUrl}`, err);
                failCount++;
            }
            // Update progress
            setProgress({ current: i + 1, total: foundUrls.length });
        }

        setMessage(`🎉 Terminé ! ${successCount} pages ingérées, ${failCount} erreurs.`);
        setLoading(false);
        setProgress(null);
        setFoundUrls([]); // Reset
    };

    return (
        <div className="container">
            <h1>Nourrir le Cerveau Solimi 🧠</h1>
            <p>Entrez l'URL principale (ex: FAQ ou Documentation). Le système scannera les liens internes.</p>

            <form onSubmit={handleScan} className="ingest-form">
                <input
                    type="url"
                    placeholder="https://solimi.net/faq"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                />
                <div className="actions">
                    <button type="submit" disabled={loading} className="scan-btn">
                        {loading ? 'Analyse...' : '🔍 Scanner les liens'}
                    </button>
                    {foundUrls.length > 0 && (
                        <button type="button" onClick={handleIngestAll} disabled={loading} className="ingest-btn">
                            {loading ? `Ingestion (${progress?.current}/${progress?.total})` : `📥 Ingérer ${foundUrls.length} pages`}
                        </button>
                    )}
                </div>
            </form>

            {loading && progress && (
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                </div>
            )}

            {message && <div className="message">{message}</div>}

            {foundUrls.length > 0 && !loading && (
                <div className="url-list">
                    <h3>Pages détectées :</h3>
                    <ul>
                        {foundUrls.map((u) => (
                            <li key={u}>{u}</li>
                        ))}
                    </ul>
                </div>
            )}

            <style jsx>{`
        .container {
          max-width: 800px;
          margin: 4rem auto;
          background: #1e293b;
          color: white;
          padding: 2rem;
          border-radius: 1rem;
          font-family: sans-serif;
        }
        h1 { margin-top: 0; color: #8b5cf6; }
        input {
          width: 100%;
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #334155;
          background: #0f172a;
          color: white;
          margin-bottom: 1rem;
        }
        .actions {
          display: flex;
          gap: 1rem;
        }
        button {
          flex: 1;
          padding: 1rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }
        .scan-btn { background: #3b82f6; color: white; }
        .scan-btn:hover { background: #2563eb; }
        .ingest-btn { background: #10b981; color: white; }
        .ingest-btn:hover { background: #059669; }
        
        button:disabled { opacity: 0.5; cursor: wait; }
        
        .message { 
            margin-top: 1rem; 
            padding: 1rem; 
            background: #334155; 
            border-radius: 0.5rem; 
            white-space: pre-wrap;
        }

        .url-list {
            margin-top: 2rem;
            max-height: 300px;
            overflow-y: auto;
            background: #0f172a;
            padding: 1rem;
            border-radius: 0.5rem;
        }
        .url-list ul { padding-left: 1.5rem; }
        .url-list li { margin-bottom: 0.5rem; font-size: 0.9rem; color: #cbd5e1; }

        .progress-bar {
            height: 10px;
            background: #334155;
            border-radius: 5px;
            margin-top: 1rem;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: #10b981;
            transition: width 0.3s ease;
        }
      `}</style>
        </div>
    );
}
