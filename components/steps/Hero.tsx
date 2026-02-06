import React from 'react';
import { motion } from 'framer-motion';
import { useBooking } from '../../store/BookingContext';

export const Hero: React.FC = () => {
  const { setStep } = useBooking();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-screen px-6 text-center relative"
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center mb-16">
        {/* 
            IMPORTANTE PARA EL USUARIO:
            Guarda la imagen del logo que enviaste como 'logo.png' en la carpeta 'public' de tu proyecto.
            El código intentará cargar '/logo.png'. Si no existe, mostrará el texto de respaldo.
        */}
        <img
          src="/logo.png"
          alt="Andy Martinez Barber Club"
          className="w-[280px] md:w-[340px] h-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          onError={(e) => {
            // Si la imagen falla (no existe logo.png), ocultamos la imagen y mostramos el texto
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = document.getElementById('logo-fallback');
            if (fallback) fallback.classList.remove('hidden');
            if (fallback) fallback.classList.add('flex');
          }}
        />

        {/* Fallback de texto (Solo visible si falla la imagen) */}
        <div id="logo-fallback" className="hidden flex-col items-center">
          <h1 className="font-serif text-[100px] leading-[0.8] text-white italic font-bold tracking-tighter mix-blend-overlay opacity-90">
            AM
          </h1>
          <div className="w-16 h-1 bg-white/80 rounded-full mt-2 mb-4 mx-auto" />
          <h2 className="font-serif text-3xl md:text-4xl text-white font-normal tracking-wide uppercase">
            Andy Martinez
          </h2>
          <h3 className="font-serif text-lg text-white/90 tracking-widest uppercase mt-1">
            Barber Club
          </h3>
        </div>
      </div>

      {/* Button container */}
      <div className="w-full max-w-xs relative z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setStep(1)}
          className="w-full bg-white text-black font-semibold py-4 rounded-full text-lg shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:shadow-[0_0_40px_rgba(255,255,255,0.6)] transition-all duration-300"
        >
          Reservar Ahora
        </motion.button>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <a href="#admin" className="text-[10px] text-white/10 uppercase tracking-widest hover:text-white/30 transition-colors">
          Staff Access
        </a>
      </div>
    </motion.div>
  );
};