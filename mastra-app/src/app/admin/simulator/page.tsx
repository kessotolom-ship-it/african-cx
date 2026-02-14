'use client';

import { useState, useRef, useEffect } from 'react';
import {
    SendHorizontal,
    RotateCcw,
    Bot,
    User,
    Loader2
} from 'lucide-react';
import '../admin.css';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

export default function SimulatorPage() {
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
                content: "Désolé, erreur de simulation.",
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ paddingBottom: '5rem', maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Simulateur IA</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Testez les réponses du bot sans utiliser WhatsApp.
                    </p>
                </div>
                {threadId && (
                    <button
                        className="btn"
                        onClick={() => { setThreadId(null); setMessages([]); }}
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                    >
                        <RotateCcw size={14} style={{ marginRight: 6 }} /> Reset
                    </button>
                )}
            </div>

            <div className="card" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {messages.length === 0 && (
                    <div style={{
                        margin: 'auto',
                        opacity: 0.5,
                        textAlign: 'center',
                        padding: '2rem'
                    }}>
                        <Bot size={48} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--accent-color)' }} />
                        <h3>Prêt à simuler</h3>
                        <p>Tapez un message comme si vous étiez un client sur WhatsApp.</p>
                    </div>
                )}

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
                    {messages.map(m => (
                        <div key={m.id} style={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            padding: '0.75rem 1rem',
                            borderRadius: '12px',
                            background: m.role === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                            color: 'white',
                            lineHeight: 1.5
                        }}>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: 4, fontWeight: 'bold' }}>
                                {m.role === 'user' ? 'TESTEUR' : 'MASTRA BOT'}
                            </div>
                            {m.content}
                        </div>
                    ))}

                    {isLoading && (
                        <div style={{ alignSelf: 'flex-start', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                            <Loader2 size={16} className="animate-spin" />
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input flottante mais scopée au div (pas fixed global) */}
            <div style={{ marginTop: '1rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        className="input-modern"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message de test..."
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading || !input.trim()}
                        style={{ width: '50px', justifyContent: 'center', padding: 0 }}
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
