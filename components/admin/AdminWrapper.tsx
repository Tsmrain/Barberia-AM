'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPanel } from './AdminPanel';
import { AdminLogin } from './AdminLogin';

export const AdminWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    setIsAuthenticated(false);
    router.push('/');
  };

  if (isAuthenticated) {
      return <AdminPanel onLogout={handleLogout} />;
  }
  
  return (
    <AdminLogin 
        onLogin={() => setIsAuthenticated(true)} 
        onBack={() => router.push('/')} 
    />
  );
};