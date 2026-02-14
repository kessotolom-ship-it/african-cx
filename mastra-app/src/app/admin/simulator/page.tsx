'use client';

import { useState, useRef, useEffect } from 'react';
import {
    SendHorizontal,
    RotateCcw,
    Bot,
    User,
    Loader2,
    Mic,
    Image as ImageIcon,
    Paperclip,
    X
} from 'lucide-react';
import '../admin.css';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    attachment?: {
        type: 'image' | 'audio';
        url: string; // Blob URL pour preview
        name: string;
    };
};

export default function SimulatorPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result as string;
                // Remove data:image/jpeg;base64, prefix
                const base64 = base64String.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !selectedFile) || isLoading) return;

        const currentInput = input;
        const currentFile = selectedFile;
        // Reset input immediately
        setInput('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Construit le message utilisateur pour l'UI
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: currentInput,
            attachment: currentFile ? {
                type: currentFile.type.startsWith('image/') ? 'image' : 'audio',
                url: URL.createObjectURL(currentFile),
                name: currentFile.name
            } : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            let attachmentPayload = undefined;
            if (currentFile) {
                const base64 = await convertToBase64(currentFile);
                attachmentPayload = {
                    base64: base64,
                    mimeType: currentFile.type,
                    fileName: currentFile.name
                };
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    threadId,
                    attachment: attachmentPayload
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
                content: "Désolé, erreur lors du traitement (vérifiez la taille du fichier ou le format).",
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Simulateur Multi-Canal</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Testez Audio (Whisper), Image (Vision) et Texte comme sur WhatsApp.
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
                        <p>Envoyez une image de reçu ou un audio "Bonjour" pour tester l'IA.</p>
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

                            {m.attachment && (
                                <div style={{ marginBottom: '0.5rem', marginTop: '0.25rem' }}>
                                    {m.attachment.type === 'image' ? (
                                        <img src={m.attachment.url} alt="Uploaded" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '200px' }} />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                                            <Mic size={16} />
                                            <span>{m.attachment.name} (Audio)</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {m.content}
                        </div>
                    ))}

                    {isLoading && (
                        <div style={{ alignSelf: 'flex-start', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Loader2 size={16} className="animate-spin" />
                                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Traitement Audio/Vision & Workflow...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input flottante mais scopée */}
            <div style={{ marginTop: '1rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>

                    {/* File Input Hidden */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept="image/*,audio/*"
                    />

                    {/* Preview / Selection */}
                    {selectedFile ? (
                        <div style={{
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: '1px solid var(--accent-color)',
                            minWidth: '200px'
                        }}>
                            <Paperclip size={14} />
                            <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                                {selectedFile.name}
                            </span>
                            <button type="button" onClick={clearFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => fileInputRef.current?.click()}
                                title="Envoyer une image ou un audio"
                                style={{ background: 'rgba(255,255,255,0.1)', padding: '0.8rem', color: 'var(--text-secondary)' }}
                            >
                                <Paperclip size={20} />
                            </button>
                        </div>
                    )}

                    <input
                        className="input-modern"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={selectedFile ? "Ajouter une légende..." : "Message, image ou audio..."}
                        autoFocus
                        style={{ flex: 1 }}
                    />

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading || (!input.trim() && !selectedFile)}
                        style={{ width: '50px', justifyContent: 'center', padding: 0, height: '46px' }}
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
