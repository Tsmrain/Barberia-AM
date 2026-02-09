'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image'; // Vercel Optimization
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
            Optimized Logo 
            priority={true} is crucial for LCP (Largest Contentful Paint) score 
        */}
        <div className="relative w-[220px] md:w-[280px] h-[180px]">
          <Image
            src="/logo.png"
            alt="Barber Club Logo"
            fill
            className="object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] opacity-100"
            priority
            sizes="(max-width: 768px) 220px, 280px"
          />
        </div>

        {/* Brand Subtitle */}
        <h3 className="font-serif text-2xl md:text-3xl text-white tracking-[0.2em] uppercase mt-8 font-bold">
          Barber Club
        </h3>


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
        <span className="text-[10px] text-white/10 uppercase tracking-widest">
          Premium Experience
        </span>
      </div>
    </motion.div>
  );
};