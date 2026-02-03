import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export const AdminLogin: React.FC<{ onLogin: () => void; onBack: () => void }> = ({ onLogin, onBack }) => {
  const [pin, setPin] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '2024') { // Mock PIN
        onLogin();
    } else {
        toast.error('Código incorrecto');
        setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
            <button onClick={onBack} className="text-white/40 hover:text-white text-sm mb-8 flex items-center">
                ← Volver
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">Acceso Staff</h2>
            <p className="text-white/50 mb-8">Ingresa tu código de acceso personal.</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                        type="password" 
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-lg focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="PIN (2024)"
                        autoFocus
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-amber-500 text-black font-bold py-4 rounded-xl hover:bg-amber-400 transition-colors flex items-center justify-center space-x-2"
                >
                    <span>Ingresar</span>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </form>
        </div>
    </div>
  );
};