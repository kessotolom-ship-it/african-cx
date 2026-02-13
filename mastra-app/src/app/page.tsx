
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
    const [threadId, setThreadId] = useState<string | null>(null);
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
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    threadId, // Envoie le threadId pour la persistance mémoire
                }),
            });

            if (!response.ok) throw new Error('Erreur réseau');
            if (!response.body) throw new Error('Pas de corps de réponse');

            // Récupérer le threadId du serveur (créé au premier message)
            const serverThreadId = response.headers.get('X-Thread-Id');
            if (serverThreadId && !threadId) {
                setThreadId(serverThreadId);
            }

            // Préparer le message vide du bot
            const botMessageId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
                id: botMessageId,
                role: 'assistant',
                content: '',
            }]);

            // Streaming Reader
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                accumulatedContent += text;

                setMessages(prev => prev.map(msg =>
                    msg.id === botMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                ));
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: "Désolé, une erreur est survenue pendant la connexion.",
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <header className="header">
                <h1>Solimi Support</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>Service Client Premium (Mastra v1.4 + Memory)</p>
                    {threadId && (
                        <button
                            onClick={() => { setThreadId(null); setMessages([]); }}
                            style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}
                        >
                            Nouvelle conversation
                        </button>
                    )}
                </div>
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
