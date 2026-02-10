'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { useBooking } from '../../store/BookingContext';
import { supabaseApi } from '../../lib/supabaseApi';
import { Barber } from '../../types';

export const BarberSelection: React.FC = () => {
  const { setStep, setBarber, selectedServices, selectedBranch } = useBooking();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... same effect
    const fetchBarbers = async () => {
      if (selectedBranch) {
        const data = await supabaseApi.getBarbers(selectedBranch.id);
        setBarbers(data);
      }
      setLoading(false);
    };
    fetchBarbers();
  }, [selectedBranch]);

  const handleSelect = (barber: Barber) => {
    setBarber(barber);
    setStep(4); // Go to Time
  };

  return (
    <div className="flex flex-col h-full pt-8 px-6 pb-6">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => setStep(2)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <span className="text-xs font-medium text-white/40 tracking-widest uppercase">Paso 3 de 5</span>
      </header>

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Elige a tu experto</h2>
        <p className="text-white/50">
          Para {selectedServices.length > 1 ? 'tus servicios' : <span className="text-amber-500">{selectedServices[0]?.nombre}</span>} en {selectedBranch?.nombre}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />)
        ) : barbers.length > 0 ? (
          barbers.map((barber, index) => (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelect(barber)}
              className="cursor-pointer group rounded-3xl bg-[#121212] border border-white/5 hover:border-amber-500/50 hover:bg-white/5 transition-all duration-300 p-6 flex flex-col items-center text-center shadow-lg hover:shadow-amber-500/10"
            >
              {/* Circular Image Container */}
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full p-1 border-2 border-white/10 group-hover:border-amber-500/50 transition-colors relative overflow-hidden">
                  <Image
                    src={barber.foto_url}
                    alt={barber.nombre}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                {barber.activo && (
                  <div className="absolute bottom-1 right-1 w-5 h-5 z-10 bg-[#121212] rounded-full flex items-center justify-center border border-white/10">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-white group-hover:text-amber-500 transition-colors">{barber.nombre}</h3>
                <p className="text-xs text-white/50 line-clamp-2">{barber.bio_corta}</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 text-center text-white/40 py-10 italic">
            No hay barberos disponibles en esta sucursal.
          </div>
        )}
      </div>
    </div >
  );
};