'use client';

import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { AdminLogin } from '@/components/admin/AdminLogin';
import Link from 'next/link';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    if (!isAuthenticated) {
        return (
            <>
                <AdminLogin
                    onLogin={() => setIsAuthenticated(true)}
                    onBack={() => { }}
                />
                {/* Override onBack to use Next.js Link */}
                <div className="fixed top-8 left-6 z-50">
                    <Link
                        href="/"
                        className="text-white/40 hover:text-white text-sm flex items-center"
                    >
                        ← Volver a Reservas
                    </Link>
                </div>
                <Toaster position="top-center" theme="dark" />
            </>
        );
    }

    return (
        <>
            <AdminPanel onLogout={handleLogout} />
            <Toaster position="top-right" theme="dark" />
        </>
    );
}
