import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Scissors, Clock, CheckCircle2, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseApi } from '../../lib/mockSupabase';
import { Barber, Service, Client, BookingStatus } from '../../types';

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'phone' | 'details'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  const [client, setClient] = useState<Client | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');

  // Pre-load data
  useEffect(() => {
    if (isOpen) {
        setStep('phone');
        setPhone('');
        setName('');
        setClient(null);
        Promise.all([supabaseApi.getBarbers(), supabaseApi.getServices()])
            .then(([b, s]) => {
                setBarbers(b);
                setServices(s);
                // Default selections
                if(b.length > 0) setSelectedBarberId(b[0].id);
                if(s.length > 0) setSelectedServiceId(s[0].id);
            });
    }
  }, [isOpen]);

  // Debounce check phone
  useEffect(() => {
    const checkPhone = async () => {
        if(phone.length >= 8) {
            setIsChecking(true);
            try {
                const found = await supabaseApi.checkClientByPhone(phone);
                setClient(found);
            } finally {
                setIsChecking(false);
            }
        } else {
            setClient(null);
        }
    };
    const timer = setTimeout(checkPhone, 500);
    return () => clearTimeout(timer);
  }, [phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        // 1. Ensure client exists
        let currentClient = client;
        if (!currentClient) {
            if(!name.trim()) {
                toast.error("Nombre requerido para cliente nuevo");
                setLoading(false);
                return;
            }
            currentClient = await supabaseApi.createClient(phone, name);
        }

        // 2. Create Booking (Immediate)
        await supabaseApi.createBooking({
            clientPhone: currentClient.celular,
            barberId: selectedBarberId,
            serviceId: selectedServiceId,
            date: new Date(), // NOW
            status: BookingStatus.CONFIRMADO,
            origin: 'walkin',
            branchId: 'b1' // Defaulting to first branch for walkins
        });

        toast.success(`Walk-in registrado: ${currentClient.nombre_completo}`);
        onSuccess();
        onClose();

    } catch (error) {
        toast.error("Error al registrar walk-in");
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#121212]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-500" />
                    Cliente en Puerta
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* 1. Phone Input */}
                <div className="space-y-2">
                    <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Celular Cliente</label>
                    <div className="relative">
                        <input 
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Buscar o ingresar número..."
                            autoFocus
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-4 pl-4 pr-12 text-xl font-bold text-white focus:border-amber-500 focus:outline-none placeholder-white/10"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {isChecking ? <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> : (
                                client ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Search className="w-5 h-5 text-white/20" />
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Identity State */}
                <AnimatePresence mode="wait">
                    {client ? (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-500 text-black flex items-center justify-center font-bold">
                                {client.nombre_completo.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-white">{client.nombre_completo}</p>
                                <p className="text-xs text-white/50 capitalize">{client.ranking}</p>
                            </div>
                        </motion.div>
                    ) : (
                        phone.length >= 8 && !isChecking && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2"
                            >
                                <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Nombre Nuevo Cliente</label>
                                <input 
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nombre Completo"
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-amber-500 focus:outline-none"
                                />
                            </motion.div>
                        )
                    )}
                </AnimatePresence>

                <div className="w-full h-px bg-white/5" />

                {/* 3. Fast Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                         <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Barbero</label>
                         <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <select 
                                value={selectedBarberId}
                                onChange={(e) => setSelectedBarberId(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-2 text-white text-sm focus:border-amber-500 focus:outline-none appearance-none"
                            >
                                {barbers.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                            </select>
                         </div>
                    </div>
                    <div className="space-y-2">
                         <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Servicio</label>
                         <div className="relative">
                            <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <select 
                                value={selectedServiceId}
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-2 text-white text-sm focus:border-amber-500 focus:outline-none appearance-none"
                            >
                                {services.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                         </div>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={loading || (phone.length < 8)}
                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-white/10"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                    <span>Ingresar AHORA</span>
                </button>

            </form>
        </motion.div>
    </div>
  );
};