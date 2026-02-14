'use client';

import React from 'react';
import { MessageSquare, Phone, User, Clock, MoreHorizontal } from 'lucide-react';
import '../admin.css';

export default function ConversationsPage() {
    // Mock data
    const conversations = [
        { id: 't_123', user: '+228 90 11 22 33', lastMsg: 'Mon paiement a échoué...', time: '2 min', status: 'active', channel: 'whatsapp' },
        { id: 't_456', user: 'Jean Kouassi', lastMsg: 'Merci pour votre aide.', time: '1h', status: 'closed', channel: 'web' },
        { id: 't_789', user: '+225 07 08 09 10', lastMsg: 'Comment créer un compte ?', time: '3h', status: 'active', channel: 'whatsapp' },
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Conversations</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-neutral">Toutes</span>
                    <span className="badge badge-success">Actives</span>
                    <span className="badge badge-warning">À traiter</span>
                </div>
            </div>

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40%' }}>Utilisateur / Canal</th>
                            <th>Dernier Message</th>
                            <th>Statut</th>
                            <th>Temps</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {conversations.map((conv) => (
                            <tr key={conv.id} style={{ cursor: 'pointer' }}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: conv.channel === 'whatsapp' ? '#25D366' : '#6366f1',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white'
                                        }}>
                                            {conv.channel === 'whatsapp' ? <Phone size={16} /> : <User size={16} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'white' }}>{conv.user}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Thread: {conv.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-muted)' }}>
                                    {conv.lastMsg}
                                </td>
                                <td>
                                    {conv.status === 'active' ? (
                                        <span className="badge badge-success">Active</span>
                                    ) : (
                                        <span className="badge badge-neutral">Fermée</span>
                                    )}
                                </td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={12} /> {conv.time}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <MoreHorizontal size={18} color="var(--text-muted)" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
