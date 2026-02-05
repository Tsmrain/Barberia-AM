/**
 * Booking Repository
 * Handles CRUD operations for bookings and clients
 * Low coupling: Only knows about Supabase, not business logic
 */

import { supabase } from '../supabase/client';
import type { Booking, Client, BookingStatus, ClientRanking, Service } from '../supabase/types';
import { catalogRepository } from './catalogRepository';

// In-memory storage for mock mode
let mockBookings: Booking[] = [];
let mockClients: Record<string, Client> = {
    '70012345': { celular: '70012345', nombre_completo: 'Carlos Mesa', ranking: 'vip' },
    '70099887': { celular: '70099887', nombre_completo: 'Luis Arce', ranking: 'nuevo' },
};

interface CreateBookingData {
    fecha_hora: Date;
    cliente_celular: string;
    barbero_id: string;
    servicio_id: string;
    sucursal_id: string;
    origen?: string;
}

export const bookingRepository = {
    /**
     * Check if client exists by phone number
     */
    async getClientByPhone(phone: string): Promise<Client | null> {
        if (!supabase) {
            return mockClients[phone] || null;
        }

        const { data, error } = await supabase
            .from('clientes')
            .select('celular, nombre_completo, ranking')
            .eq('celular', phone)
            .single();

        if (error || !data) return null;

        return {
            celular: data.celular,
            nombre_completo: data.nombre_completo,
            ranking: data.ranking as ClientRanking,
        };
    },

    /**
     * Create new client
     */
    async createClient(phone: string, name: string): Promise<Client> {
        const newClient: Client = {
            celular: phone,
            nombre_completo: name,
            ranking: 'nuevo',
        };

        if (!supabase) {
            mockClients[phone] = newClient;
            return newClient;
        }

        const { error } = await supabase
            .from('clientes')
            .insert({
                celular: phone,
                nombre_completo: name,
                ranking: 'nuevo',
            });

        if (error) {
            console.error('Error creating client:', error);
        }

        return newClient;
    },

    /**
     * Create a new booking
     */
    async createBooking(data: CreateBookingData): Promise<{ success: boolean; id: string }> {
        const bookingId = crypto.randomUUID();

        if (!supabase) {
            // Mock mode: build full booking object
            const [branches, barbers, services] = await Promise.all([
                catalogRepository.getBranches(),
                catalogRepository.getBarbers(),
                catalogRepository.getServices(),
            ]);

            const booking: Booking = {
                id: bookingId,
                fecha_hora: data.fecha_hora,
                estado: 'pendiente',
                cliente: mockClients[data.cliente_celular] || { celular: data.cliente_celular, nombre_completo: 'Guest', ranking: 'nuevo' },
                barbero: barbers.find(b => b.id === data.barbero_id) || barbers[0],
                servicio: services.find(s => s.id === data.servicio_id) || services[0],
                sucursal: branches.find(b => b.id === data.sucursal_id) || branches[0],
                origen: (data.origen || 'guest') as Booking['origen'],
            };

            mockBookings.push(booking);
            return { success: true, id: bookingId };
        }

        const { error } = await supabase
            .from('reservas')
            .insert({
                fecha_hora: data.fecha_hora.toISOString(),
                cliente_celular: data.cliente_celular,
                barbero_id: data.barbero_id,
                servicio_id: data.servicio_id,
                sucursal_id: data.sucursal_id,
                origen: data.origen || 'guest',
            });

        if (error) {
            console.error('Error creating booking:', error);
            return { success: false, id: '' };
        }

        return { success: true, id: bookingId };
    },

    /**
     * Get taken time slots for a barber on a specific date
     */
    async getTakenSlots(date: Date, barberId: string): Promise<string[]> {
        if (!supabase) {
            return mockBookings
                .filter(b => {
                    if (b.barbero.id !== barberId) return false;
                    if (b.estado === 'cancelado') return false;
                    const bDate = new Date(b.fecha_hora);
                    return (
                        bDate.getFullYear() === date.getFullYear() &&
                        bDate.getMonth() === date.getMonth() &&
                        bDate.getDate() === date.getDate()
                    );
                })
                .map(b => {
                    const d = new Date(b.fecha_hora);
                    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                });
        }

        // Query for the specific day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('reservas')
            .select('fecha_hora')
            .eq('barbero_id', barberId)
            .neq('estado', 'cancelado')
            .gte('fecha_hora', startOfDay.toISOString())
            .lte('fecha_hora', endOfDay.toISOString());

        if (error) {
            console.error('Error fetching taken slots:', error);
            return [];
        }

        return (data || []).map(row => {
            const d = new Date(row.fecha_hora);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        });
    },

    /**
     * Get all bookings (for admin)
     */
    async getAllBookings(): Promise<Booking[]> {
        if (!supabase) {
            return [...mockBookings].sort((a, b) =>
                new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
            );
        }

        const { data, error } = await supabase
            .from('reservas')
            .select(`
        id,
        fecha_hora,
        estado,
        origen,
        cliente:clientes(celular, nombre_completo, ranking),
        barbero:barberos(id, nombre, foto_url, bio_corta, activo, sucursal_id),
        servicio:servicios(id, nombre, precio, duracion_min, descripcion),
        sucursal:sucursales(id, nombre, direccion, mapa_url)
      `)
            .order('fecha_hora', { ascending: false });

        if (error) {
            console.error('Error fetching bookings:', error);
            return mockBookings;
        }

        return (data || []).map(row => ({
            id: row.id,
            fecha_hora: new Date(row.fecha_hora),
            estado: row.estado as BookingStatus,
            origen: row.origen as Booking['origen'],
            cliente: row.cliente as unknown as Client,
            barbero: {
                ...row.barbero as any,
                sucursalId: (row.barbero as any)?.sucursal_id || '',
            },
            servicio: row.servicio as unknown as Service,
            sucursal: {
                ...row.sucursal as any,
                horario_apertura: 9,
                horario_cierre: 21,
                estado_actual: 'auto',
            },
        }));
    },

    /**
     * Update booking status
     */
    async updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
        if (!supabase) {
            const booking = mockBookings.find(b => b.id === id);
            if (booking) booking.estado = status;
            return;
        }

        const { error } = await supabase
            .from('reservas')
            .update({ estado: status })
            .eq('id', id);

        if (error) {
            console.error('Error updating booking status:', error);
        }
    },

    /**
     * Update booking details
     */
    async updateBookingDetails(
        id: string,
        data: { fecha_hora: Date; servicio_id: string; barbero_id: string; estado?: BookingStatus }
    ): Promise<void> {
        if (!supabase) {
            const index = mockBookings.findIndex(b => b.id === id);
            if (index !== -1) {
                const services = await catalogRepository.getServices();
                const barbers = await catalogRepository.getBarbers();
                mockBookings[index] = {
                    ...mockBookings[index],
                    fecha_hora: data.fecha_hora,
                    servicio: services.find(s => s.id === data.servicio_id) || mockBookings[index].servicio,
                    barbero: barbers.find(b => b.id === data.barbero_id) || mockBookings[index].barbero,
                    estado: data.estado || mockBookings[index].estado,
                };
            }
            return;
        }

        const { error } = await supabase
            .from('reservas')
            .update({
                fecha_hora: data.fecha_hora.toISOString(),
                servicio_id: data.servicio_id,
                barbero_id: data.barbero_id,
                ...(data.estado && { estado: data.estado }),
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating booking:', error);
        }
    },

    /**
     * Delete booking
     */
    async deleteBooking(id: string): Promise<void> {
        if (!supabase) {
            mockBookings = mockBookings.filter(b => b.id !== id);
            return;
        }

        const { error } = await supabase
            .from('reservas')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting booking:', error);
        }
    },
};
