
'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Construction de l'historique pour l'API
            const apiMessages = [...messages, userMessage];

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages }),
            });

            if (!response.ok) throw new Error('Erreur réseau');

            // Lecture de la réponse (Texte brut)
            const text = await response.text();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: text,
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Désolé, j'ai eu un problème de connexion. Réessayez.",
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <header className="header">
                <h1>Solimi Support</h1>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>Service Client Premium (Mastra v1.3)</p>
            </header>

            <div className="chat-container">
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '20vh', opacity: 0.3 }}>
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <h2>Comment puis-je vous aider ?</h2>
                        <p>Transactions, conformité, remboursements...</p>
                    </div>
                )}

                {messages.map(m => (
                    <div key={m.id} className={`message ${m.role}`}>
                        <div className="role-label">{m.role === 'user' ? 'Vous' : 'Solimi Agent'}</div>
                        {m.content}
                    </div>
                ))}

                {isLoading && (
                    <div className="message assistant" style={{ opacity: 0.7 }}>
                        <div className="role-label">Solimi Agent</div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <span style={{ animation: 'bounce 1s infinite 0ms' }}>.</span>
                            <span style={{ animation: 'bounce 1s infinite 200ms' }}>.</span>
                            <span style={{ animation: 'bounce 1s infinite 400ms' }}>.</span>
                        </div>
                        <style jsx>{`
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
              }
            `}</style>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
                <form onSubmit={handleSubmit} className="input-form">
                    <input
                        className="input-field"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Décrivez votre problème..."
                        autoFocus
                    />
                    <button type="submit" className="send-btn" disabled={isLoading || !input.trim()}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>
        </>
    );
}
