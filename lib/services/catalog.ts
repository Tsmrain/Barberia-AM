import { supabase } from '../supabaseClient';
import { Branch, Service, Barber, BranchStatus } from '../../types';
import { cacheService } from './cache';

export const catalogService = {
    // --- BRANCHES ---
    getBranches: async (): Promise<Branch[]> => {
        const cached = cacheService.get<Branch[]>('branches');
        if (cached) return cached;

        const { data, error } = await supabase
            .from('sucursales')
            .select('*')
            .order('nombre');

        if (error) throw error;
        const result = data || [];
        cacheService.set('branches', result);
        return result;
    },

    updateBranchStatus: async (branchId: string, status: BranchStatus): Promise<void> => {
        const { error } = await supabase
            .from('sucursales')
            .update({ estado_actual: status })
            .eq('id', branchId);

        if (error) throw error;
        cacheService.remove('branches');
    },

    // --- SERVICES ---
    getServices: async (): Promise<Service[]> => {
        const cached = cacheService.get<Service[]>('services');
        if (cached) return cached;

        const { data, error } = await supabase
            .from('servicios')
            .select('*')
            .order('precio', { ascending: true });

        if (error) throw error;
        const result = data || [];
        cacheService.set('services', result);
        return result;
    },

    // --- BARBERS ---
    getBarbers: async (branchId?: string): Promise<Barber[]> => {
        const cacheKey = `barbers_${branchId || 'all'}`;
        const cached = cacheService.get<Barber[]>(cacheKey);
        if (cached) return cached;

        let query = supabase
            .from('barberos')
            .select('*')
            .eq('activo', true);

        if (branchId) {
            query = query.eq('sucursal_id', branchId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const result = (data || []).map((b: any) => ({
            ...b,
            sucursalId: b.sucursal_id
        }));

        cacheService.set(cacheKey, result);
        return result;
    }
};
