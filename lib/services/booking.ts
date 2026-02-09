import { supabase } from '../supabaseClient';
import { Booking, BookingStatus } from '../../types';

export interface CreateBookingPayload {
    date: Date | string;
    time?: string;
    status?: BookingStatus;
    clientPhone: string;
    barberId: string;
    serviceId: string;
    branchId: string;
    origin?: string;
}

export const bookingService = {
    createBooking: async (bookingData: CreateBookingPayload) => {
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

        return (data || []).map((b: any) => {
            const d = new Date(b.fecha_hora);
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        });
    },

    // Used by Admin & potentially user history
    getBookings: async (start: Date, end: Date): Promise<Booking[]> => {
        const { data, error } = await supabase
            .from('reservas')
            .select(`
            *,
            cliente:clientes(*),
            barbero:barberos(*),
            servicio:servicios(*),
            sucursal:sucursales(*)
        `)
            .gte('fecha_hora', start.toISOString())
            .lte('fecha_hora', end.toISOString())
            .order('fecha_hora', { ascending: false });

        if (error) throw error;

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
