import { cacheService } from './services/cache';
import { catalogService } from './services/catalog';
import { clientService } from './services/client';
import { bookingService } from './services/booking';
import { CreateBookingPayload } from './services/booking';
import { BranchStatus, BookingStatus } from '../types';

/**
 * PRODUCTION DATABASE SERVICE
 * Connects to the real Supabase backend.
 * Re-exports domain services for improved maintainability.
 */

export const supabaseApi = {
    // --- CACHING UTILS ---
    _getCache: cacheService.get,
    _setCache: cacheService.set,

    // --- BRANCHES ---
    getBranches: catalogService.getBranches,
    updateBranchStatus: catalogService.updateBranchStatus,

    // --- SERVICES ---
    getServices: catalogService.getServices,

    // --- BARBERS ---
    getBarbers: catalogService.getBarbers,

    // --- CLIENTS ---
    checkClientByPhone: clientService.checkClientByPhone,
    createClient: clientService.createClient,
    searchClientsByName: clientService.searchClientsByName,
    updateClientPhone: clientService.updateClientPhone,
    updateClient: clientService.updateClient,

    // --- BOOKINGS ---
    createBooking: (bookingData: any) => bookingService.createBooking(bookingData as CreateBookingPayload),
    getTakenSlots: bookingService.getTakenSlots,

    // --- ADMIN ---
    getBookings: bookingService.getBookings,
    updateBookingStatus: bookingService.updateBookingStatus,
    updateBookingDetails: bookingService.updateBookingDetails,
    markBookingsAsPaid: bookingService.markBookingsAsPaid, // Add this
    deleteBooking: bookingService.deleteBooking,
    subscribeToBookings: bookingService.subscribeToBookings
};
