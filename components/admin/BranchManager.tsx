'use client';

import React, { useState, useEffect } from 'react';
import { Branch, BranchStatus } from '../../types';
import { Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { supabaseApi } from '../../lib/supabaseApi';
import { toast } from 'sonner';

export const BranchManager: React.FC = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = () => {
        setLoading(true);
        supabaseApi.getBranches().then(data => {
            setBranches(data);
            setLoading(false);
        });
    };

    const handleStatusChange = async (branchId: string, status: BranchStatus) => {
        const branchName = branches.find(b => b.id === branchId)?.nombre;
        const toastId = toast.loading(`Actualizando ${branchName}...`);

        await supabaseApi.updateBranchStatus(branchId, status);
        await loadBranches(); // Reload local state

        toast.dismiss(toastId);
        toast.success(`Estado de ${branchName} actualizado`);
    };

    if (loading) return <div className="text-white/50 animate-pulse p-10">Cargando sucursales...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-[#121212] border border-white/5 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Control de Sucursales
                </h3>
                <p className="text-white/40 text-sm mb-6">
                    Gestiona el estado operativo de tus sucursales. El modo "Auto" respeta los horarios configurados.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.map(branch => (
                        <div key={branch.id} className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between gap-4 hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-xl text-white mb-1">{branch.nombre}</h4>
                                    <p className="text-xs text-white/40">Horario: {branch.horario_apertura}:00 - {branch.horario_cierre}:00</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs uppercase font-bold border 
                                     ${branch.estado_actual === 'abierto' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        branch.estado_actual === 'cerrado' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    }`}>
                                    {branch.estado_actual === 'auto' ? 'Automático' : branch.estado_actual}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-2">
                                <button
                                    onClick={() => handleStatusChange(branch.id, 'auto')}
                                    className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all border ${branch.estado_actual === 'auto'
                                        ? 'bg-white text-black border-white'
                                        : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10 hover:text-white hover:border-white/10'
                                        }`}
                                >
                                    <RefreshCw className={`w-5 h-5 ${branch.estado_actual === 'auto' ? 'animate-spin-slow' : ''}`} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Auto</span>
                                </button>
                                <button
                                    onClick={() => handleStatusChange(branch.id, 'abierto')}
                                    className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all border ${branch.estado_actual === 'abierto'
                                        ? 'bg-green-500 text-black border-green-500'
                                        : 'bg-white/5 text-white/40 border-transparent hover:bg-green-500/20 hover:text-green-500 hover:border-green-500/20'
                                        }`}
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Abrir</span>
                                </button>
                                <button
                                    onClick={() => handleStatusChange(branch.id, 'cerrado')}
                                    className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all border ${branch.estado_actual === 'cerrado'
                                        ? 'bg-red-500 text-black border-red-500'
                                        : 'bg-white/5 text-white/40 border-transparent hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/20'
                                        }`}
                                >
                                    <XCircle className="w-5 h-5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Cerrar</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
