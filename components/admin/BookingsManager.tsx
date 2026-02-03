import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  Scissors, 
  MoreHorizontal, 
  Calendar,
  AlertCircle,
  Trash2,
  Pencil
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

export const BookingsManager: React.FC<BookingsManagerProps> = ({ bookings, loading, onRefresh }) => {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Fetch aux data for editing
  useEffect(() => {
    Promise.all([
        supabaseApi.getBarbers(),
        supabaseApi.getServices()
    ]).then(([b, s]) => {
        setBarbers(b);
        setServices(s);
    });
  }, []);

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    const promise = supabaseApi.updateBookingStatus(id, status);
    toast.promise(promise, {
        loading: 'Moviendo reserva...',
        success: () => {
            onRefresh();
            return 'Estado actualizado';
        },
        error: 'Error al actualizar'
    });
  };

  const handleDelete = async (id: string) => {
    if(confirm('¿Eliminar definitivamente del historial?')) {
        await supabaseApi.deleteBooking(id);
        onRefresh();
        toast.success("Reserva eliminada");
    }
  };

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsEditModalOpen(true);
  };

  // Group bookings by status
  const columns = {
    [BookingStatus.PENDIENTE]: bookings.filter(b => b.estado === BookingStatus.PENDIENTE),
    [BookingStatus.CONFIRMADO]: bookings.filter(b => b.estado === BookingStatus.CONFIRMADO),
    [BookingStatus.CANCELADO]: bookings.filter(b => b.estado === BookingStatus.CANCELADO),
  };

  if (loading) return <div className="text-white/50 p-8">Cargando tablero...</div>;

  return (
    <div className="h-full overflow-x-auto overflow-y-hidden pb-4">
      <div className="flex h-full gap-6 min-w-[1000px]">
        
        {/* COLUMNA 1: PENDIENTES */}
        <KanbanColumn 
            title="Por Confirmar" 
            count={columns[BookingStatus.PENDIENTE].length}
            color="amber"
            icon={<Clock className="w-5 h-5 text-amber-500" />}
        >
            {columns[BookingStatus.PENDIENTE].map(booking => (
                <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onAction={(status) => handleStatusChange(booking.id, status)}
                    onDelete={() => handleDelete(booking.id)}
                    onEdit={() => handleEdit(booking)}
                    variant="pending"
                />
            ))}
        </KanbanColumn>

        {/* COLUMNA 2: AGENDA (CONFIRMADOS) */}
        <KanbanColumn 
            title="Agenda Confirmada" 
            count={columns[BookingStatus.CONFIRMADO].length}
            color="green"
            icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
        >
            {columns[BookingStatus.CONFIRMADO].map(booking => (
                <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onAction={(status) => handleStatusChange(booking.id, status)}
                    onDelete={() => handleDelete(booking.id)}
                    onEdit={() => handleEdit(booking)}
                    variant="confirmed"
                />
            ))}
        </KanbanColumn>

        {/* COLUMNA 3: HISTORIAL / CANCELADOS */}
        <KanbanColumn 
            title="Historial / Cancelados" 
            count={columns[BookingStatus.CANCELADO].length}
            color="red"
            icon={<XCircle className="w-5 h-5 text-red-500" />}
        >
            {columns[BookingStatus.CANCELADO].map(booking => (
                <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onAction={(status) => handleStatusChange(booking.id, status)}
                    onDelete={() => handleDelete(booking.id)}
                    onEdit={() => handleEdit(booking)}
                    variant="cancelled"
                />
            ))}
        </KanbanColumn>

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

const KanbanColumn = ({ title, count, children, color, icon }: any) => {
    const borderColor = {
        amber: 'border-amber-500/20 bg-amber-500/5',
        green: 'border-green-500/20 bg-green-500/5',
        red: 'border-red-500/20 bg-red-500/5',
    }[color as string] || 'border-white/10 bg-white/5';

    return (
        <div className={`flex-1 min-w-[320px] flex flex-col rounded-3xl border ${borderColor} backdrop-blur-sm overflow-hidden h-full`}>
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white/5">{icon}</div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide">{title}</h3>
                </div>
                <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-md text-white/60">{count}</span>
            </div>
            
            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                <AnimatePresence mode="popLayout">
                    {children}
                </AnimatePresence>
                {count === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-xl">
                        <span className="text-xs uppercase tracking-widest">Vacío</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const BookingCard = ({ booking, onAction, onDelete, onEdit, variant }: { 
    booking: Booking, 
    onAction: (s: BookingStatus) => void,
    onDelete: () => void, 
    onEdit: () => void,
    variant: 'pending' | 'confirmed' | 'cancelled' 
}) => {
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative bg-[#121212] hover:bg-[#1A1A1A] border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all duration-200 shadow-lg"
        >
            {/* Time Badge - Highlighted as requested */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                    <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 group-hover:border-amber-500/30 transition-colors">
                        <span className="text-lg font-bold text-white tracking-tight">
                            {format(booking.fecha_hora, 'HH:mm')}
                        </span>
                    </div>
                    <div className="flex flex-col">
                         <span className="text-[10px] uppercase text-white/40 font-bold tracking-wider">
                            {format(booking.fecha_hora, 'EEE dd', { locale: es })}
                         </span>
                         <span className="text-[10px] text-white/30 truncate max-w-[100px]">
                            {booking.sucursal.nombre}
                         </span>
                    </div>
                </div>
                
                {/* Barber Avatar Mini */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onEdit}
                        className="p-1.5 rounded-full hover:bg-white/10 text-white/20 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Editar Reserva"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <div className="relative" title={`Barbero: ${booking.barbero.nombre}`}>
                        <img 
                            src={booking.barbero.foto_url} 
                            className="w-8 h-8 rounded-full border border-white/10" 
                            alt="" 
                        />
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#121212] ${variant === 'confirmed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    </div>
                </div>
            </div>

            {/* Client & Service Info */}
            <div className="mb-4">
                <h4 className="font-bold text-white text-base mb-0.5 flex items-center">
                    {booking.cliente.nombre_completo}
                    {booking.cliente.ranking === 'vip' && (
                        <span className="ml-2 text-[10px] bg-amber-500 text-black px-1.5 rounded font-bold">VIP</span>
                    )}
                </h4>
                <div className="flex items-center text-white/50 text-xs space-x-2">
                    <span className="truncate">{booking.cliente.celular}</span>
                    <span>•</span>
                    <span className="text-amber-500/80">{booking.servicio.nombre}</span>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="text-xs font-bold text-white/30">
                    {booking.servicio.precio} Bs
                </div>

                <div className="flex items-center space-x-1">
                    {variant === 'pending' && (
                        <>
                            <button 
                                onClick={() => onAction(BookingStatus.CANCELADO)}
                                className="p-2 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors"
                                title="Rechazar"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => onAction(BookingStatus.CONFIRMADO)}
                                className="px-3 py-1.5 rounded-lg bg-green-500 text-black text-xs font-bold hover:bg-green-400 transition-colors flex items-center space-x-1"
                            >
                                <span>Aceptar</span>
                            </button>
                        </>
                    )}

                    {variant === 'confirmed' && (
                        <>
                            <button 
                                onClick={() => onAction(BookingStatus.CANCELADO)}
                                className="p-2 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors"
                                title="Cancelar Cita"
                            >
                                <AlertCircle className="w-4 h-4" />
                            </button>
                            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-green-500 text-xs font-bold flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Agendado</span>
                            </div>
                        </>
                    )}

                    {variant === 'cancelled' && (
                        <button 
                            onClick={onDelete}
                            className="p-2 rounded-lg hover:bg-red-900/20 text-white/20 hover:text-red-500 transition-colors ml-auto"
                            title="Eliminar permanentemente"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};