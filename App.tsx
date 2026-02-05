import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { Layout } from './components/ui/Layout';
import { BookingProvider, useBooking } from './store/BookingContext';
import { Hero } from './components/steps/Hero';
import { BranchSelection } from './components/steps/BranchSelection';
import { ServiceSelection } from './components/steps/ServiceSelection';
import { BarberSelection } from './components/steps/BarberSelection';
import { TimeSelection } from './components/steps/TimeSelection';
import { Identity } from './components/steps/Identity';
import { Confirmation } from './components/steps/Confirmation';
import { Success } from './components/steps/Success';
import { AdminPanel } from './components/admin/AdminPanel';
import { AdminLogin } from './components/admin/AdminLogin';

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

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check URL param or hash for quick admin access (optional)
  React.useEffect(() => {
    try {
        if (window.location.hash === '#admin') {
            setIsAdminMode(true);
        }
    } catch (e) {
        console.warn('Unable to read location hash');
    }
  }, []);

  const handleExitAdmin = () => {
    setIsAuthenticated(false);
    setIsAdminMode(false);
    try {
        // Attempt to clear hash safely
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } else {
            window.location.hash = '';
        }
    } catch (e) {
        console.warn('Unable to clear location hash', e);
    }
  };

  if (isAdminMode) {
      if (isAuthenticated) {
          return (
              <>
                <AdminPanel onLogout={handleExitAdmin} />
                <Toaster position="top-right" theme="dark" />
              </>
          );
      }
      return (
        <>
            <AdminLogin onLogin={() => setIsAuthenticated(true)} onBack={handleExitAdmin} />
            <Toaster position="top-center" theme="dark" />
        </>
      );
  }

  return (
    <BookingProvider>
      <Layout>
        <FlowManager />
        {/* Trigger oculto o botón pequeño en el layout para admin */}
        <div className="fixed bottom-4 left-0 w-full flex justify-center pointer-events-none z-50 opacity-0 hover:opacity-100 transition-opacity duration-500">
            <button 
                onClick={() => setIsAdminMode(true)} 
                className="pointer-events-auto text-[10px] text-white/20 hover:text-amber-500 uppercase tracking-widest"
            >
                Staff Access
            </button>
        </div>
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

export default App;