'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign,
    Calendar as CalendarIcon,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Download,
    Loader2,
    Percent,
    CreditCard
} from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    addMonths,
    subMonths,
    eachDayOfInterval,
    isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { supabaseApi } from '../../lib/supabaseApi';
import { Booking, BookingStatus } from '../../types';

export const FinanceManager: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch data when month changes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const start = startOfMonth(currentMonth);
                const end = endOfMonth(currentMonth);
                const data = await supabaseApi.getBookings(start, end);

                // Filter only valid bookings for financial stats
                const validBookings = data.filter(b =>
                    b.estado === BookingStatus.CONFIRMADO ||
                    b.estado === BookingStatus.COMPLETADO
                );

                setBookings(validBookings);
            } catch (error) {
                console.error("Error fetching financial data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentMonth]);

    // Calculations
    const stats = useMemo(() => {
        const totalRevenue = bookings.reduce((acc, curr) => acc + curr.servicio.precio, 0);
        const commissionRate = 0.03; // 3%
        const totalCommission = totalRevenue * commissionRate;
        const averageTicket = bookings.length > 0 ? totalRevenue / bookings.length : 0;

        return {
            totalRevenue,
            totalCommission,
            averageTicket,
            count: bookings.length
        };
    }, [bookings]);

    const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-white/5 bg-[#121212] gap-4">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-6 py-1 min-w-[140px] text-center">
                            <span className="text-sm font-bold text-white uppercase tracking-wider">
                                {format(currentMonth, 'MMMM yyyy', { locale: es })}
                            </span>
                        </div>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-colors">
                        <Download className="w-4 h-4" />
                        <span>Exportar Reporte</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Revenue Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-white/5 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign className="w-12 h-12 text-green-500" />
                        </div>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Ingresos Totales</p>
                        {loading ? (
                            <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
                        ) : (
                            <h3 className="text-3xl font-bold text-white tabular-nums">
                                {stats.totalRevenue.toLocaleString('es-BO')} <span className="text-sm text-white/40 font-normal">Bs</span>
                            </h3>
                        )}
                        <p className="text-xs text-white/30 mt-2">En {stats.count} citas confirmadas</p>
                    </motion.div>

                    {/* Commission Card (HIGHLIGHT) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 relative overflow-hidden group"
                    >
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all" />

                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-amber-500 text-xs font-bold uppercase tracking-wider">Comisión Plataforma</p>
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[10px] font-bold">3%</span>
                        </div>

                        {loading ? (
                            <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
                        ) : (
                            <h3 className="text-3xl font-bold text-amber-400 tabular-nums">
                                {stats.totalCommission.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-amber-500/60 font-normal">Bs</span>
                            </h3>
                        )}
                        <p className="text-xs text-amber-500/40 mt-2">Monto a pagar por servicio</p>
                    </motion.div>

                    {/* Ticket Average */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-6 rounded-2xl bg-[#1a1a1a] border border-white/5"
                    >
                        <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Ticket Promedio</p>
                        {loading ? (
                            <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
                        ) : (
                            <h3 className="text-3xl font-bold text-white tabular-nums">
                                {stats.averageTicket.toLocaleString('es-BO', { maximumFractionDigits: 0 })} <span className="text-sm text-white/40 font-normal">Bs</span>
                            </h3>
                        )}
                        <p className="text-xs text-white/30 mt-2">Por cita realizada</p>
                    </motion.div>

                    {/* Bookings Count */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-6 rounded-2xl bg-[#1a1a1a] border border-white/5"
                    >
                        <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Citas del Mes</p>
                        {loading ? (
                            <div className="h-8 w-12 bg-white/5 rounded animate-pulse" />
                        ) : (
                            <h3 className="text-3xl font-bold text-white tabular-nums">
                                {stats.count}
                            </h3>
                        )}
                        <div className="flex items-center gap-1 text-xs text-green-400 mt-2">
                            <TrendingUp className="w-3 h-3" />
                            <span>Actividad normal</span>
                        </div>
                    </motion.div>
                </div>

                {/* Detailed List (Optional) */}
                <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white">Detalle de Transacciones</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-white/40 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Fecha</th>
                                    <th className="px-6 py-3 font-medium">Cliente</th>
                                    <th className="px-6 py-3 font-medium">Servicio</th>
                                    <th className="px-6 py-3 font-medium text-right">Monto</th>
                                    <th className="px-6 py-3 font-medium text-right">Comisión (3%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-white/30">
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                            Cargando datos...
                                        </td>
                                    </tr>
                                )}
                                {!loading && bookings.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-white/30">
                                            No hay movimientos en este periodo.
                                        </td>
                                    </tr>
                                )}
                                {!loading && bookings.map(booking => (
                                    <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-white/70">
                                            {format(booking.fecha_hora, 'dd MMM, HH:mm', { locale: es })}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            {booking.cliente.nombre_completo}
                                        </td>
                                        <td className="px-6 py-4 text-white/70">
                                            {booking.servicio.nombre}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-white">
                                            {booking.servicio.precio} Bs
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-amber-500">
                                            {(booking.servicio.precio * 0.03).toFixed(2)} Bs
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};
