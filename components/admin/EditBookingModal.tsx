import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, Scissors, User, Save, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseApi } from '../../lib/mockSupabase';
import { Booking, Barber, Service, BookingStatus } from '../../types';
import { format } from 'date-fns';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSuccess: () => void;
  barbers: Barber[];
  services: Service[];
}

const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00', '21:00'
];

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  isOpen, onClose, booking, onSuccess, barbers, services
}) => {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [barberId, setBarberId] = useState('');
  const [status, setStatus] = useState<BookingStatus>(BookingStatus.PENDIENTE);
  
  // Local state for filtered barbers based on branch
  const [availableBarbers, setAvailableBarbers] = useState<Barber[]>([]);

  useEffect(() => {
    if (booking && isOpen) {
      // Pre-fill form
      setDate(format(booking.fecha_hora, 'yyyy-MM-dd'));
      // Format time simply as HH:00 to match slots
      const hour = format(booking.fecha_hora, 'HH:00');
      setSelectedTime(hour);
      setServiceId(booking.servicio.id);
      setBarberId(booking.barbero.id);
      setStatus(booking.estado);

      // Filter barbers: Only show barbers that work at the booking's branch
      // OR the barber currently assigned to the booking (in case they moved but booking remains)
      const filtered = barbers.filter(b => 
          b.sucursalId === booking.sucursal.id || b.id === booking.barbero.id
      );
      setAvailableBarbers(filtered);
    }
  }, [booking, isOpen, barbers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    if (!selectedTime) {
        toast.error("Por favor selecciona una hora");
        return;
    }

    setLoading(true);
    try {
        const [year, month, day] = date.split('-').map(Number);
        const fullDate = new Date(year, month - 1, day);

        await supabaseApi.updateBookingDetails(booking.id, {
            date: fullDate,
            time: selectedTime,
            serviceId,
            barberId,
            status: status
        });

        toast.success("Reserva actualizada correctamente");
        onSuccess(); // Refresh parent
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
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
        
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#121212] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a] shrink-0">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">Gestionar Cita</h2>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold
                            ${booking.estado === BookingStatus.CONFIRMADO ? 'bg-green-500/20 text-green-500' : 
                              booking.estado === BookingStatus.COMPLETADO ? 'bg-blue-500/20 text-blue-500' :
                              booking.estado === BookingStatus.NO_SHOW ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}
                        `}>
                            {booking.estado.replace('_', ' ')}
                        </span>
                    </div>
                    <p className="text-xs text-white/50">
                        Ticket: {booking.id.toUpperCase().slice(0,6)} • {booking.sucursal.nombre}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                
                {/* Client Info Readonly */}
                <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold">
                        {booking.cliente.nombre_completo.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">{booking.cliente.nombre_completo}</p>
                        <p className="text-xs text-white/50">{booking.cliente.celular}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Service */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Servicio</label>
                            <div className="relative">
                                <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <select 
                                    value={serviceId}
                                    onChange={e => setServiceId(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-amber-500 focus:outline-none appearance-none text-sm"
                                >
                                    {services.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Barber (Filtered by Branch) */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Barbero</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <select 
                                    value={barberId}
                                    onChange={e => setBarberId(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-amber-500 focus:outline-none appearance-none text-sm"
                                >
                                    {availableBarbers.map(b => (
                                        <option key={b.id} value={b.id}>{b.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Fecha</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input 
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-amber-500 focus:outline-none [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Status */}
                         <div className="space-y-2">
                            <label className="text-xs text-white/40 uppercase tracking-wider font-bold">Estado</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <select 
                                    value={status}
                                    onChange={e => setStatus(e.target.value as BookingStatus)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-amber-500 focus:outline-none appearance-none text-sm capitalize"
                                >
                                    {Object.values(BookingStatus).map((s) => (
                                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Time Grid Selection */}
                    <div className="space-y-3">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-bold flex items-center justify-between">
                            <span>Horario (1 Hora)</span>
                            {selectedTime && <span className="text-amber-500">{selectedTime}</span>}
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {TIME_SLOTS.map(time => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => setSelectedTime(time)}
                                    className={`
                                        py-2 px-1 rounded-lg text-xs font-bold border transition-all duration-200
                                        ${selectedTime === time 
                                            ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20' 
                                            : 'bg-[#0a0a0a] text-white/60 border-white/10 hover:border-white/30 hover:text-white'
                                        }
                                    `}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    {/* Primary Update Action (Save Changes) */}
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-white/10"
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