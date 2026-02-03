import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useBooking } from '../../store/BookingContext';
import { supabaseApi } from '../../lib/mockSupabase';
import { Barber } from '../../types';

export const BarberSelection: React.FC = () => {
  const { setStep, setBarber, selectedService } = useBooking();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarbers = async () => {
      const data = await supabaseApi.getBarbers();
      setBarbers(data);
      setLoading(false);
    };
    fetchBarbers();
  }, []);

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
          Para tu <span className="text-amber-500">{selectedService?.nombre}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />)
        ) : (
          barbers.map((barber, index) => (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelect(barber)}
              className="cursor-pointer relative group rounded-3xl overflow-hidden aspect-[3/4] border border-white/5 hover:border-amber-500/50 transition-all duration-300"
            >
              <img 
                src={barber.foto_url} 
                alt={barber.nombre} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 grayscale group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-lg font-bold text-white">{barber.nombre}</h3>
                <p className="text-xs text-white/60">{barber.bio_corta}</p>
                {barber.activo && (
                   <div className="flex items-center mt-2 space-x-1">
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[10px] uppercase tracking-wide text-green-500/80">Disponible</span>
                   </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};