import { Barber, Service, Client, ClientRanking, Branch, Booking, BookingStatus } from '../types';

/**
 * MOCK DATABASE SERVICE
 */

const MOCK_BRANCHES: Branch[] = [
  { 
    id: 'b1', 
    nombre: '4to Anillo', 
    direccion: 'Doble Vía La Guardia, 4to Anillo', 
    mapa_url: 'https://maps.app.goo.gl/8ZKBwRkcTMpETbhj8' 
  },
  { 
    id: 'b2', 
    nombre: '6to Anillo', 
    direccion: 'Doble Vía La Guardia, 6to Anillo', 
    mapa_url: 'https://maps.app.goo.gl/fabTd3WcxFJtjbMB7' 
  }
];

const MOCK_BARBERS: Barber[] = [
  { id: '1', nombre: 'Andy', bio_corta: 'Master Barber', activo: true, foto_url: 'https://picsum.photos/200/200?random=1' },
  { id: '2', nombre: 'Mateo', bio_corta: 'Fade Specialist', activo: true, foto_url: 'https://picsum.photos/200/200?random=2' },
  { id: '3', nombre: 'Leo', bio_corta: 'Beard Expert', activo: true, foto_url: 'https://picsum.photos/200/200?random=3' },
];

const MOCK_SERVICES: Service[] = [
  { id: 's1', nombre: 'Corte Clásico', precio: 60, duracion_min: 60, descripcion: 'Corte tradicional con técnica de tijera y acabado pulido.' },
  { id: 's2', nombre: 'Corte + Lavado', precio: 80, duracion_min: 60, descripcion: 'Corte de cabello con lavado refrescante incluido.' },
  { id: 's3', nombre: 'Arreglo Completo de Barba', precio: 35, duracion_min: 60, descripcion: 'Perfilado, rebajado y tratamiento para la piel.' },
  { id: 's4', nombre: 'Solo Perfilado de Barba', precio: 20, duracion_min: 60, descripcion: 'Definición de líneas y contornos de la barba.' },
  { id: 's5', nombre: 'Diseño y Limpieza de Cejas', precio: 20, duracion_min: 60, descripcion: 'Diseño acorde a la morfología de tu rostro.' },
  { id: 's6', nombre: 'Limpieza Facial Fresh', precio: 90, duracion_min: 60, descripcion: 'Exfoliación profunda, vapor y mascarilla hidratante.' },
  { id: 's7', nombre: 'Plan BÁSICO', precio: 90, duracion_min: 60, descripcion: 'Asesoramiento + Corte + Lavado (antes y después) + Perfilado de Cejas.' },
  { id: 's8', nombre: 'Plan Premium', precio: 110, duracion_min: 60, descripcion: 'Asesoramiento + Corte + Lavado (antes y después) + Arreglo de barba completa.' },
  { id: 's9', nombre: 'Plan VIP', precio: 130, duracion_min: 60, descripcion: 'Asesoramiento + Corte + Lavado (antes y después) + Arreglo de barba completa + Perfilado de Cejas.' },
];

// Simula la tabla de clientes en memoria
let MOCK_CLIENTS: Record<string, Client> = {
  '5512345678': { celular: '5512345678', nombre_completo: 'Juan Pérez', ranking: ClientRanking.FRECUENTE }
};

// SEED DATA: Reservas iniciales para el Admin Panel
const TODAY = new Date();
const YESTERDAY = new Date(TODAY); YESTERDAY.setDate(YESTERDAY.getDate() - 1);
const TOMORROW = new Date(TODAY); TOMORROW.setDate(TOMORROW.getDate() + 1);

let MOCK_BOOKINGS: Booking[] = [
  {
    id: 'bk_1',
    fecha_hora: YESTERDAY,
    estado: BookingStatus.COMPLETADO,
    cliente: { celular: '70012345', nombre_completo: 'Carlos Mesa', ranking: ClientRanking.VIP },
    barbero: MOCK_BARBERS[0], // Andy
    servicio: MOCK_SERVICES[8], // VIP (130bs)
    sucursal: MOCK_BRANCHES[0],
    origen: 'guest'
  },
  {
    id: 'bk_2',
    fecha_hora: YESTERDAY,
    estado: BookingStatus.COMPLETADO,
    cliente: { celular: '70099887', nombre_completo: 'Luis Arce', ranking: ClientRanking.NUEVO },
    barbero: MOCK_BARBERS[1], // Mateo
    servicio: MOCK_SERVICES[0], // Corte (60bs)
    sucursal: MOCK_BRANCHES[0],
    origen: 'google'
  },
  {
    id: 'bk_3',
    fecha_hora: TODAY,
    estado: BookingStatus.PENDIENTE,
    cliente: { celular: '70055555', nombre_completo: 'Evo M.', ranking: ClientRanking.FRECUENTE },
    barbero: MOCK_BARBERS[2], // Leo
    servicio: MOCK_SERVICES[2], // Barba (35bs)
    sucursal: MOCK_BRANCHES[1],
    origen: 'guest'
  },
  {
    id: 'bk_4',
    fecha_hora: TODAY,
    estado: BookingStatus.CONFIRMADO,
    cliente: { celular: '70011122', nombre_completo: 'Tuto Q.', ranking: ClientRanking.NUEVO },
    barbero: MOCK_BARBERS[0], // Andy
    servicio: MOCK_SERVICES[7], // Premium (110bs)
    sucursal: MOCK_BRANCHES[1],
    origen: 'guest'
  },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const supabaseApi = {
  getBranches: async (): Promise<Branch[]> => {
    await delay(300);
    return MOCK_BRANCHES;
  },

  getServices: async (): Promise<Service[]> => {
    await delay(300);
    return MOCK_SERVICES;
  },

  getBarbers: async (): Promise<Barber[]> => {
    await delay(300);
    return MOCK_BARBERS;
  },

  checkClientByPhone: async (phone: string): Promise<Client | null> => {
    await delay(500);
    return MOCK_CLIENTS[phone] || null;
  },

  createClient: async (phone: string, name: string): Promise<Client> => {
    await delay(300);
    const newClient: Client = {
      celular: phone,
      nombre_completo: name,
      ranking: ClientRanking.NUEVO
    };
    MOCK_CLIENTS[phone] = newClient;
    return newClient;
  },

  createBooking: async (bookingData: any) => {
    await delay(1000);
    
    // Support for flexible params (admin/walkin) or flow params
    const date = bookingData.date instanceof Date ? bookingData.date : new Date(bookingData.date);
    if (bookingData.time) {
        const [hours, minutes] = bookingData.time.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
    }

    const newBooking: Booking = {
        id: Math.random().toString(36).substr(2, 9),
        fecha_hora: date,
        estado: bookingData.status || BookingStatus.PENDIENTE,
        cliente: MOCK_CLIENTS[bookingData.clientPhone],
        barbero: MOCK_BARBERS.find(b => b.id === bookingData.barberId) || MOCK_BARBERS[0],
        servicio: MOCK_SERVICES.find(s => s.id === bookingData.serviceId) || MOCK_SERVICES[0],
        sucursal: MOCK_BRANCHES.find(b => b.id === bookingData.branchId) || MOCK_BRANCHES[0],
        origen: bookingData.origin || 'guest'
    };
    MOCK_BOOKINGS.push(newBooking);
    return { success: true, id: newBooking.id };
  },

  // Simula obtener horarios ocupados para un barbero en una fecha específica
  getTakenSlots: async (date: Date, barberId: string): Promise<string[]> => {
    await delay(400); 
    const day = date.getDate();
    if (day % 2 === 0) {
        return ['10:00', '14:00', '16:00', '19:00'];
    } else {
        return ['09:00', '11:00', '15:00', '20:00'];
    }
  },

  // --- ADMIN FUNCTIONS ---

  getAllBookings: async (): Promise<Booking[]> => {
    await delay(500);
    // Ordenar por fecha descendente
    return [...MOCK_BOOKINGS].sort((a, b) => b.fecha_hora.getTime() - a.fecha_hora.getTime());
  },

  updateBookingStatus: async (id: string, status: BookingStatus): Promise<void> => {
    await delay(300);
    const index = MOCK_BOOKINGS.findIndex(b => b.id === id);
    if (index !== -1) {
        MOCK_BOOKINGS[index].estado = status;
    }
  },

  updateBookingDetails: async (id: string, data: { date: Date, time: string, serviceId: string, barberId: string }) => {
    await delay(800);
    const index = MOCK_BOOKINGS.findIndex(b => b.id === id);
    if (index !== -1) {
      const booking = MOCK_BOOKINGS[index];
      const newService = MOCK_SERVICES.find(s => s.id === data.serviceId) || booking.servicio;
      const newBarber = MOCK_BARBERS.find(b => b.id === data.barberId) || booking.barbero;
      
      // Update date object with new time
      const [hours, minutes] = data.time.split(':').map(Number);
      const newDate = new Date(data.date);
      newDate.setHours(hours, minutes);

      MOCK_BOOKINGS[index] = {
        ...booking,
        fecha_hora: newDate,
        servicio: newService,
        barbero: newBarber
      };
    }
  },

  deleteBooking: async (id: string): Promise<void> => {
    await delay(300);
    MOCK_BOOKINGS = MOCK_BOOKINGS.filter(b => b.id !== id);
  }
};