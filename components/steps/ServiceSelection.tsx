'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock } from 'lucide-react';
import { useBooking } from '../../store/BookingContext';
import { supabaseApi } from '../../lib/supabaseApi';
import { Service } from '../../types';

export const ServiceSelection: React.FC = () => {
  const { setStep, toggleService, selectedServices, selectedBranch } = useBooking();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      const data = await supabaseApi.getServices();
      setServices(data);
      setLoading(false);
    };
    fetchServices();
  }, []);

  const handleToggle = (service: Service) => {
    toggleService(service);
  };

  const handleContinue = () => {
    if (selectedServices.length > 0) {
      setStep(3);
    }
  };

  return (
    <div className="flex flex-col h-full pt-8 px-6 pb-6 relative">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => setStep(1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <span className="text-xs font-medium text-white/40 tracking-widest uppercase">Paso 2 de 5</span>
      </header>

      <div className="mb-4">
        <h2 className="text-3xl font-bold text-white mb-1">Elige tus servicios</h2>
        <p className="text-white/50 text-sm">
          Puedes seleccionar uno o varios.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar pb-24">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          services.map((service, index) => {
            const isSelected = selectedServices.some(s => s.id === service.id);
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleToggle(service)}
                className={`group cursor-pointer relative overflow-hidden rounded-2xl border transition-all duration-200 p-4
                    ${isSelected
                    ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-base font-bold transition-colors ${isSelected ? 'text-amber-500' : 'text-white'}`}>
                    {service.nombre}
                  </h3>
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <span className={`text-sm font-bold ${isSelected ? 'text-amber-500' : 'text-white/80'}`}>{service.precio} Bs</span>
                  </div>
                </div>

                <p className="text-white/50 text-xs mb-2 leading-relaxed line-clamp-2">
                  {service.descripcion}
                </p>

                <div className="flex items-center text-[10px] text-white/40 space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{service.duracion_min} min</span>
                  </div>
                </div>

                {/* Checkmark for selected */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* FOOTER ACTION */}
      <div className="absolute bottom-6 left-6 right-6 pt-4 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent">
        <button
          onClick={handleContinue}
          disabled={selectedServices.length === 0}
          className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-xl
                ${selectedServices.length > 0
              ? 'bg-white text-black hover:scale-[1.02] shadow-white/10'
              : 'bg-white/10 text-white/20 cursor-not-allowed'}
            `}
        >
          Continuar ({selectedServices.length})
        </button>
      </div>
    </div>
  );
};