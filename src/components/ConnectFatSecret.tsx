'use client';
import { LogIn } from 'lucide-react';

export default function ConnectFatSecret() {
    return (
        <div className="layout-container">
            <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '40px' }}>FatSecret Dashboard</h1>
            <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '16px' }}>Connect Your Data</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                    Please link your FatSecret account to view your weight and nutrition dashboard.
                </p>
                <a href="/api/auth/fatsecret" style={{ textDecoration: 'none' }}>
                    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        <LogIn size={20} />
                        Connect to FatSecret
                    </button>
                </a>
            </div>
        </div>
    );
}
