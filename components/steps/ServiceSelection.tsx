import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock } from 'lucide-react';
import { useBooking } from '../../store/BookingContext';
import { bookingService } from '../../lib/services';
import type { Service } from '../../lib/supabase/types';

export const ServiceSelection: React.FC = () => {
  const { setStep, setService, selectedBranch } = useBooking();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      const data = await bookingService.getServices();
      setServices(data);
      setLoading(false);
    };
    fetchServices();
  }, []);

  const handleSelect = (service: Service) => {
    setService(service);
    setStep(3); // Go to Barbers
  };

  return (
    <div className="flex flex-col h-full pt-8 px-6 pb-6">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => setStep(1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <span className="text-xs font-medium text-white/40 tracking-widest uppercase">Paso 2 de 5</span>
      </header>

      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Elige tu servicio</h2>
        <p className="text-white/50">
          En sucursal <span className="text-amber-500">{selectedBranch?.nombre}</span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </>
          ) : (
            services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelect(service)}
                className="group cursor-pointer relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-white/10 transition-all duration-300 p-5"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-amber-500 transition-colors">
                    {service.nombre}
                  </h3>
                  <div className="flex items-center space-x-1 text-amber-500 shrink-0 ml-2">
                    <span className="text-lg font-bold">{service.precio} Bs</span>
                  </div>
                </div>

                <p className="text-white/60 text-xs mb-4 leading-relaxed line-clamp-2">
                  {service.descripcion}
                </p>

                <div className="flex items-center text-xs text-white/40 space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{service.duracion_min} min</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};