import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  addDays, 
  subDays, 
  isSameDay, 
  startOfWeek, 
  addWeeks, 
  subWeeks, 
  setHours,
  setMinutes
} from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  User,
  Scissors,
  Filter,
  GripHorizontal,
  Ban
} from 'lucide-react';
import { toast } from 'sonner';
import { Booking, BookingStatus, Barber, Service } from '../../types';
import { supabaseApi } from '../../lib/mockSupabase';
import { EditBookingModal } from './EditBookingModal';

interface BookingsManagerProps {
  bookings: Booking[];
  loading: boolean;
  onRefresh: () => void;
}

// Horas de operación (09:00 - 21:00)
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9); 

export const BookingsManager: React.FC<BookingsManagerProps> = ({ bookings, loading, onRefresh }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Data State
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  
  // Drag State
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Initial Fetch
  useEffect(() => {
    Promise.all([
        supabaseApi.getBarbers(),
        supabaseApi.getServices()
    ]).then(([b, s]) => {
        setBarbers(b);
        setServices(s);
    });
  }, []);

  // Navigation Logic
  const handlePrevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Generate Week Days (Monday to Friday)
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // 1 = Monday
    return Array.from({ length: 5 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  // Filtering Logic
  const filteredBookings = useMemo(() => {
    let filtered = bookings.filter(b => b.estado !== BookingStatus.CANCELADO);
    if (selectedBarberId !== 'all') {
        filtered = filtered.filter(b => b.barbero.id === selectedBarberId);
    }
    return filtered;
  }, [bookings, selectedBarberId]);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('bookingId', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Essential to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date, targetHour: number) => {
    e.preventDefault();
    const bookingId = e.dataTransfer.getData('bookingId');
    setDraggingId(null);

    if (!bookingId) return;

    // 1. Get the booking object being dragged
    const booking = bookings.find(b => b.id === bookingId);
    if(!booking) return;

    // Calculate new Date object
    const newDate = new Date(targetDate);
    newDate.setHours(targetHour, 0, 0, 0);

    // --- TIME GUARD: PREVENT PAST BOOKINGS ---
    const now = new Date();
    if (newDate < now) {
        toast.error("Acción bloqueada", {
            description: "No puedes mover una reserva al pasado.",
            icon: <Ban className="w-5 h-5 text-red-500" />,
            style: {
                borderColor: 'rgba(239, 68, 68, 0.2)',
                background: 'rgba(20, 0, 0, 0.6)'
            }
        });
        return;
    }

    // --- CONFLICT GUARD: PREVENT DOUBLE BOOKING ---
    // Verificar si ya existe una reserva para ESTE barbero en la fecha/hora destino
    const isSlotTaken = bookings.some(b => {
        // Ignoramos la reserva que estamos moviendo
        if (b.id === bookingId) return false;
        
        // Ignoramos reservas canceladas
        if (b.estado === BookingStatus.CANCELADO) return false;

        // Debe ser el mismo barbero
        if (b.barbero.id !== booking.barbero.id) return false;

        // Verificamos colisión de fecha y hora exacta
        return isSameDay(b.fecha_hora, newDate) && b.fecha_hora.getHours() === targetHour;
    });

    if (isSlotTaken) {
         toast.error("Horario Ocupado", {
            description: `El barbero ${booking.barbero.nombre} ya tiene una cita a las ${targetHour}:00.`,
            icon: <Ban className="w-5 h-5 text-red-500" />,
            style: {
                borderColor: 'rgba(239, 68, 68, 0.2)',
                background: 'rgba(20, 0, 0, 0.6)'
            }
        });
        return;
    }
    // ----------------------------------------------

    // Optimistic Update / API Call
    const toastId = toast.loading('Reprogramando cita...');
    try {
        await supabaseApi.updateBookingDetails(bookingId, {
            date: newDate,
            time: `${targetHour.toString().padStart(2, '0')}:00`,
            serviceId: booking.servicio.id,
            barberId: booking.barbero.id
        });
        
        toast.success(`Cita movida al ${format(newDate, 'EEEE d HH:mm', { locale: es })}`, { id: toastId });
        onRefresh();
    } catch (error) {
        toast.error('Error al mover la cita', { id: toastId });
    }
  };

  const getBookingsForSlot = (date: Date, hour: number) => {
    return filteredBookings.filter(b => 
        isSameDay(b.fecha_hora, date) && 
        b.fecha_hora.getHours() === hour
    );
  };

  if (loading) return <div className="text-white/50 p-8">Cargando agenda semanal...</div>;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden">
        
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-white/5 bg-[#121212] gap-4">
            
            {/* Date Nav */}
            <div className="flex items-center space-x-4">
                <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                    <button onClick={handlePrevWeek} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={handleToday} className="px-4 text-sm font-bold text-white/80 hover:text-white transition-colors">
                        Hoy
                    </button>
                    <button onClick={handleNextWeek} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <h2 className="text-xl font-bold text-white capitalize flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-amber-500" />
                    {format(weekDays[0], 'MMM d', { locale: es })} - {format(weekDays[4], 'MMM d', { locale: es })}
                </h2>
            </div>

            {/* Barber Filter */}
            <div className="flex items-center space-x-3 bg-black/20 p-1.5 rounded-xl border border-white/5">
                <div className="px-3 flex items-center gap-2 text-white/40">
                    <Filter className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Ver:</span>
                </div>
                <select 
                    value={selectedBarberId}
                    onChange={(e) => setSelectedBarberId(e.target.value)}
                    className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer hover:text-amber-500 transition-colors"
                >
                    <option value="all">Todos los Barberos</option>
                    {barbers.map(b => (
                        <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                </select>
                {selectedBarberId !== 'all' && (
                    <img 
                        src={barbers.find(b => b.id === selectedBarberId)?.foto_url} 
                        className="w-6 h-6 rounded-full border border-white/10"
                    />
                )}
            </div>
        </div>

        {/* Weekly Grid */}
        <div className="flex-1 overflow-auto no-scrollbar relative flex flex-col">
            
            {/* Days Header */}
            <div className="sticky top-0 z-20 flex border-b border-white/5 bg-[#0a0a0a]">
                <div className="w-16 shrink-0 border-r border-white/5 bg-[#121212]" /> {/* Time Col Spacer */}
                {weekDays.map(day => {
                    const isToday = isSameDay(day, new Date());
                    return (
                        <div key={day.toISOString()} className={`flex-1 p-3 text-center border-r border-white/5 last:border-r-0 ${isToday ? 'bg-amber-500/5' : ''}`}>
                            <p className="text-xs font-bold uppercase text-white/40 mb-1">{format(day, 'EEEE', { locale: es })}</p>
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isToday ? 'bg-amber-500 text-black' : 'text-white'}`}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Grid Body */}
            <div className="flex-1 relative min-w-[800px]">
                {HOURS.map(hour => (
                    <div key={hour} className="flex border-b border-white/5 min-h-[100px]">
                        
                        {/* Time Label */}
                        <div className="w-16 shrink-0 border-r border-white/5 flex items-start justify-center pt-2 bg-[#121212]">
                            <span className="text-xs font-mono text-white/30">{hour}:00</span>
                        </div>

                        {/* Days Columns */}
                        {weekDays.map(day => {
                            const slotBookings = getBookingsForSlot(day, hour);
                            const isToday = isSameDay(day, new Date());
                            
                            // Check if this specific slot is in the past for visual cue (optional, but good for UX)
                            const slotDate = new Date(day);
                            slotDate.setHours(hour, 59, 0, 0); // End of the hour slot
                            const isPast = slotDate < new Date();

                            return (
                                <div 
                                    key={`${day.toISOString()}-${hour}`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, day, hour)}
                                    className={`
                                        flex-1 border-r border-white/5 last:border-r-0 p-1 relative transition-colors
                                        ${isToday ? 'bg-amber-500/[0.02]' : ''}
                                        ${isPast ? 'bg-white/[0.01]' : 'hover:bg-white/[0.02]'}
                                    `}
                                >
                                    {/* Empty Slot Visual Hint */}
                                    {slotBookings.length === 0 && !isPast && (
                                        <div className="w-full h-full rounded-lg border-2 border-dashed border-transparent hover:border-white/5 transition-all" />
                                    )}
                                    
                                    {/* Visual indicator for past slots (optional subtle texture) */}
                                    {isPast && slotBookings.length === 0 && (
                                         <div className="w-full h-full opacity-30" 
                                              style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }} 
                                         />
                                    )}

                                    {/* Render Bookings */}
                                    <div className="flex flex-col gap-1 relative z-10">
                                        {slotBookings.map(booking => (
                                            <DraggableBookingCard 
                                                key={booking.id} 
                                                booking={booking} 
                                                onDragStart={handleDragStart}
                                                onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setIsEditModalOpen(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
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

interface DraggableBookingCardProps {
  booking: Booking;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
}

const DraggableBookingCard: React.FC<DraggableBookingCardProps> = ({ booking, onDragStart, onClick }) => {
    const isCompleted = booking.estado === BookingStatus.COMPLETADO || booking.estado === BookingStatus.NO_SHOW;
    
    // Status Styles
    const statusColor = {
        [BookingStatus.CONFIRMADO]: 'bg-green-500 border-green-500',
        [BookingStatus.PENDIENTE]: 'bg-amber-500 border-amber-500',
        [BookingStatus.COMPLETADO]: 'bg-blue-500 border-blue-500',
        [BookingStatus.NO_SHOW]: 'bg-red-500 border-red-500',
        [BookingStatus.CANCELADO]: 'bg-gray-500 border-gray-500',
    }[booking.estado];

    return (
        <motion.div
            layoutId={booking.id}
            draggable={!isCompleted}
            onDragStart={(e) => onDragStart(e as any, booking.id)}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, zIndex: 10 }}
            className={`
                relative p-2 rounded-lg border-l-4 shadow-lg cursor-grab active:cursor-grabbing bg-[#1c1c1c] hover:bg-[#252525] group
                ${statusColor} border-l-4 border-y border-r border-y-white/5 border-r-white/5
                ${isCompleted ? 'opacity-60 grayscale' : ''}
            `}
        >
            <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-white truncate max-w-[80%]">
                    {booking.cliente.nombre_completo}
                </span>
                {!isCompleted && <GripHorizontal className="w-3 h-3 text-white/20" />}
            </div>
            
            <div className="flex items-center gap-1 mb-1">
                <img src={booking.barbero.foto_url} className="w-4 h-4 rounded-full" />
                <span className="text-[9px] text-white/50 truncate">{booking.barbero.nombre}</span>
            </div>

            <div className="flex items-center gap-1">
                 <Scissors className="w-3 h-3 text-white/30" />
                 <span className="text-[9px] text-white/70 truncate">{booking.servicio.nombre}</span>
            </div>

            {booking.origen === 'walkin' && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse" title="Walk-in" />
            )}
        </motion.div>
    );
};