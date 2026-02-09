import { supabase } from './supabaseClient';
import { Barber, Service, Client, ClientRanking, Branch, Booking, BookingStatus, BranchStatus } from '../types';

/**
 * PRODUCTION DATABASE SERVICE
 * Connects to the real Supabase backend.
 */

export const supabaseApi = {
    // --- BRANCHES ---
    getBranches: async (): Promise<Branch[]> => {
        const { data, error } = await supabase
            .from('sucursales')
            .select('*')
            .order('nombre');

        if (error) throw error;
        return data || [];
    },

    updateBranchStatus: async (branchId: string, status: BranchStatus): Promise<void> => {
        const { error } = await supabase
            .from('sucursales')
            .update({ estado_actual: status })
            .eq('id', branchId);

        if (error) throw error;
    },

    // --- SERVICES ---
    getServices: async (): Promise<Service[]> => {
        const { data, error } = await supabase
            .from('servicios')
            .select('*')
            .order('precio', { ascending: true }); // Or order by name, etc.

        if (error) throw error;
        return data || [];
    },

    // --- BARBERS ---
    getBarbers: async (branchId?: string): Promise<Barber[]> => {
        let query = supabase
            .from('barberos')
            .select('*')
            .eq('activo', true); // Only active barbers

        if (branchId) {
            query = query.eq('sucursal_id', branchId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Map database fields to TS interface if needed (snake_case to camelCase handled?)
        // Our types use: sucursalId. The DB uses: sucursal_id. We need mapping!
        return (data || []).map((b: any) => ({
            ...b,
            sucursalId: b.sucursal_id // map back to frontend type
        }));
    },

    // --- CLIENTS ---
    checkClientByPhone: async (phone: string): Promise<Client | null> => {
        // 1. Direct Exact Match (Fastest)
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('celular', phone)
            .single();

        if (!error && data) return data;

        // 2. Smart Fuzzy Search
        // Problem: 
        // - Stored: "10101010" | Input: "+59110101010"
        // - Stored: "+59110101010" | Input: "10101010"
        // Solution: Search using the last 7 digits (most unique local part)

        const cleanInput = phone.replace(/\D/g, '');

        // If query is too short, don't fuzzy search to avoid false positives
        if (cleanInput.length < 4) return null;

        // Take reasonable suffix (min 7 digits for phone numbers, or full if shorter)
        // Bolivia: 8 digits, Mexico: 10 digits. 7 is a safe "end" intersection.
        const searchSuffix = cleanInput.length > 7 ? cleanInput.slice(-7) : cleanInput;

        const { data: fuzzyData } = await supabase
            .from('clientes')
            .select('*')
            .ilike('celular', `%${searchSuffix}`)
            .limit(1);

        if (fuzzyData && fuzzyData.length > 0) return fuzzyData[0];

        return null;
    },

    createClient: async (phone: string, name: string): Promise<Client> => {
        const newClient = {
            celular: phone,
            nombre_completo: name,
            ranking: 'nuevo'
        };

        const { data, error } = await supabase
            .from('clientes')
            .insert([newClient])
            .select()
            .single(); // Ensure we get the created object back

        if (error) throw error;
        return data;
    },

    searchClientsByName: async (name: string): Promise<Client[]> => {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .ilike('nombre_completo', `%${name}%`)
            .limit(10);

        if (error) throw error;
        return data || [];
    },

    updateClientPhone: async (oldPhone: string, newPhone: string): Promise<void> => {
        // This is tricky because Phone is PK.
        // 1. Create new client with new phone
        // 2. Move bookings to new client
        // 3. Delete old client
        // Transaction is ideal but hard with JS client. Steps:

        const { data: oldClient } = await supabase.from('clientes').select('*').eq('celular', oldPhone).single();
        if (!oldClient) throw new Error("Client not found");

        // Create new
        const { error: createError } = await supabase.from('clientes').insert([{
            ...oldClient,
            celular: newPhone,
            updated_at: new Date()
        }]);
        if (createError) throw createError;

        // Update bookings
        const { error: updateError } = await supabase
            .from('reservas')
            .update({ cliente_celular: newPhone })
            .eq('cliente_celular', oldPhone);
        if (updateError) throw updateError;

        // Delete old
        await supabase.from('clientes').delete().eq('celular', oldPhone);
    },

    updateClient: async (phone: string, updates: Partial<Client>): Promise<Client> => {
        const { data, error } = await supabase
            .from('clientes')
            .update(updates)
            .eq('celular', phone)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // --- BOOKINGS ---
    createBooking: async (bookingData: any) => {
        // Helper to format date + time
        let finalDate: Date;
        if (bookingData.time) {
            const [hours, minutes] = bookingData.time.split(':').map(Number);
            finalDate = new Date(bookingData.date);
            finalDate.setHours(hours, minutes, 0, 0);
        } else {
            finalDate = new Date(bookingData.date);
        }

        const payload = {
            fecha_hora: finalDate.toISOString(),
            estado: bookingData.status || 'pendiente',
            cliente_celular: bookingData.clientPhone,
            barbero_id: bookingData.barberId,
            servicio_id: bookingData.serviceId,
            sucursal_id: bookingData.branchId,
            origen: bookingData.origin || 'guest'
        };

        const { data, error } = await supabase
            .from('reservas')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return { success: true, id: data.id };
    },

    getTakenSlots: async (date: Date, barberId: string): Promise<string[]> => {
        // Range for the whole day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('reservas')
            .select('fecha_hora')
            .eq('barbero_id', barberId)
            .gte('fecha_hora', startOfDay.toISOString())
            .lte('fecha_hora', endOfDay.toISOString())
            .neq('estado', 'cancelado');

        if (error) throw error;

        // Format to HH:mm
        return (data || []).map((b: any) => {
            const d = new Date(b.fecha_hora);
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        });
    },

    // --- ADMIN ---
    getAllBookings: async (): Promise<Booking[]> => {
        // Need to JOIN Tables
        // Supabase JS allows nested select
        const { data, error } = await supabase
            .from('reservas')
            .select(`
            *,
            cliente:clientes(*),
            barbero:barberos(*),
            servicio:servicios(*),
            sucursal:sucursales(*)
        `)
            .order('fecha_hora', { ascending: false });

        if (error) throw error;

        // Map nested objects to match Typescript interfaces (cleaning up potential nulls or field mismatches)
        return (data || []).map((b: any) => ({
            id: b.id,
            fecha_hora: new Date(b.fecha_hora),
            estado: b.estado,
            origen: b.origen,
            cliente: b.cliente,
            barbero: { ...b.barbero, sucursalId: b.barbero?.sucursal_id },
            servicio: b.servicio,
            sucursal: b.sucursal
        }));
    },

    updateBookingStatus: async (id: string, status: BookingStatus): Promise<void> => {
        const { error } = await supabase
            .from('reservas')
            .update({ estado: status })
            .eq('id', id);
        if (error) throw error;
    },

    updateBookingDetails: async (id: string, data: { date: Date, time: string, serviceId: string, barberId: string, branchId: string, status?: BookingStatus }) => {
        const [hours, minutes] = data.time.split(':').map(Number);
        const newDate = new Date(data.date);
        newDate.setHours(hours, minutes);

        const updates: any = {
            fecha_hora: newDate.toISOString(),
            servicio_id: data.serviceId,
            barbero_id: data.barberId,
            sucursal_id: data.branchId
        };
        if (data.status) updates.estado = data.status;

        const { error } = await supabase
            .from('reservas')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    deleteBooking: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('reservas')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
