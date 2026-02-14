'use client';

import React, { useState } from 'react';
import {
    Globe,
    Search,
    Download,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import '../admin.css';

export default function KnowledgePage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [foundUrls, setFoundUrls] = useState<string[]>([]);
    const [ingestedUrls, setIngestedUrls] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
    const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);

    // 1. Scanner la page pour trouver des liens
    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setMessage('🔍 Analyse de la page et recherche de liens...');
        setFoundUrls([]);
        setIngestedUrls({});

        try {
            const res = await fetch('/api/crawl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur scan');

            setFoundUrls(data.urls || []);

            // Initialiser les statuts
            const initialStatus: any = {};
            (data.urls || []).forEach((u: string) => initialStatus[u] = 'pending');
            setIngestedUrls(initialStatus);

            setMessage(`✅ Trouvé ${data.urls?.length || 0} pages liées. Prêt à ingérer.`);
        } catch (err: any) {
            setMessage(`❌ Erreur Scan : ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 2. Ingérer une URL unique
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

            // Update UI status to 'processing' (we use pending/success/error)
            // Visual feedback is handled by progress bar mainly

            try {
                await ingestSingleUrl(currentUrl);
                setIngestedUrls(prev => ({ ...prev, [currentUrl]: 'success' }));
                successCount++;
            } catch (err) {
                console.error(`Failed to ingest ${currentUrl}`, err);
                setIngestedUrls(prev => ({ ...prev, [currentUrl]: 'error' }));
                failCount++;
            }
            // Update progress
            setProgress({ current: i + 1, total: foundUrls.length });
        }

        setMessage(`🎉 Terminé ! ${successCount} pages ingérées, ${failCount} erreurs.`);
        setLoading(false);
        setProgress(null);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Base de Connaissances (RAG)</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Scannez et ingérez la documentation de Solimi pour nourrir le cerveau de l'IA.
                    </p>
                </div>
            </div>

            <div className="card" style={{ maxWidth: '800px', margin: '0 0 2rem 0' }}>
                <form onSubmit={handleScan} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Globe size={18} style={{ position: 'absolute', left: '12px', top: '14px', opacity: 0.5 }} />
                        <input
                            className="input-modern"
                            type="url"
                            placeholder="https://solimi.net/faq"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ minWidth: '140px', justifyContent: 'center' }}>
                        {loading && !progress ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <Search size={18} />
                        )}
                        {loading ? 'Analyse...' : 'Scanner'}
                    </button>

                    {foundUrls.length > 0 && (
                        <button
                            type="button"
                            onClick={handleIngestAll}
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ background: 'var(--success-color)', minWidth: '140px', justifyContent: 'center' }}
                        >
                            {loading && progress ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <Download size={18} />
                            )}
                            {loading ? `${progress?.current}/${progress?.total}` : 'Ingérer Tout'}
                        </button>
                    )}
                </form>

                {/* Progress Bar */}
                {loading && progress && (
                    <div style={{
                        height: '6px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '3px',
                        marginTop: '1.5rem',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            background: 'var(--success-color)',
                            width: `${(progress.current / progress.total) * 100}%`,
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                )}

                {message && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${message.includes('❌') ? 'var(--warning-color)' : 'var(--accent-color)'}`
                    }}>
                        {message}
                    </div>
                )}
            </div>

            {/* Results Table */}
            {foundUrls.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Pages Détectées ({foundUrls.length})</span>
                    </div>
                    <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>URL</th>
                                    <th style={{ width: '100px', textAlign: 'right' }}>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {foundUrls.map((u) => (
                                    <tr key={u}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{u}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            {ingestedUrls[u] === 'success' && (
                                                <span className="badge badge-success"><CheckCircle size={12} style={{ marginRight: 4 }} /> OK</span>
                                            )}
                                            {ingestedUrls[u] === 'error' && (
                                                <span className="badge badge-warning"><AlertCircle size={12} style={{ marginRight: 4 }} /> Err</span>
                                            )}
                                            {ingestedUrls[u] === 'pending' && (
                                                <span className="badge badge-neutral">En attente</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
