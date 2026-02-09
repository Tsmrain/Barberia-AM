'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Booking, BookingStatus, Branch } from '../../types';
import { TrendingUp, Users, MapPin, DollarSign, ChevronDown } from 'lucide-react';
import { isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { supabaseApi } from '../../lib/mockSupabase';
import { toast } from 'sonner';

interface DashboardViewProps {
    bookings: Booking[];
    loading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ bookings, loading }) => {
    // Estado de Filtros
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
    const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
    const [branches, setBranches] = useState<Branch[]>([]);

    // Cargar sucursales para el filtro y control
    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = () => {
        supabaseApi.getBranches().then(setBranches);
    };



    // LÓGICA DE FILTRADO
    const filteredBookings = useMemo(() => {
        const now = new Date();
        return bookings.filter(b => {
            // 1. Filtro por Sucursal
            if (selectedBranchId !== 'all' && b.sucursal.id !== selectedBranchId) {
                return false;
            }

            // 2. Filtro por Fecha
            const bookingDate = new Date(b.fecha_hora);
            switch (timeRange) {
                case 'today':
                    return isSameDay(bookingDate, now);
                case 'week':
                    return isSameWeek(bookingDate, now, { weekStartsOn: 1 }); // Semana empieza Lunes
                case 'month':
                    return isSameMonth(bookingDate, now);
                default:
                    return true;
            }
        });
    }, [bookings, timeRange, selectedBranchId]);

    // LÓGICA DE ANALÍTICA (Sobre datos filtrados)
    const stats = useMemo(() => {
        const activeBookings = filteredBookings.filter(b => b.estado !== BookingStatus.CANCELADO);

        const totalRevenue = activeBookings.reduce((sum, b) => sum + b.servicio.precio, 0);
        const confirmedCount = filteredBookings.filter(b => b.estado === BookingStatus.CONFIRMADO).length;

        // Revenue by Branch
        const revenueByBranch: Record<string, number> = {};
        activeBookings.forEach(b => {
            revenueByBranch[b.sucursal.nombre] = (revenueByBranch[b.sucursal.nombre] || 0) + b.servicio.precio;
        });

        // Top Barbers
        const barberCounts: Record<string, number> = {};
        const barberRevenue: Record<string, number> = {};
        activeBookings.forEach(b => {
            barberCounts[b.barbero.nombre] = (barberCounts[b.barbero.nombre] || 0) + 1;
            barberRevenue[b.barbero.nombre] = (barberRevenue[b.barbero.nombre] || 0) + b.servicio.precio;
        });

        // Top Services
        const serviceCounts: Record<string, number> = {};
        activeBookings.forEach(b => {
            serviceCounts[b.servicio.nombre] = (serviceCounts[b.servicio.nombre] || 0) + 1;
        });

        return { totalRevenue, confirmedCount, revenueByBranch, barberRevenue, serviceCounts };
    }, [filteredBookings]);


    if (loading) return <div className="text-white/50 animate-pulse">Cargando métricas...</div>;

    return (
        <div className="space-y-8 pb-10">

            {/* TOOLBAR DE FILTROS */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-[#121212] p-2 rounded-2xl border border-white/5 inline-block w-full md:w-auto">

                {/* Selector de Rango de Tiempo */}
                <div className="flex bg-black/40 p-1 rounded-xl">
                    {[
                        { id: 'today', label: 'Hoy' },
                        { id: 'week', label: 'Esta Semana' },
                        { id: 'month', label: 'Este Mes' },
                        { id: 'all', label: 'Todo' }
                    ].map((range) => (
                        <button
                            key={range.id}
                            onClick={() => setTimeRange(range.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range.id
                                ? 'bg-amber-500 text-black shadow-lg'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>

                <div className="w-px h-8 bg-white/10 hidden md:block" />

                {/* Selector de Sucursal */}
                <div className="relative group w-full md:w-auto">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-hover:text-amber-500 transition-colors" />
                    <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full md:w-48 appearance-none bg-black/40 border border-white/5 rounded-xl pl-10 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer hover:bg-white/5"
                    >
                        <option value="all">Todas las Sucursales</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.nombre}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                </div>

            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Ingresos"
                    value={`${stats.totalRevenue} Bs`}
                    icon={<DollarSign className="w-5 h-5 text-green-400" />}
                    subtitle={timeRange === 'today' ? 'Hoy' : timeRange === 'week' ? 'Esta semana' : timeRange === 'month' ? 'Este mes' : 'Total histórico'}
                />
                <KpiCard
                    title="Citas Confirmadas"
                    value={stats.confirmedCount.toString()}
                    icon={<Users className="w-5 h-5 text-blue-400" />}
                />
                <KpiCard
                    title="Ticket Promedio"
                    value={`${stats.confirmedCount > 0 ? Math.round(stats.totalRevenue / stats.confirmedCount) : 0} Bs`}
                    icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
                />
                <KpiCard
                    title="Mejor Sucursal"
                    value={Object.entries(stats.revenueByBranch).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0]?.[0] || '-'}
                    icon={<MapPin className="w-5 h-5 text-purple-400" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Branch / Barber Chart */}
                <div className="bg-[#121212] border border-white/5 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-500" />
                        Rendimiento por Barbero
                    </h3>
                    {Object.keys(stats.barberRevenue).length > 0 ? (
                        <div className="space-y-5">
                            {Object.entries(stats.barberRevenue)
                                .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
                                .map(([name, revenue]: [string, number], index) => (
                                    <div key={name}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-white font-medium flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/50">{index + 1}</span>
                                                {name}
                                            </span>
                                            <span className="text-white/60">{revenue} Bs</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stats.totalRevenue > 0 ? (revenue / stats.totalRevenue) * 100 : 0}%` }}
                                                className="h-full bg-amber-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-white/20">
                            Sin datos para este periodo
                        </div>
                    )}
                </div>

                {/* Popular Services */}
                <div className="bg-[#121212] border border-white/5 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                        Servicios Top
                    </h3>
                    {Object.keys(stats.serviceCounts).length > 0 ? (
                        <div className="space-y-4">
                            {Object.entries(stats.serviceCounts)
                                .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
                                .slice(0, 5) // Top 5
                                .map(([name, count], index) => (
                                    <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold 
                                    ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                                        index === 2 ? 'bg-orange-700/20 text-orange-700' : 'bg-white/10 text-white/50'}`}>
                                                #{index + 1}
                                            </div>
                                            <span className="text-sm font-medium text-white/90">{name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                                            {count}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-white/20">
                            Sin datos para este periodo
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

const KpiCard = ({ title, value, icon, subtitle }: any) => (
    <div className="bg-[#121212] border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors">
                {icon}
            </div>
            {subtitle && <span className="text-[10px] text-white/40 font-medium bg-white/5 px-2 py-1 rounded-full">{subtitle}</span>}
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        <p className="text-white/40 text-sm font-medium">{title}</p>
    </div>
);