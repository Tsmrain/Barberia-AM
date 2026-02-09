'use client';

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
import Image from 'next/image';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    User,
    Scissors,
    Filter,
    GripHorizontal,
    Ban,
    MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { Booking, BookingStatus, Barber, Service, Branch } from '../../types';
import { supabaseApi } from '../../lib/supabaseApi';
import { EditBookingModal } from './EditBookingModal';

interface BookingsManagerProps {
    bookings: Booking[];
    loading: boolean;
    onRefresh: () => void;
    currentDate: Date;
    onDateChange: (date: Date) => void;
}

// Horas de operación (09:00 - 21:00)
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9);

export const BookingsManager: React.FC<BookingsManagerProps> = ({ bookings, loading, onRefresh, currentDate, onDateChange }) => {
    // const [currentDate, setCurrentDate] = useState<Date>(new Date()); // REPLACED BY PROPS
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Data State
    const [branches, setBranches] = useState<Branch[]>([]);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // Filters State
    const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
    const [selectedBarberId, setSelectedBarberId] = useState<string>('all');

    // Drag State
    const [draggingId, setDraggingId] = useState<string | null>(null);

    // Initial Fetch
    useEffect(() => {
        Promise.all([
            supabaseApi.getBarbers(),
            supabaseApi.getServices(),
            supabaseApi.getBranches()
        ]).then(([b, s, br]) => {
            setBarbers(b);
            setServices(s);
            setBranches(br);
        });
    }, []);

    // Navigation Logic
    const handlePrevWeek = () => onDateChange(subWeeks(currentDate, 1));
    const handleNextWeek = () => onDateChange(addWeeks(currentDate, 1));
    const handleToday = () => onDateChange(new Date());

    // Generate Week Days (Monday to Friday)
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // 1 = Monday
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [currentDate]);

    // Filtering Logic
    const filteredBookings = useMemo(() => {
        // We want to see ALL bookings status, including CANCELLED
        let filtered = bookings;

        // Filter by Branch
        if (selectedBranchId !== 'all') {
            filtered = filtered.filter(b => b.sucursal.id === selectedBranchId);
        }

        // Filter by Barber
        if (selectedBarberId !== 'all') {
            filtered = filtered.filter(b => b.barbero.id === selectedBarberId);
        }
        return filtered;
    }, [bookings, selectedBarberId, selectedBranchId]);

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
        if (!booking) return;

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
                barberId: booking.barbero.id,
                branchId: booking.sucursal.id
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
            <div className="flex flex-col xl:flex-row items-center justify-between p-6 border-b border-white/5 bg-[#121212] gap-4">

                {/* Date Nav */}
                <div className="flex items-center space-x-4 w-full xl:w-auto justify-center xl:justify-start">
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
                        {format(weekDays[0], 'MMM d', { locale: es })} - {format(weekDays[6], 'MMM d', { locale: es })}
                    </h2>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto justify-center xl:justify-end">

                    {/* Branch Filter */}
                    <div className="flex items-center space-x-3 bg-black/20 p-1.5 rounded-xl border border-white/5 w-full sm:w-auto justify-center">
                        <div className="px-3 flex items-center gap-2 text-white/40">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Sucursal:</span>
                        </div>
                        <select
                            value={selectedBranchId}
                            onChange={(e) => {
                                setSelectedBranchId(e.target.value);
                                setSelectedBarberId('all'); // Reset barber when branch changes
                            }}
                            className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer hover:text-amber-500 transition-colors"
                        >
                            <option value="all">Todas</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Barber Filter */}
                    <div className="flex items-center space-x-3 bg-black/20 p-1.5 rounded-xl border border-white/5 w-full sm:w-auto justify-center">
                        <div className="px-3 flex items-center gap-2 text-white/40">
                            <Filter className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Barbero:</span>
                        </div>
                        <select
                            value={selectedBarberId}
                            onChange={(e) => setSelectedBarberId(e.target.value)}
                            className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer hover:text-amber-500 transition-colors max-w-[150px]"
                        >
                            <option value="all">Todos</option>
                            {barbers
                                .filter(b => selectedBranchId === 'all' || b.sucursalId === selectedBranchId)
                                .map(b => (
                                    <option key={b.id} value={b.id}>{b.nombre}</option>
                                ))}
                        </select>
                        {selectedBarberId !== 'all' && (
                            <Image
                                src={barbers.find(b => b.id === selectedBarberId)?.foto_url || ''}
                                alt="Barber"
                                width={24}
                                height={24}
                                className="rounded-full border border-white/10 object-cover"
                            />
                        )}
                    </div>
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
                            <div key={day.toISOString()} className={`flex-1 w-0 p-3 text-center border-r border-white/5 last:border-r-0 ${isToday ? 'bg-amber-500/5' : ''}`}>
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
                        <div key={hour} className="flex border-b border-white/5 h-32">

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
                                        flex-1 w-0 border-r border-white/5 last:border-r-0 p-1 relative transition-colors overflow-y-auto no-scrollbar
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
                branches={branches}
            />
        </div>
    );
};

const DraggableBookingCard: React.FC<{
    booking: Booking;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onClick: () => void;
}> = ({ booking, onDragStart, onClick }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, booking.id)}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`
        group relative p-2 rounded-lg text-xs cursor-grab active:cursor-grabbing border select-none transition-all shadow-md
        ${booking.estado === BookingStatus.CONFIRMADO
                    ? 'bg-amber-500 text-black border-amber-600 hover:bg-amber-400'
                    : booking.estado === BookingStatus.COMPLETADO
                        ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'
                        : booking.estado === BookingStatus.NO_SHOW
                            ? 'bg-red-600 text-white border-red-500 hover:bg-red-500'
                            : booking.estado === BookingStatus.CANCELADO
                                ? 'bg-gray-800 text-white/40 border-gray-700 decoration-line-through'
                                : 'bg-[#1a1a1a] text-white/90 border-white/10 hover:border-white/30 hover:bg-[#222]'}
      `}
        >
            <div className="font-bold truncate leading-tight mb-0.5">{booking.cliente.nombre_completo}</div>
            <div className="flex items-center gap-1 opacity-70 text-[10px]">
                <Scissors className="w-3 h-3" />
                <span className="truncate">{booking.servicio.nombre}</span>
            </div>
        </div>
    );
};