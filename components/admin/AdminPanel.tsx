import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, CalendarDays, LogOut, Scissors } from 'lucide-react';
import { DashboardView } from './DashboardView';
import { BookingsManager } from './BookingsManager';
import { Booking } from '../../types';
import { supabaseApi } from '../../lib/mockSupabase';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings'>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos globales para el admin
  const refreshData = async () => {
    setLoading(true);
    const data = await supabaseApi.getAllBookings();
    setBookings(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col md:flex-row">
      {/* Sidebar Mobile / Desktop */}
      <nav className="w-full md:w-20 lg:w-64 bg-[#0a0a0a] border-b md:border-b-0 md:border-r border-white/5 flex md:flex-col items-center md:items-start p-4 md:py-8 sticky top-0 z-50">
        
        {/* Logo Area */}
        <div className="hidden md:flex items-center space-x-3 mb-10 px-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-black font-bold font-serif italic">A</div>
            <span className="font-bold text-lg tracking-wide hidden lg:block">Admin</span>
        </div>

        {/* Navigation Items */}
        <div className="flex md:flex-col w-full justify-around md:justify-start gap-2">
            <button 
                onClick={() => setActiveTab('dashboard')}
                className={`p-3 md:px-4 md:py-3 rounded-xl flex items-center space-x-3 transition-all ${
                    activeTab === 'dashboard' ? 'bg-amber-500 text-black' : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
            >
                <LayoutDashboard className="w-6 h-6" />
                <span className="hidden lg:block font-medium">Dashboard</span>
            </button>

            <button 
                 onClick={() => setActiveTab('bookings')}
                 className={`p-3 md:px-4 md:py-3 rounded-xl flex items-center space-x-3 transition-all ${
                    activeTab === 'bookings' ? 'bg-amber-500 text-black' : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
            >
                <CalendarDays className="w-6 h-6" />
                <span className="hidden lg:block font-medium">Reservas</span>
            </button>
        </div>

        {/* Logout Bottom */}
        <div className="hidden md:block mt-auto w-full pt-4 border-t border-white/5">
            <button 
                onClick={onLogout}
                className="w-full p-3 rounded-xl flex items-center space-x-3 text-red-400 hover:bg-red-500/10 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                <span className="hidden lg:block font-medium">Salir</span>
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar bg-[#050505] relative">
         {/* Background Mesh for Premium feel */}
         <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
         </div>

         <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                        {activeTab === 'dashboard' ? 'Resumen Ejecutivo' : 'Gestión de Reservas'}
                    </h1>
                    <p className="text-white/40 text-sm">Bienvenido de nuevo, Andy.</p>
                </div>
                {/* Mobile Logout */}
                <button onClick={onLogout} className="md:hidden p-2 bg-white/5 rounded-full text-white/60">
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {activeTab === 'dashboard' && <DashboardView bookings={bookings} loading={loading} />}
                {activeTab === 'bookings' && <BookingsManager bookings={bookings} loading={loading} onRefresh={refreshData} />}
            </motion.div>
         </div>
      </main>
    </div>
  );
};