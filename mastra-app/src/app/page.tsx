'use client';

import { useState, useRef, useEffect } from 'react';
import {
    SendHorizontal,
    RotateCcw,
    Bot,
    User,
    Loader2,
    Sparkles
} from 'lucide-react';

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
                    threadId,
                }),
            });

            if (!response.ok) throw new Error('Erreur réseau');
            if (!response.body) throw new Error('Pas de corps de réponse');

            const serverThreadId = response.headers.get('X-Thread-Id');
            if (serverThreadId && !threadId) {
                setThreadId(serverThreadId);
            }

            const botMessageId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
                id: botMessageId,
                role: 'assistant',
                content: '',
            }]);

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
                content: "Désolé, une erreur est survenue. Veuillez réessayer.",
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <header className="header">
                <h1>
                    <Sparkles size={18} className="text-purple-400" fill="currentColor" />
                    <span>Solimi Assistant</span>
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {threadId && (
                        <button
                            onClick={() => { setThreadId(null); setMessages([]); }}
                            title="Nouvelle conversation"
                            style={{
                                padding: '8px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            <RotateCcw size={14} />
                        </button>
                    )}
                </div>
            </header>

            <div className="chat-container">
                {messages.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        marginTop: '25vh',
                        opacity: 0.8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 40px rgba(139, 92, 246, 0.4)'
                        }}>
                            <Bot size={40} color="white" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Comment puis-je vous aider ?</h2>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {['Paiement échoué', 'Créer un compte', 'Frais de transaction', 'Remboursement'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setInput(tag)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '99px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map(m => (
                    <div key={m.id} className={`message ${m.role}`}>
                        <div className="role-label">
                            {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                            {m.role === 'user' ? 'Vous' : 'Solimi Agent'}
                        </div>
                        {m.content}
                    </div>
                ))}

                {isLoading && (
                    <div className="message assistant" style={{ opacity: 0.8 }}>
                        <div className="role-label">
                            <Bot size={12} /> Solimi Agent
                        </div>
                        <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
                            <div className="typing-dot" style={{ animationDelay: '0ms' }}></div>
                            <div className="typing-dot" style={{ animationDelay: '200ms' }}></div>
                            <div className="typing-dot" style={{ animationDelay: '400ms' }}></div>
                        </div>
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
                        placeholder="Posez votre question..."
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="send-btn"
                        disabled={isLoading || !input.trim()}
                        aria-label="Envoyer"
                    >
                        {isLoading ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <SendHorizontal size={24} style={{ marginLeft: '2px' }} /> // Optique correction
                        )}
                    </button>
                </form>
            </div>
        </>
    );
}
