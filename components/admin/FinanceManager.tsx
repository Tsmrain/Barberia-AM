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
    CreditCard,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
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
    const [allTimeDebt, setAllTimeDebt] = useState(0);
    const [loading, setLoading] = useState(true);

    // Payment Logic State
    const [unpaidBookings, setUnpaidBookings] = useState<Booking[]>([]);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

    const fetchFinancialData = async () => {
        setLoading(true);
        try {
            // 1. Monthly Data
            const start = startOfMonth(currentMonth);
            const end = endOfMonth(currentMonth);

            // 2. All Time Data (For Total Debt Calculation)
            const allTimeStart = new Date('2024-01-01');
            const allTimeEnd = new Date('2030-12-31');

            const [monthData, allTimeData] = await Promise.all([
                supabaseApi.getBookings(start, end),
                supabaseApi.getBookings(allTimeStart, allTimeEnd)
            ]);

            // Filter valid bookings for monthly list (optional, but consistent)
            setBookings(monthData);

            // Calculate Total Accumulated Debt (3%) 
            // ONLY COUNT UNPAID BOOKINGS
            const unpaid = allTimeData.filter(b => !b.comision_pagada);
            setUnpaidBookings(unpaid);

            const totalRevenueUnpaid = unpaid.reduce((acc, curr) => acc + curr.servicio.precio, 0);
            setAllTimeDebt(totalRevenueUnpaid * 0.03);

        } catch (error) {
            console.error("Error fetching financial data:", error);
            toast.error("Error cargando finanzas");
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when month changes
    useEffect(() => {
        fetchFinancialData();
    }, [currentMonth]);

    const handleMarkAsPaid = async () => {
        const password = prompt("Ingrese la Clave de Desarrollador para autorizar el pago:");

        if (password !== 'PaymentBarber$') {
            toast.error("Contraseña incorrecta. Acceso denegado.");
            return;
        }

        if (!confirm(`¿Confirmas que recibiste el pago de ${allTimeDebt.toLocaleString('es-BO')} Bs? Esto reiniciará la deuda a 0.`)) {
            return;
        }

        setIsProcessingPayment(true);
        try {
            const idsToPay = unpaidBookings.map(b => b.id);
            if (idsToPay.length > 0) {
                await supabaseApi.markBookingsAsPaid(idsToPay);
                toast.success("Pago registrado exitosamente");
                await fetchFinancialData(); // Refresh to clear debt
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("Error al registrar pago");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Monthly Calculations
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

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            if (filter === 'all') return true;
            if (filter === 'pending') return !b.comision_pagada;
            if (filter === 'paid') return b.comision_pagada;
            return true;
        });
    }, [bookings, filter]);

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

                {/* GLOBAL DEBT ALERT */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-red-900/40 to-black border border-red-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-red-900/20"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
                            <CreditCard className="w-8 h-8 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Total Deuda Acumulada</h2>
                            <p className="text-white/60 text-sm">Comisión total generada por uso de la plataforma</p>
                        </div>
                    </div>
                    <div className="text-right">
                        {loading ? (
                            <div className="h-12 w-48 bg-white/5 rounded animate-pulse" />
                        ) : (
                            <div className="flex flex-col items-end">
                                <span className="text-4xl font-bold text-white tabular-nums">
                                    {allTimeDebt.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    {/* SECRET TRIGGER: Click 'Bs' to open payment prompt */}
                                    <span
                                        onClick={handleMarkAsPaid}
                                        className="text-lg text-amber-500 ml-1 cursor-default hover:text-amber-400 transition-colors select-none"
                                        title="" // No tooltip
                                    >
                                        Bs
                                    </span>
                                </span>
                                <span className="text-xs text-red-400 font-bold uppercase tracking-widest mt-1 bg-red-500/10 px-2 py-1 rounded">
                                    Pendiente de Pago
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Detailed List (Optional) */}
                <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="text-sm font-bold text-white">Transacciones</h3>

                        {/* Segmented Control Filter */}
                        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                            {(['all', 'pending', 'paid'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === tab
                                        ? 'bg-white text-black shadow-lg'
                                        : 'text-white/50 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab === 'all' ? 'Todos' : tab === 'pending' ? 'Pendientes' : 'Pagados'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-white/40 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Fecha</th>
                                    <th className="px-6 py-3 font-medium">Cliente</th>
                                    <th className="px-6 py-3 font-medium">Servicio</th>
                                    <th className="px-6 py-3 font-medium text-center">Estado</th>
                                    <th className="px-6 py-3 font-medium text-right">Monto</th>
                                    <th className="px-6 py-3 font-medium text-right">Comisión (3%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-white/30">
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                            Cargando datos...
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredBookings.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-white/30">
                                            No hay movimientos en este periodo.
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredBookings.map(booking => (
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
                                        <td className="px-6 py-4 text-center">
                                            {booking.comision_pagada ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wide">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Pagado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wide">
                                                    <CreditCard className="w-3 h-3" />
                                                    Pendiente
                                                </span>
                                            )}
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
