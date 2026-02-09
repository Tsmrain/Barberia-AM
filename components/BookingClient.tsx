'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BookingProvider, useBooking } from '../store/BookingContext';
import { Hero } from './steps/Hero';
import { BranchSelection } from './steps/BranchSelection';
import { ServiceSelection } from './steps/ServiceSelection';
import { BarberSelection } from './steps/BarberSelection';
import { TimeSelection } from './steps/TimeSelection';
import { Identity } from './steps/Identity';
import { Confirmation } from './steps/Confirmation';
import { Success } from './steps/Success';

const FlowManager: React.FC = () => {
  const { step } = useBooking();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-full"
      >
        {step === 0 && <Hero />}
        {step === 1 && <BranchSelection />}
        {step === 2 && <ServiceSelection />}
        {step === 3 && <BarberSelection />}
        {step === 4 && <TimeSelection />}
        {step === 5 && <Identity />}
        {step === 6 && <Confirmation />}
        {step === 7 && <Success />}
      </motion.div>
    </AnimatePresence>
  );
};

export const BookingClient = () => {
  const router = useRouter();

  return (
    <BookingProvider>
        <FlowManager />
        
        {/* Admin Access Trigger */}
        <div className="fixed bottom-4 left-0 w-full flex justify-center pointer-events-none z-50 opacity-0 hover:opacity-100 transition-opacity duration-500">
            <button 
                onClick={() => router.push('/admin')} 
                className="pointer-events-auto text-[10px] text-white/20 hover:text-amber-500 uppercase tracking-widest"
            >
                Staff Access
            </button>
        </div>
    </BookingProvider>
  );
};