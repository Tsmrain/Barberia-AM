import { supabase } from '../supabaseClient';
import { Client } from '../../types';

export const clientService = {
    checkClientByPhone: async (phone: string): Promise<Client | null> => {
        // 1. Direct Exact Match
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('celular', phone)
            .single();

        if (!error && data) return data;

        // 2. Smart Fuzzy Search
        const cleanInput = phone.replace(/\D/g, '');
        if (cleanInput.length < 4) return null;

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
        // Validation: Only letters (including accents) and spaces
        if (!/^[a-zA-Z\s\u00C0-\u00FF]+$/.test(name)) {
            throw new Error("El nombre solo puede contener letras y espacios.");
        }

        const newClient = {
            celular: phone,
            nombre_completo: name.trim(), // Ensure clean spacing
            ranking: 'nuevo'
        };

        const { data, error } = await supabase
            .from('clientes')
            .insert([newClient])
            .select()
            .single();

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
        const { data: oldClient } = await supabase.from('clientes').select('*').eq('celular', oldPhone).single();
        if (!oldClient) throw new Error("Client not found");

        const { error: createError } = await supabase.from('clientes').insert([{
            ...oldClient,
            celular: newPhone,
            updated_at: new Date()
        }]);
        if (createError) throw createError;

        const { error: updateError } = await supabase
            .from('reservas')
            .update({ cliente_celular: newPhone })
            .eq('cliente_celular', oldPhone);
        if (updateError) throw updateError;

        await supabase.from('clientes').delete().eq('celular', oldPhone);
    },

    updateClient: async (phone: string, updates: Partial<Client>): Promise<Client> => {
        // Validation for Name updates
        if (updates.nombre_completo && !/^[a-zA-Z\s\u00C0-\u00FF]+$/.test(updates.nombre_completo)) {
            throw new Error("El nombre solo puede contener letras y espacios.");
        }

        const { data, error } = await supabase
            .from('clientes')
            .update(updates)
            .eq('celular', phone)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
