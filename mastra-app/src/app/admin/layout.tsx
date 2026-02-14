'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Database,
    MessageSquareText,
    Settings,
    LogOut,
    Cpu
} from 'lucide-react';
import './admin.css';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Knowledge Base', href: '/admin/knowledge', icon: Database },
        { name: 'Conversations', href: '/admin/conversations', icon: MessageSquareText },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ];

    return (
        <div className="admin-layout">
            {/* ── SIDEBAR ────────────────────────────────── */}
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-icon">
                        <Cpu size={20} color="white" />
                    </div>
                    <span>Mastra Admin</span>
                </div>

                <nav className="nav-list">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={18} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="user-profile">
                    <div className="avatar" style={{
                        width: 32, height: 32, borderRadius: '50%', background: '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white'
                    }}>
                        A
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>Admin User</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>admin@solimi.net</div>
                    </div>
                    <LogOut size={16} style={{ cursor: 'pointer', opacity: 0.7 }} />
                </div>
            </aside>

            {/* ── MAIN CONTENT ───────────────────────────── */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
