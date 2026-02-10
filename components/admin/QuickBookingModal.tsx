'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Scissors, Clock, CheckCircle2, User, Loader2, MapPin, Calendar, ChevronDown, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseApi } from '../../lib/supabaseApi';
import { Barber, Service, Client, BookingStatus, Branch } from '../../types';

interface QuickBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00', '21:00'
];

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    // Date & Time State
    const [customDate, setCustomDate] = useState('');
    const [customTime, setCustomTime] = useState('');

    const [client, setClient] = useState<Client | null>(null);
    const [possibleMatches, setPossibleMatches] = useState<Client[]>([]);

    // Data
    const [branches, setBranches] = useState<Branch[]>([]);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // Selections
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedBarberId, setSelectedBarberId] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');

    // Initial Load (Branches & Services)
    useEffect(() => {
        if (isOpen) {
            setPhone('');
            setName('');
            setClient(null);

            // Init Date & Time defaults
            const now = new Date();
            setCustomDate(now.toISOString().split('T')[0]); // YYYY-MM-DD

            // Default time logic: Nearest current hour if in range, otherwise 09:00
            const currentHour = now.getHours();
            const formattedHour = `${currentHour.toString().padStart(2, '0')}:00`;
            const initialTime = TIME_SLOTS.includes(formattedHour) ? formattedHour : '09:00';
            setCustomTime(initialTime);

            Promise.all([supabaseApi.getBranches(), supabaseApi.getServices()])
                .then(([b, s]) => {
                    setBranches(b);
                    setServices(s);
                    // Default selections
                    if (b.length > 0) setSelectedBranchId(b[0].id);
                    if (s.length > 0) setSelectedServiceId(s[0].id);
                });
        }
    }, [isOpen]);

    // Load Barbers when Branch changes
    useEffect(() => {
        if (selectedBranchId) {
            supabaseApi.getBarbers(selectedBranchId).then(data => {
                setBarbers(data);
                if (data.length > 0) {
                    setSelectedBarberId(data[0].id);
                } else {
                    setSelectedBarberId('');
                }
            });
        }
    }, [selectedBranchId]);

    // Real-time Phone Check
    useEffect(() => {
        const isValidLength = phone.length >= 8 && phone.length <= 12;

        const checkPhone = async () => {
            if (isValidLength) {
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
            if (!customDate || !customTime) {
                toast.error("Selecciona fecha y hora");
                setLoading(false);
                return;
            }

            if (!selectedBarberId || !selectedServiceId || !selectedBranchId) {
                toast.error("Faltan datos de la cita");
                setLoading(false);
                return;
            }

            // --- CONSTRUCCIÓN Y VALIDACIÓN DE FECHA ---
            const [year, month, day] = customDate.split('-').map(Number);
            const [hours, minutes] = customTime.split(':').map(Number);

            // Crear objeto Date con la fecha y hora seleccionada
            const selectedDateTime = new Date(year, month - 1, day, hours, minutes);
            const now = new Date();

            // 1. Validar Rango de Operación (09:00 - 21:00)
            if (hours < 9 || (hours >= 21 && minutes > 0)) {
                toast.error("La barbería atiende de 09:00 a 21:00");
                setLoading(false);
                return;
            }

            // 2. Validar Tiempo Pasado
            if (selectedDateTime.getTime() < now.getTime()) {
                toast.error("No puedes agendar en el pasado", {
                    description: "La fecha y hora seleccionada ya pasó."
                });
                setLoading(false);
                return;
            }

            // 3. AVAILABILITY GUARD (Validar doble reserva)
            // Obtenemos los slots ocupados para ese barbero en ese día
            const takenSlots = await supabaseApi.getTakenSlots(selectedDateTime, selectedBarberId);
            if (takenSlots.includes(customTime)) {
                toast.error("Horario no disponible", {
                    description: "Este barbero ya tiene una cita agendada a esta hora.",
                    icon: <Ban className="w-5 h-5 text-red-500" />,
                    style: {
                        borderColor: 'rgba(239, 68, 68, 0.2)',
                        background: 'rgba(20, 0, 0, 0.6)'
                    }
                });
                setLoading(false);
                return;
            }
            // -----------------------------

            let currentClient = client;
            if (!currentClient) {
                if (!name.trim()) {
                    toast.error("El cliente es nuevo. Ingresa su nombre.");
                    setLoading(false);
                    return;
                }
                currentClient = await supabaseApi.createClient(phone, name);
            }

            await supabaseApi.createBooking({
                clientPhone: currentClient.celular,
                barberId: selectedBarberId,
                serviceId: selectedServiceId,
                branchId: selectedBranchId,
                date: selectedDateTime, // Pasamos el objeto Date completo
                time: customTime,
                status: BookingStatus.CONFIRMADO,
                origin: 'walkin'
            });

            toast.success(`Cita agendada para: ${currentClient.nombre_completo}`);
            onSuccess();
            onClose();

        } catch (error) {
            console.error(error);
            toast.error("Error al crear cita");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isPhoneValid = phone.length >= 8;
    const canSubmit = isPhoneValid && (client || name.length > 0) && !isChecking && selectedBarberId !== '' && customTime !== '' && customDate !== '';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar"
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#121212]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-amber-500" />
                        Agendar Cita
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* 1. Phone Input */}
                    <div className="space-y-2">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Celular Cliente</label>
                        <div className="relative">
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Solo números
                                placeholder="Ej: 70012345"
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

                    <AnimatePresence mode="wait">
                        {client ? (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl flex items-center gap-3 relative overflow-hidden"
                            >
                                <div className="w-10 h-10 rounded-full bg-green-500 text-black flex items-center justify-center font-bold relative z-10">
                                    {client.nombre_completo.charAt(0)}
                                </div>
                                <div className="relative z-10">
                                    <p className="font-bold text-white">{client.nombre_completo}</p>
                                    <p className="text-xs text-white/50 capitalize">{client.ranking}</p>
                                </div>
                                {/* Visual confirmation graphic */}
                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 text-green-500/10" />
                            </motion.div>
                        ) : (
                            isPhoneValid && !isChecking && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Nombre Nuevo Cliente</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^a-zA-Z\s\u00C0-\u00FF]/g, '');
                                                setName(val);
                                                // Trigger search (debounced ideally, simplified here)
                                                if (val.length > 2) {
                                                    supabaseApi.searchClientsByName(val).then(matches => {
                                                        // Filter out if currently checking (though mock is fast)
                                                        setPossibleMatches(matches);
                                                    });
                                                } else {
                                                    setPossibleMatches([]);
                                                }
                                            }}
                                            placeholder="Nombre Completo"
                                            className="w-full bg-[#0a0a0a] border border-amber-500/50 rounded-xl py-3 px-4 text-white focus:border-amber-500 focus:outline-none"
                                        />
                                    </div>

                                    {/* Smart suggestions for returning clients with new number */}
                                    {possibleMatches.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 space-y-2"
                                        >
                                            <p className="text-xs text-blue-200 font-medium flex items-center gap-2">
                                                <User className="w-3 h-3" />
                                                ¿Es alguno de estos clientes anteriores?
                                            </p>
                                            <div className="space-y-1">
                                                {possibleMatches.slice(0, 3).map(match => (
                                                    <button
                                                        key={match.celular}
                                                        type="button"
                                                        onClick={async () => {
                                                            const toastId = toast.loading("Actualizando número...");
                                                            await supabaseApi.updateClientPhone(match.celular, phone);
                                                            const updated = await supabaseApi.checkClientByPhone(phone);
                                                            setClient(updated);
                                                            setPossibleMatches([]);
                                                            toast.success("Número actualizado", { id: toastId });
                                                        }}
                                                        className="w-full text-left p-2 hover:bg-white/5 rounded-lg flex justify-between items-center group transition-colors"
                                                    >
                                                        <div>
                                                            <span className="text-sm font-bold text-white block">{match.nombre_completo}</span>
                                                            <span className="text-[10px] text-white/40 block">Antiguo: {match.celular}</span>
                                                        </div>
                                                        <span className="text-xs text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Usar este
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )
                        )}
                    </AnimatePresence>

                    <div className="w-full h-px bg-white/5" />

                    {/* 3. Branch Selector */}
                    <div className="space-y-2">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Sucursal</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-amber-500 focus:outline-none appearance-none"
                            >
                                {branches.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronDown className="w-4 h-4 text-white/30" />
                            </div>
                        </div>
                    </div>

                    {/* 4. Date & Time Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Fecha</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    type="date"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-2 text-white text-sm focus:border-amber-500 focus:outline-none [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Hora</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <select
                                    value={customTime}
                                    onChange={(e) => setCustomTime(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-8 text-white text-sm focus:border-amber-500 focus:outline-none appearance-none"
                                >
                                    {TIME_SLOTS.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-4 h-4 text-white/30" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Barber & Service */}
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
                                    {barbers.length > 0 ? (
                                        barbers.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)
                                    ) : (
                                        <option value="" disabled>Sin barberos aquí</option>
                                    )}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-4 h-4 text-white/30" />
                                </div>
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
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-4 h-4 text-white/30" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !canSubmit}
                        className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg ${canSubmit
                            ? 'bg-white text-black hover:bg-white/90 shadow-white/10'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                        <span>Agendar Cita</span>
                    </button>

                </form>
            </motion.div>
        </div>
    );
};