'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Map, ArrowRight, Clock } from 'lucide-react';
import { useBooking } from '../../store/BookingContext';
import { supabaseApi } from '../../lib/supabaseApi';
import { Branch } from '../../types';

export const BranchSelection: React.FC = () => {
  const { setStep, setBranch } = useBooking();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // For real-time check
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  useEffect(() => {
    const fetchBranches = async () => {
      const data = await supabaseApi.getBranches();
      setBranches(data);
      setLoading(false);
    };
    fetchBranches();

    // Update time check every minute just in case
    const timer = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSelect = (branch: Branch) => {
    setBranch(branch);
    setStep(2); // Go to Services
  };

  const getBranchStatus = (branch: Branch) => {
    if (branch.estado_actual === 'abierto') return { isOpen: true, label: 'Abierto' };
    if (branch.estado_actual === 'cerrado') return { isOpen: false, label: 'Cerrado Temporalmente' };
    
    // Auto Mode
    const isOpen = currentHour >= branch.horario_apertura && currentHour < branch.horario_cierre;
    return { 
        isOpen, 
        label: isOpen ? `Abierto hasta las ${branch.horario_cierre}:00` : `Cerrado (Abre ${branch.horario_apertura}:00)` 
    };
  };

  return (
    <div className="flex flex-col h-full pt-8 px-6 pb-6">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => setStep(0)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <span className="text-xs font-medium text-white/40 tracking-widest uppercase">Paso 1 de 5</span>
      </header>

      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Elige tu sucursal</h2>
        <p className="text-white/50">¿Dónde quieres ser atendido hoy?</p>
      </div>

      <div className="flex-1 space-y-4">
        {loading ? (
          [1, 2].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
          ))
        ) : (
          branches.map((branch, index) => {
            const status = getBranchStatus(branch);
            
            return (
                <motion.div
                key={branch.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelect(branch)}
                className={`group cursor-pointer relative overflow-hidden rounded-3xl bg-[#121212] border transition-all duration-300 p-1
                    ${status.isOpen 
                        ? 'border-white/5 hover:border-amber-500/30' 
                        : 'border-white/5 opacity-80 hover:opacity-100'
                    }
                `}
                >
                {/* Main Content Area */}
                <div className="p-5 relative z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-xl font-bold text-white group-hover:text-amber-500 transition-colors">
                                    {branch.nombre}
                                </h3>
                                {/* Status Indicator */}
                                <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border
                                    ${status.isOpen 
                                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                    }
                                `}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span>{status.isOpen ? 'Abierto' : 'Cerrado'}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-1.5 text-white/50 mb-4">
                                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                <p className="text-sm leading-snug">{branch.direccion}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        {/* Map Button (Apple Style Pill) */}
                        <div className="flex gap-2">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(branch.mapa_url, '_blank');
                                }}
                                className="flex items-center space-x-2 bg-white/5 hover:bg-white/15 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 transition-all active:scale-95 group/map"
                            >
                                <Map className="w-4 h-4 text-amber-500 group-hover/map:text-amber-400" />
                                <span className="text-xs font-semibold text-white/80 group-hover/map:text-white">Mapa</span>
                            </button>
                            {status.isOpen && (
                                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 text-white/30 text-xs">
                                    <Clock className="w-3 h-3" />
                                    <span>9:00 - 21:00</span>
                                </div>
                            )}
                        </div>

                        {/* Selection Visual Cue */}
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
                            <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-black" />
                        </div>
                    </div>
                </div>
                
                {/* Subtle Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-transparent to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
                </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};