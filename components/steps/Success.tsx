'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useBooking } from '../../store/BookingContext';

export const Success: React.FC = () => {
  const { selectedDate, selectedTime, selectedBranch, resetBooking } = useBooking();

  return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full px-6 py-12 text-center"
    >
      <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-8">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </div>

      <h2 className="text-3xl font-bold text-white mb-4">¡Reserva Exitosa!</h2>
      <p className="text-white/60 text-lg mb-12">
        Te esperamos en <span className="text-white font-semibold">{selectedBranch?.nombre}</span> el <span className="text-white font-semibold">{selectedDate?.toLocaleDateString()}</span> a las <span className="text-white font-semibold">{selectedTime}</span>.
      </p>

      <div className="w-full space-y-4">
        {/* Primary Action is now Back to Home */}
        <button
            onClick={resetBooking}
            className="w-full py-4 rounded-full bg-white text-black font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300"
        >
            Volver al Inicio
        </button>
      </div>
    </motion.div>
  );
};