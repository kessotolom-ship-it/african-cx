'use client';

import Link from 'next/link';
import { Bot, MessageCircle, ExternalLink, Lock } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-900 text-white font-sans items-center justify-center p-4">

            {/* ── HERO ──────────────────────────────── */}
            <div className="text-center max-w-2xl animate-fade-in-up">

                <div className="flex items-center justify-center mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl animate-pulse-slow">
                        <Bot size={40} className="text-white" />
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Solimi Support AI
                </h1>

                <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                    L'assistance client nouvelle génération, disponible 24/7 sur WhatsApp.
                    <br />
                    Capable de voir, d'écouter et de résoudre vos problèmes.
                </p>

                {/* ── CTA ───────────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">

                    <a
                        href="https://wa.me/22890112233" // Remplacez par votre lien court WhatsApp
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp group"
                    >
                        <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Discuter sur WhatsApp</span>
                        <ExternalLink className="w-4 h-4 opacity-50" />
                    </a>

                    <Link href="/admin/simulator" className="btn-admin">
                        <Lock className="w-4 h-4" />
                        <span>Accès Opérateur</span>
                    </Link>

                </div>

            </div>

            {/* ── FOOTER ────────────────────────────── */}
            <footer className="mt-20 text-center text-sm text-slate-600">
                <p>© 2024 Solimi Fintech. Powered by Mastra Engine v1.4.</p>
                <div className="flex justify-center gap-4 mt-2">
                    <span>• Vision (GPT-4o)</span>
                    <span>• Voice (Whisper)</span>
                    <span>• CRM Integration</span>
                </div>
            </footer>

            {/* ── STYLES (Inline Tailwind-like for speed) ── */}
            <style jsx global>{`
        body { background: #0f172a; margin: 0; }
        .btn-whatsapp {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: #25D366;
            color: white;
            padding: 0.8rem 1.5rem;
            border-radius: 99px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
        }
        .btn-whatsapp:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4); }
        
        .btn-admin {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255,255,255,0.05);
            color: #94a3b8;
            padding: 0.8rem 1.5rem;
            border-radius: 99px;
            font-weight: 500;
            text-decoration: none;
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.2s;
        }
        .btn-admin:hover {
            color: white;
            background: rgba(255,255,255,0.1);
        }

        .animate-pulse-slow { animation: pulse 3s infinite; }
        @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
            50% { box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
        }
      `}</style>
        </div>
    );
}
