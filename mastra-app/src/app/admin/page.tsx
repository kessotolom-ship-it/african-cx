'use client';

import React from 'react';
import {
    BarChart,
    Activity,
    Users,
    Database,
    ArrowUpRight
} from 'lucide-react';

export default function AdminDashboard() {
    // Mock data pour l'instant
    const stats = [
        { title: 'Conversations Actives', value: '12', trend: '+2', icon: Activity, trendUp: true },
        { title: 'Utilisateurs Uniques', value: '1,234', trend: '+15%', icon: Users, trendUp: true },
        { title: 'Pages Ingérées (RAG)', value: '85', trend: 'Stable', icon: Database, trendUp: true },
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary">
                        <Activity size={18} />
                        Check Health
                    </button>
                </div>
            </div>

            {/* ── KPI CARDS ────────────────────────────── */}
            <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card">
                        <div className="card-header">
                            <span className="card-title">{stat.title}</span>
                            <stat.icon size={20} color="var(--accent-color)" />
                        </div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-trend">
                            <span className={stat.trendUp ? 'trend-up' : 'trend-down'}>
                                <ArrowUpRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                {stat.trend}
                            </span>
                            <span style={{ opacity: 0.5, marginLeft: '0.5rem' }}>vs semaine dernière</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── RECENT ACTIVITY ──────────────────────── */}
            <div className="grid-cols-2">
                {/* Chat Activity Chart (Mock) */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Volume de Messages</span>
                        <BarChart size={18} color="white" />
                    </div>
                    <div style={{
                        height: '200px',
                        background: 'linear-gradient(to top, rgba(139, 92, 246, 0.2), transparent)',
                        borderBottom: '1px solid var(--accent-color)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        paddingBottom: '0.5rem',
                        paddingTop: '2rem'
                    }}>
                        {[40, 65, 30, 80, 55, 90, 70].map((h, idx) => (
                            <div key={idx} style={{
                                width: '12%',
                                height: `${h}%`,
                                background: 'var(--accent-color)',
                                borderRadius: '4px 4px 0 0',
                                opacity: 0.8
                            }}></div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>
                        <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
                    </div>
                </div>

                {/* System Status */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">État du Système</span>
                    </div>
                    <table className="data-table">
                        <tbody>
                            <tr>
                                <td>Mastra Agent (Core)</td>
                                <td style={{ textAlign: 'right' }}><span className="badge badge-success">Online</span></td>
                            </tr>
                            <tr>
                                <td>PostgreSQL (Vector DB)</td>
                                <td style={{ textAlign: 'right' }}><span className="badge badge-success">Connected</span></td>
                            </tr>
                            <tr>
                                <td>OpenAI API</td>
                                <td style={{ textAlign: 'right' }}><span className="badge badge-success">Operational</span></td>
                            </tr>
                            <tr>
                                <td>Evolution API (WhatsApp)</td>
                                <td style={{ textAlign: 'right' }}><span className="badge badge-warning">Checking...</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
