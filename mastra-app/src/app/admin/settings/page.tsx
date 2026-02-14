'use client';

import React from 'react';
import {
    Key,
    Database,
    Settings,
    Lock,
    RefreshCw,
    Save,
    Shield
} from 'lucide-react';
import '../admin.css';

export default function SettingsPage() {
    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Configuration Système</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Gérez les intégrations et la sécurité de l'IA Solimi.
                    </p>
                </div>
            </div>

            <div className="grid-cols-2">
                {/* ── API CONNECTIONS ──────────────────── */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Connexions API</span>
                        <Key size={18} color="var(--accent-color)" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label className="label">OpenAI API Key</label>
                            <div className="input-group">
                                <input type="password" value="sk-proj-**********************" disabled className="input-modern" />
                                <span className="status-dot online"></span>
                            </div>
                            <div className="help-text">Connecté à GPT-4o & Whisper-1</div>
                        </div>

                        <div>
                            <label className="label">Evolution API (WhatsApp)</label>
                            <div className="input-group">
                                <input type="text" value="https://evo.solimi.net" disabled className="input-modern" />
                                <span className="status-dot checking"></span>
                            </div>
                            <div className="help-text">Instance: solimi-prod-v1</div>
                        </div>

                        <div>
                            <label className="label">PostgreSQL Vector DB</label>
                            <div className="input-group">
                                <input type="password" value="postgres://neos-****************" disabled className="input-modern" />
                                <span className="status-dot online"></span>
                            </div>
                            <div className="help-text">pgvector enabled</div>
                        </div>
                    </div>
                </div>

                {/* ── SYSTEM CONTROL ───────────────────── */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Contrôle Système</span>
                        <Settings size={18} color="var(--accent-color)" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label className="label">Mode Maintenance</label>
                            <div className="toggle-switch">
                                <span className="toggle-label off">Inactif</span>
                                <div className="toggle-track">
                                    <div className="toggle-thumb"></div>
                                </div>
                            </div>
                            <div className="help-text">Empêche les nouvelles conversations.</div>
                        </div>

                        <div>
                            <label className="label">Niveau de Log</label>
                            <select className="input-modern">
                                <option>Info (Standard)</option>
                                <option>Debug (Verbose)</option>
                                <option>Error Only</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Cache Mémoire Agents</label>
                            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}>
                                <RefreshCw size={14} style={{ marginRight: '8px' }} /> Vider le cache Redis/Mem
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SECURITY AUDIT ───────────────────── */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                    <span className="card-title">Audit de Sécurité (Snyk)</span>
                    <Shield size={18} color="#10b981" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>A+</div>
                    <div>
                        <div style={{ fontWeight: 'bold', color: 'white' }}>Code Sécurisé</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Dernier scan: Il y a 2 heures. 0 vulnérabilités critiques.</div>
                    </div>
                    <button className="btn" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                        Détails
                    </button>
                </div>
            </div>

            <style jsx>{`
                .label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    margin-bottom: 0.5rem;
                }
                .help-text {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    margin-top: 0.25rem;
                    opacity: 0.7;
                }
                .input-group {
                    position: relative;
                }
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .status-dot.online { background: #10b981; box-shadow: 0 0 8px #10b981; }
                .status-dot.checking { background: #f59e0b; animation: pulse 1s infinite; }

                /* Toggle Switch (CSS Only) */
                .toggle-switch {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    cursor: pointer;
                }
                .toggle-track {
                    width: 48px;
                    height: 24px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 12px;
                    position: relative;
                    transition: all 0.2s;
                }
                .toggle-thumb {
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    position: absolute;
                    left: 2px;
                    top: 2px;
                    transition: all 0.2s;
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }

                .btn-secondary {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--text-primary);
                }
                .btn-secondary:hover {
                    background: rgba(255,255,255,0.1);
                }
            `}</style>
        </div>
    );
}
