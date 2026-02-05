/**
 * Booking Service
 * Business logic layer - orchestrates repositories
 * High cohesion: Only booking-related business logic
 */

import { catalogRepository, bookingRepository } from '../repositories';
import type { Branch, Barber, Service, Client, Booking, BookingStatus, BranchStatus } from '../supabase/types';

export const bookingService = {
    // ==================== CATALOG OPERATIONS ====================

    async getBranches(): Promise<Branch[]> {
        return catalogRepository.getBranches();
    },

    async getServices(): Promise<Service[]> {
        return catalogRepository.getServices();
    },

    async getBarbers(branchId?: string): Promise<Barber[]> {
        return catalogRepository.getBarbers(branchId);
    },

    async updateBranchStatus(branchId: string, status: BranchStatus): Promise<void> {
        return catalogRepository.updateBranchStatus(branchId, status);
    },

    // ==================== CLIENT OPERATIONS ====================

    async checkClientByPhone(phone: string): Promise<Client | null> {
        return bookingRepository.getClientByPhone(phone);
    },

    async createClient(phone: string, name: string): Promise<Client> {
        return bookingRepository.createClient(phone, name);
    },

    // ==================== BOOKING OPERATIONS ====================

    async getTakenSlots(date: Date, barberId: string): Promise<string[]> {
        return bookingRepository.getTakenSlots(date, barberId);
    },

    async createBooking(data: {
        date: Date;
        time: string;
        clientPhone: string;
        barberId: string;
        serviceId: string;
        branchId: string;
        origin?: string;
        status?: BookingStatus;
    }): Promise<{ success: boolean; id: string }> {
        // Build fecha_hora from date + time
        const [hours, minutes] = data.time.split(':').map(Number);
        const fechaHora = new Date(data.date);
        fechaHora.setHours(hours, minutes, 0, 0);

        return bookingRepository.createBooking({
            fecha_hora: fechaHora,
            cliente_celular: data.clientPhone,
            barbero_id: data.barberId,
            servicio_id: data.serviceId,
            sucursal_id: data.branchId,
            origen: data.origin,
        });
    },

    // ==================== ADMIN OPERATIONS ====================

    async getAllBookings(): Promise<Booking[]> {
        return bookingRepository.getAllBookings();
    },

    async updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
        return bookingRepository.updateBookingStatus(id, status);
    },

    async updateBookingDetails(
        id: string,
        data: { date: Date; time: string; serviceId: string; barberId: string; status?: BookingStatus }
    ): Promise<void> {
        const [hours, minutes] = data.time.split(':').map(Number);
        const fechaHora = new Date(data.date);
        fechaHora.setHours(hours, minutes, 0, 0);

        return bookingRepository.updateBookingDetails(id, {
            fecha_hora: fechaHora,
            servicio_id: data.serviceId,
            barbero_id: data.barberId,
            estado: data.status,
        });
    },

    async deleteBooking(id: string): Promise<void> {
        return bookingRepository.deleteBooking(id);
    },
};
