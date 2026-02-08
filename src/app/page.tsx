'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { Layout } from '@/components/ui/Layout';
import { BookingProvider, useBooking } from '@/store/BookingContext';
import { Hero } from '@/components/steps/Hero';
import { BranchSelection } from '@/components/steps/BranchSelection';
import { ServiceSelection } from '@/components/steps/ServiceSelection';
import { BarberSelection } from '@/components/steps/BarberSelection';
import { TimeSelection } from '@/components/steps/TimeSelection';
import { Identity } from '@/components/steps/Identity';
import { Confirmation } from '@/components/steps/Confirmation';
import { Success } from '@/components/steps/Success';

// Note: ISR (revalidate) config is not used here because this is a client component
// Cache optimization is handled via headers in next.config.mjs

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

export default function HomePage() {
    return (
        <BookingProvider>
            <Layout>
                <FlowManager />
                <Toaster
                    position="top-center"
                    theme="dark"
                    toastOptions={{
                        style: {
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            borderRadius: '16px',
                        },
                        className: 'font-sans'
                    }}
                />
            </Layout>
        </BookingProvider>
    );
}
