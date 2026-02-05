/**
 * Catalog Repository
 * Handles read operations for static/semi-static catalog data
 * High cohesion: Only catalog data (branches, services, barbers)
 */

import { supabase } from '../supabase/client';
import { memoryCache, CACHE_KEYS } from '../cache/memoryCache';
import type { Branch, Barber, Service, BranchStatus } from '../supabase/types';

// Fallback mock data for when Supabase is not configured
const MOCK_BRANCHES: Branch[] = [
    {
        id: 'b1',
        nombre: '4to Anillo',
        direccion: 'Doble Vía La Guardia, 4to Anillo',
        mapa_url: 'https://maps.app.goo.gl/8ZKBwRkcTMpETbhj8',
        horario_apertura: 9,
        horario_cierre: 21,
        estado_actual: 'auto'
    },
    {
        id: 'b2',
        nombre: '6to Anillo',
        direccion: 'Doble Vía La Guardia, 6to Anillo',
        mapa_url: 'https://maps.app.goo.gl/fabTd3WcxFJtjbMB7',
        horario_apertura: 9,
        horario_cierre: 21,
        estado_actual: 'auto'
    }
];

const MOCK_BARBERS: Barber[] = [
    { id: '1', nombre: 'Andy', bio_corta: 'Master Barber & Fundador', activo: true, foto_url: '', sucursalId: 'b1' },
    { id: '2', nombre: 'Mateo', bio_corta: 'Fade Specialist', activo: true, foto_url: '', sucursalId: 'b1' },
    { id: '3', nombre: 'Leo', bio_corta: 'Beard Expert', activo: true, foto_url: '', sucursalId: 'b2' },
];

const MOCK_SERVICES: Service[] = [
    { id: 's1', nombre: 'Corte Clásico', precio: 60, duracion_min: 60, descripcion: 'Corte tradicional con técnica de tijera.' },
    { id: 's2', nombre: 'Corte + Lavado', precio: 80, duracion_min: 60, descripcion: 'Corte con lavado refrescante.' },
    { id: 's3', nombre: 'Arreglo Completo de Barba', precio: 35, duracion_min: 60, descripcion: 'Perfilado y tratamiento.' },
    { id: 's4', nombre: 'Solo Perfilado de Barba', precio: 20, duracion_min: 60, descripcion: 'Definición de líneas.' },
    { id: 's5', nombre: 'Diseño y Limpieza de Cejas', precio: 20, duracion_min: 60, descripcion: 'Diseño facial.' },
    { id: 's6', nombre: 'Limpieza Facial Fresh', precio: 90, duracion_min: 60, descripcion: 'Exfoliación y mascarilla.' },
    { id: 's7', nombre: 'Plan BÁSICO', precio: 90, duracion_min: 60, descripcion: 'Corte + Lavado + Cejas.' },
    { id: 's8', nombre: 'Plan Premium', precio: 110, duracion_min: 60, descripcion: 'Corte + Lavado + Barba.' },
    { id: 's9', nombre: 'Plan VIP', precio: 130, duracion_min: 60, descripcion: 'Corte + Lavado + Barba + Cejas.' },
];

export const catalogRepository = {
    /**
     * Fetch all branches with caching
     */
    async getBranches(): Promise<Branch[]> {
        // Check cache first
        const cached = memoryCache.get<Branch[]>(CACHE_KEYS.BRANCHES);
        if (cached) return cached;

        // If no Supabase, return mock
        if (!supabase) {
            memoryCache.set(CACHE_KEYS.BRANCHES, MOCK_BRANCHES);
            return MOCK_BRANCHES;
        }

        const { data, error } = await supabase
            .from('sucursales')
            .select('id, nombre, direccion, mapa_url');

        if (error) {
            console.error('Error fetching branches:', error);
            return MOCK_BRANCHES;
        }

        // Map to app format with defaults
        const branches: Branch[] = (data || []).map(row => ({
            id: row.id,
            nombre: row.nombre,
            direccion: row.direccion,
            mapa_url: row.mapa_url,
            horario_apertura: 9,
            horario_cierre: 21,
            estado_actual: 'auto' as BranchStatus,
        }));

        memoryCache.set(CACHE_KEYS.BRANCHES, branches);
        return branches;
    },

    /**
     * Fetch all services with caching
     */
    async getServices(): Promise<Service[]> {
        const cached = memoryCache.get<Service[]>(CACHE_KEYS.SERVICES);
        if (cached) return cached;

        if (!supabase) {
            memoryCache.set(CACHE_KEYS.SERVICES, MOCK_SERVICES);
            return MOCK_SERVICES;
        }

        const { data, error } = await supabase
            .from('servicios')
            .select('id, nombre, precio, duracion_min, descripcion');

        if (error) {
            console.error('Error fetching services:', error);
            return MOCK_SERVICES;
        }

        const services: Service[] = (data || []).map(row => ({
            id: row.id,
            nombre: row.nombre,
            precio: row.precio,
            duracion_min: row.duracion_min,
            descripcion: row.descripcion || '',
        }));

        memoryCache.set(CACHE_KEYS.SERVICES, services);
        return services;
    },

    /**
     * Fetch barbers, optionally filtered by branch
     */
    async getBarbers(branchId?: string): Promise<Barber[]> {
        const cacheKey = CACHE_KEYS.BARBERS(branchId);
        const cached = memoryCache.get<Barber[]>(cacheKey);
        if (cached) return cached;

        if (!supabase) {
            const filtered = branchId
                ? MOCK_BARBERS.filter(b => b.sucursalId === branchId)
                : MOCK_BARBERS;
            memoryCache.set(cacheKey, filtered);
            return filtered;
        }

        let query = supabase
            .from('barberos')
            .select('id, nombre, foto_url, bio_corta, activo, sucursal_id')
            .eq('activo', true);

        if (branchId) {
            query = query.eq('sucursal_id', branchId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching barbers:', error);
            return branchId ? MOCK_BARBERS.filter(b => b.sucursalId === branchId) : MOCK_BARBERS;
        }

        const barbers: Barber[] = (data || []).map(row => ({
            id: row.id,
            nombre: row.nombre,
            foto_url: row.foto_url || '',
            bio_corta: row.bio_corta || '',
            activo: row.activo,
            sucursalId: row.sucursal_id || '',
        }));

        memoryCache.set(cacheKey, barbers);
        return barbers;
    },

    /**
     * Update branch status (for admin)
     */
    async updateBranchStatus(branchId: string, status: BranchStatus): Promise<void> {
        // Invalidate cache
        memoryCache.invalidate(CACHE_KEYS.BRANCHES);

        // Note: status is managed client-side for now
        // Could be persisted to Supabase if needed
    },
};
