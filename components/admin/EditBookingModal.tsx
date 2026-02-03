import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, Scissors, User, Save, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseApi } from '../../lib/mockSupabase';
import { Booking, Barber, Service } from '../../types';
import { format } from 'date-fns';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSuccess: () => void;
  barbers: Barber[];
  services: Service[];
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  isOpen, onClose, booking, onSuccess, barbers, services
}) => {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [barberId, setBarberId] = useState('');

  useEffect(() => {
    if (booking && isOpen) {
      // Pre-fill form
      setDate(format(booking.fecha_hora, 'yyyy-MM-dd'));
      setTime(format(booking.fecha_hora, 'HH:mm'));
      setServiceId(booking.servicio.id);
      setBarberId(booking.barbero.id);
    }
  }, [booking, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setLoading(true);
    try {
        const [year, month, day] = date.split('-').map(Number);
        const fullDate = new Date(year, month - 1, day);

        await supabaseApi.updateBookingDetails(booking.id, {
            date: fullDate,
            time,
            serviceId,
            barberId
        });

        toast.success("Reserva actualizada");
        onSuccess();
        onClose();
    } catch (error) {
        toast.error("Error al actualizar");
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]">
                <div>
                    <h2 className="text-xl font-bold text-white">Editar Reserva</h2>
                    <p className="text-xs text-white/50">{booking.cliente.nombre_completo}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                {/* Service */}
                <div className="space-y-2">
                    <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Servicio</label>
                    <div className="relative">
                        <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <select 
                            value={serviceId}
                            onChange={e => setServiceId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-amber-500 focus:outline-none appearance-none"
                        >
                            {services.map(s => <option key={s.id} value={s.id} className="bg-[#121212]">{s.nombre} - {s.precio}Bs</option>)}
                        </select>
                    </div>
                </div>

                {/* Barber */}
                <div className="space-y-2">
                    <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Barbero</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <select 
                            value={barberId}
                            onChange={e => setBarberId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-amber-500 focus:outline-none appearance-none"
                        >
                            {barbers.map(b => <option key={b.id} value={b.id} className="bg-[#121212]">{b.nombre}</option>)}
                        </select>
                    </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Fecha</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input 
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-amber-500 focus:outline-none [color-scheme:dark]"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Hora</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input 
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-amber-500 focus:outline-none [color-scheme:dark]"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button 
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-amber-500 text-black font-bold py-3.5 rounded-xl hover:bg-amber-400 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/10"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>Guardar Cambios</span>
                    </button>
                </div>

            </form>
        </motion.div>
    </div>
  );
};