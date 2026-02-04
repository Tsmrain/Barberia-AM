import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, isSameDay, setHours, setMinutes, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  User,
  MoreHorizontal,
  Scissors
} from 'lucide-react';
import { Booking, BookingStatus, Barber, Service } from '../../types';
import { supabaseApi } from '../../lib/mockSupabase';
import { EditBookingModal } from './EditBookingModal';

interface BookingsManagerProps {
  bookings: Booking[];
  loading: boolean;
  onRefresh: () => void;
}

// Generar horas de 09:00 a 21:00
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9); // [9, 10, ..., 21]

export const BookingsManager: React.FC<BookingsManagerProps> = ({ bookings, loading, onRefresh }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Fetch aux data
  useEffect(() => {
    Promise.all([
        supabaseApi.getBarbers(),
        supabaseApi.getServices()
    ]).then(([b, s]) => {
        setBarbers(b);
        setServices(s);
    });
  }, []);

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(startOfToday());

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsEditModalOpen(true);
  };

  // Filtrar reservas del día seleccionado (Mostramos todas menos CANCELADO para mantener historial visual, o mostramos todo con estilo distinto)
  // Decisión: Mostrar TODO lo que ocupe espacio o haya ocurrido
  const dayBookings = useMemo(() => {
    return bookings.filter(b => isSameDay(b.fecha_hora, selectedDate) && b.estado !== BookingStatus.CANCELADO);
  }, [bookings, selectedDate]);

  // Función para encontrar reserva en una celda específica (Barbero + Hora)
  const getBookingForSlot = (barberId: string, hour: number) => {
    return dayBookings.find(b => {
        const bookingHour = b.fecha_hora.getHours();
        return b.barbero.id === barberId && bookingHour === hour;
    });
  };

  if (loading) return <div className="text-white/50 p-8">Cargando calendario...</div>;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden">
        
        {/* Header: Date Navigation */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#121212]">
            <div className="flex items-center space-x-4">
                <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                    <button onClick={handlePrevDay} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={handleToday} className="px-4 text-sm font-bold text-white/80 hover:text-white transition-colors">
                        Hoy
                    </button>
                    <button onClick={handleNextDay} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <h2 className="text-2xl font-bold text-white capitalize flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-amber-500" />
                    {format(selectedDate, 'EEEE d MMMM', { locale: es })}
                </h2>
            </div>
            
            {/* Legend */}
            <div className="flex items-center space-x-4 text-xs font-medium text-white/40">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Pendiente</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Confirmado</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Finalizado</span>
                </div>
            </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto no-scrollbar relative">
            <div className="min-w-[800px]">
                {/* Grid Header (Barbers) */}
                <div className="sticky top-0 z-20 flex border-b border-white/5 bg-[#0a0a0a]">
                    <div className="w-20 shrink-0 border-r border-white/5 p-4 flex items-center justify-center text-white/30 font-mono text-xs">
                        HORA
                    </div>
                    {barbers.map(barber => (
                        <div key={barber.id} className="flex-1 p-4 flex items-center justify-center gap-3 border-r border-white/5 last:border-r-0 bg-[#0a0a0a]">
                            <img src={barber.foto_url} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                            <span className="font-bold text-white">{barber.nombre}</span>
                        </div>
                    ))}
                </div>

                {/* Grid Body (Time Slots) */}
                <div className="relative">
                    {HOURS.map(hour => (
                        <div key={hour} className="flex border-b border-white/5 h-28 hover:bg-white/[0.02] transition-colors group">
                            {/* Time Column */}
                            <div className="w-20 shrink-0 border-r border-white/5 flex flex-col items-center justify-center text-white/40 font-mono text-sm group-hover:text-white/70">
                                <span>{hour}:00</span>
                            </div>

                            {/* Barber Columns */}
                            {barbers.map(barber => {
                                const booking = getBookingForSlot(barber.id, hour);
                                return (
                                    <div key={`${barber.id}-${hour}`} className="flex-1 border-r border-white/5 last:border-r-0 p-2 relative">
                                        {booking ? (
                                            <CalendarCard booking={booking} onClick={() => handleEdit(booking)} />
                                        ) : (
                                            <div className="w-full h-full rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center opacity-0 hover:opacity-100 hover:border-white/10 transition-all cursor-default">
                                                <span className="text-xs text-white/20 uppercase font-bold tracking-widest">Libre</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>

      <EditBookingModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        booking={selectedBooking}
        onSuccess={onRefresh}
        barbers={barbers}
        services={services}
      />
    </div>
  );
};

// --- SUB COMPONENTS ---

const CalendarCard = ({ booking, onClick }: { booking: Booking; onClick: () => void }) => {
    const status = booking.estado;
    
    // Style Mapping
    let baseStyles = '';
    let stripeColor = '';
    let textStatus = '';
    let textStatusColor = '';

    switch(status) {
        case BookingStatus.CONFIRMADO:
            baseStyles = 'bg-green-500/10 border-green-500/20 hover:border-green-500/40';
            stripeColor = 'bg-green-500';
            textStatus = 'Confirmado';
            textStatusColor = 'text-green-400';
            break;
        case BookingStatus.COMPLETADO:
            baseStyles = 'bg-blue-900/10 border-blue-500/10 hover:border-blue-500/30 opacity-70 grayscale-[0.3]';
            stripeColor = 'bg-blue-500';
            textStatus = 'Finalizado';
            textStatusColor = 'text-blue-400';
            break;
        case BookingStatus.NO_SHOW:
            baseStyles = 'bg-red-900/10 border-red-500/20 opacity-60';
            stripeColor = 'bg-red-500';
            textStatus = 'No Show';
            textStatusColor = 'text-red-400 decoration-line-through';
            break;
        default: // PENDIENTE
            baseStyles = 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40';
            stripeColor = 'bg-amber-500';
            textStatus = 'Pendiente';
            textStatusColor = 'text-amber-400';
    }

    return (
        <motion.button
            layoutId={booking.id}
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
                w-full h-full text-left p-3 rounded-xl border flex flex-col justify-between shadow-lg relative overflow-hidden group
                ${baseStyles}
            `}
        >   
            {/* Status Indicator Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${stripeColor}`} />

            <div className="pl-2">
                <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${textStatusColor}`}>
                        {textStatus}
                    </span>
                    {booking.origen === 'walkin' && (
                        <span className="text-[9px] bg-white/10 text-white/60 px-1 rounded uppercase">Walk-in</span>
                    )}
                </div>
                
                <h4 className={`text-sm font-bold text-white leading-tight mb-1 line-clamp-2 ${status === BookingStatus.NO_SHOW ? 'line-through text-white/40' : ''}`}>
                    {booking.cliente.nombre_completo}
                </h4>
                
                <div className="flex items-center text-xs text-white/50 gap-1">
                    <Scissors className="w-3 h-3" />
                    <span className="truncate">{booking.servicio.nombre}</span>
                </div>
            </div>

            <div className="pl-2 flex justify-between items-end mt-1">
                 <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-white/40 font-mono">
                    {booking.cliente.celular}
                 </span>
                 {booking.cliente.ranking === 'vip' && (
                     <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 rounded">VIP</span>
                 )}
            </div>
        </motion.button>
    );
};