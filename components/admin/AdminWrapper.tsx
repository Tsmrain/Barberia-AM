'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPanel } from './AdminPanel';
import { AdminLogin } from './AdminLogin';

export const AdminWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Session Persistence
  React.useEffect(() => {
    const session = localStorage.getItem('admin_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('admin_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    router.push('/');
  };

  if (isAuthenticated) {
    return <AdminPanel onLogout={handleLogout} />;
  }

  return (
    <AdminLogin
      onLogin={handleLogin}
      onBack={() => router.push('/')}
    />
  );
};