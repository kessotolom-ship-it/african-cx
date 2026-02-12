
'use client';
import { useState } from 'react';

export default function AdminPage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleIngest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setMessage('Ingestion en cours...');

        try {
            const res = await fetch('/api/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }), // On pourrait ajouter un password ici
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur inconnue');

            setMessage(`✅ Succès : ${data.chars} caractères indexés depuis ${url}`);
            setUrl('');
        } catch (err: any) {
            setMessage(`❌ Erreur : ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>Nourrir le Cerveau Solimi 🧠</h1>
            <p>Ajoutez l'URL d'une page de documentation pour que l'agent la mémorise.</p>

            <form onSubmit={handleIngest} className="ingest-form">
                <input
                    type="url"
                    placeholder="https://solimi.net/faq"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Crunching...' : 'Apprendre'}
                </button>
            </form>

            {message && <div className="message">{message}</div>}

            <style jsx>{`
        .container {
          max-width: 600px;
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
        button {
          width: 100%;
          padding: 1rem;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: bold;
          cursor: pointer;
        }
        button:disabled { opacity: 0.5; cursor: wait; }
        .message { margin-top: 1rem; padding: 1rem; background: #334155; border-radius: 0.5rem; }
      `}</style>
        </div>
    );
}
