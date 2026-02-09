import { Barber, Service, Client, ClientRanking, Branch, Booking, BookingStatus, BranchStatus } from '../types';

/**
 * MOCK DATABASE SERVICE
 */

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
  { id: '1', nombre: 'Andy', bio_corta: 'Master Barber', activo: true, foto_url: 'https://picsum.photos/200/200?random=1', sucursalId: 'b1' },
  { id: '2', nombre: 'Mateo', bio_corta: 'Fade Specialist', activo: true, foto_url: 'https://picsum.photos/200/200?random=2', sucursalId: 'b1' },
  { id: '3', nombre: 'Leo', bio_corta: 'Beard Expert', activo: true, foto_url: 'https://picsum.photos/200/200?random=3', sucursalId: 'b2' },
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

// Simula la tabla de clientes en memoria (Ahora con formato internacional para coincidir con el frontend)
let MOCK_CLIENTS: Record<string, Client> = {
  '+525512345678': { celular: '+525512345678', nombre_completo: 'Juan Pérez', ranking: ClientRanking.FRECUENTE },
  '+59170012345': { celular: '+59170012345', nombre_completo: 'Carlos Mesa', ranking: ClientRanking.VIP },
  '+59170099887': { celular: '+59170099887', nombre_completo: 'Luis Arce', ranking: ClientRanking.NUEVO },
  '+59170055555': { celular: '+59170055555', nombre_completo: 'Evo M.', ranking: ClientRanking.FRECUENTE },
  '+59170011122': { celular: '+59170011122', nombre_completo: 'Tuto Q.', ranking: ClientRanking.NUEVO }
};

// SEED DATA: Reservas iniciales para el Admin Panel
const TODAY = new Date();

// GENERATE RANDOM BOOKINGS FOR CURRENT WEEK
const MOCK_BOOKINGS: Booking[] = [];

// Helper to create date
const createDate = (dayOffset: number, hour: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// INITIAL SEEDING
const seedInitialData = () => {
  MOCK_BOOKINGS.push(
    { id: 'b1', fecha_hora: createDate(-TODAY.getDay() + 1, 9), estado: BookingStatus.COMPLETADO, cliente: MOCK_CLIENTS['+525512345678'], barbero: MOCK_BARBERS[0], servicio: MOCK_SERVICES[0], sucursal: MOCK_BRANCHES[0], origen: 'guest' },
    { id: 'b2', fecha_hora: createDate(-TODAY.getDay() + 1, 10), estado: BookingStatus.COMPLETADO, cliente: MOCK_CLIENTS['+59170012345'], barbero: MOCK_BARBERS[0], servicio: MOCK_SERVICES[1], sucursal: MOCK_BRANCHES[0], origen: 'guest' },
    { id: 'b3', fecha_hora: createDate(-TODAY.getDay() + 1, 14), estado: BookingStatus.COMPLETADO, cliente: MOCK_CLIENTS['+59170099887'], barbero: MOCK_BARBERS[1], servicio: MOCK_SERVICES[2], sucursal: MOCK_BRANCHES[0], origen: 'google' },
    { id: 'b4', fecha_hora: createDate(-TODAY.getDay() + 2, 11), estado: BookingStatus.COMPLETADO, cliente: MOCK_CLIENTS['+59170055555'], barbero: MOCK_BARBERS[2], servicio: MOCK_SERVICES[3], sucursal: MOCK_BRANCHES[1], origen: 'guest' },
    { id: 'b5', fecha_hora: createDate(-TODAY.getDay() + 2, 16), estado: BookingStatus.NO_SHOW, cliente: MOCK_CLIENTS['+59170011122'], barbero: MOCK_BARBERS[2], servicio: MOCK_SERVICES[0], sucursal: MOCK_BRANCHES[1], origen: 'walkin' }
  );
};

// PERSISTENCE HELPERS
const syncToStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('MOCK_CLIENTS', JSON.stringify(MOCK_CLIENTS));
    localStorage.setItem('MOCK_BOOKINGS', JSON.stringify(MOCK_BOOKINGS));
  }
};

const loadFromStorage = () => {
  if (typeof window !== 'undefined') {
    const clients = localStorage.getItem('MOCK_CLIENTS');
    const bookings = localStorage.getItem('MOCK_BOOKINGS');

    if (clients) {
      MOCK_CLIENTS = JSON.parse(clients);
    }

    if (bookings) {
      const parsedBookings = JSON.parse(bookings);
      MOCK_BOOKINGS.length = 0;
      parsedBookings.forEach((b: any) => {
        MOCK_BOOKINGS.push({
          ...b,
          fecha_hora: new Date(b.fecha_hora)
        });
      });
    } else {
      seedInitialData();
      syncToStorage();
    }
  } else {
    seedInitialData();
  }
};

// Load initial data
loadFromStorage();

// Listen for changes in other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'MOCK_CLIENTS' || e.key === 'MOCK_BOOKINGS') {
      loadFromStorage();
    }
  });
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const supabaseApi = {
  getBranches: async (): Promise<Branch[]> => {
    await delay(300);
    return [...MOCK_BRANCHES]; // Return copy to ensure reactivity if mutated elsewhere (though here we mutate constant)
  },

  updateBranchStatus: async (branchId: string, status: BranchStatus): Promise<void> => {
    await delay(200);
    const branch = MOCK_BRANCHES.find(b => b.id === branchId);
    if (branch) {
      branch.estado_actual = status;
      syncToStorage();
    }
  },

  getServices: async (): Promise<Service[]> => {
    await delay(300);
    return MOCK_SERVICES;
  },

  getBarbers: async (branchId?: string): Promise<Barber[]> => {
    await delay(300);
    if (branchId) {
      return MOCK_BARBERS.filter(b => b.sucursalId === branchId);
    }
    return MOCK_BARBERS;
  },

  checkClientByPhone: async (phone: string): Promise<Client | null> => {
    await delay(300);
    // 1. Direct Lookup
    if (MOCK_CLIENTS[phone]) return MOCK_CLIENTS[phone];

    // 2. Fuzzy/Suffix Lookup (useful for Admin who types local number without country code)
    const cleanInput = phone.replace(/\D/g, '');
    if (cleanInput.length < 4) return null; // Avoid match on very short inputs

    const found = Object.values(MOCK_CLIENTS).find(c => {
      const cleanStored = c.celular.replace(/\D/g, '');
      return cleanStored.endsWith(cleanInput);
    });

    return found || null;
  },

  createClient: async (phone: string, name: string): Promise<Client> => {
    await delay(300);
    const newClient: Client = {
      celular: phone,
      nombre_completo: name,
      ranking: ClientRanking.NUEVO
    };
    MOCK_CLIENTS[phone] = newClient;
    syncToStorage();
    return newClient;
  },

  searchClientsByName: async (name: string): Promise<Client[]> => {
    await delay(300);
    const searchLow = name.toLowerCase();
    return Object.values(MOCK_CLIENTS).filter(c =>
      c.nombre_completo.toLowerCase().includes(searchLow)
    );
  },

  updateClientPhone: async (oldPhone: string, newPhone: string): Promise<void> => {
    await delay(300);
    const client = MOCK_CLIENTS[oldPhone];
    if (client) {
      // Create new entry
      MOCK_CLIENTS[newPhone] = { ...client, celular: newPhone };
      // Delete old entry
      delete MOCK_CLIENTS[oldPhone];

      // Update all existing bookings for this client (mock relational integrity)
      MOCK_BOOKINGS.forEach(b => {
        if (b.cliente.celular === oldPhone) {
          b.cliente = MOCK_CLIENTS[newPhone];
        }
      });
      syncToStorage();
    }
  },

  updateClient: async (phone: string, updates: Partial<Client>): Promise<Client> => {
    await delay(300);
    const client = MOCK_CLIENTS[phone];
    if (client) {
      // Update the client object in MOCK_CLIENTS
      const updatedClient = { ...client, ...updates };
      MOCK_CLIENTS[phone] = updatedClient;

      // Update all existing bookings for this client to reflect changes (e.g., name change)
      MOCK_BOOKINGS.forEach(b => {
        if (b.cliente.celular === phone) {
          b.cliente = updatedClient;
        }
      });

      syncToStorage();
      return updatedClient;
    }
    throw new Error("Client not found");
  },

  createBooking: async (bookingData: any) => {
    await delay(800);

    let finalDate: Date;

    if (bookingData.time) {
      const [hours, minutes] = bookingData.time.split(':').map(Number);
      finalDate = new Date(bookingData.date);
      finalDate.setHours(hours, minutes, 0, 0);
    } else {
      finalDate = new Date(bookingData.date);
    }

    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      fecha_hora: finalDate,
      estado: bookingData.status || BookingStatus.PENDIENTE,
      cliente: MOCK_CLIENTS[bookingData.clientPhone],
      barbero: MOCK_BARBERS.find(b => b.id === bookingData.barberId) || MOCK_BARBERS[0],
      servicio: MOCK_SERVICES.find(s => s.id === bookingData.serviceId) || MOCK_SERVICES[0],
      sucursal: MOCK_BRANCHES.find(b => b.id === bookingData.branchId) || MOCK_BRANCHES[0],
      origen: bookingData.origin || 'guest'
    };

    MOCK_BOOKINGS.push(newBooking);
    syncToStorage();
    return { success: true, id: newBooking.id };
  },

  getTakenSlots: async (date: Date, barberId: string): Promise<string[]> => {
    await delay(400);

    // Filtramos las reservas existentes en MOCK_BOOKINGS para el barbero y fecha dados
    const taken = MOCK_BOOKINGS
      .filter(b => {
        // 1. Mismo Barbero
        if (b.barbero.id !== barberId) return false;

        // 2. Ignorar Cancelados
        if (b.estado === BookingStatus.CANCELADO) return false;

        // 3. Misma Fecha (Día, Mes, Año)
        const bDate = new Date(b.fecha_hora);
        const targetDate = new Date(date);
        return (
          bDate.getFullYear() === targetDate.getFullYear() &&
          bDate.getMonth() === targetDate.getMonth() &&
          bDate.getDate() === targetDate.getDate()
        );
      })
      .map(b => {
        // Convertir la hora de la reserva a formato "HH:mm"
        const d = new Date(b.fecha_hora);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      });

    return taken;
  },

  // --- ADMIN FUNCTIONS ---

  getAllBookings: async (): Promise<Booking[]> => {
    await delay(300);
    // Devolvemos una copia nueva del array para reactividad, pero el source of truth es MOCK_BOOKINGS
    return [...MOCK_BOOKINGS].sort((a, b) => b.fecha_hora.getTime() - a.fecha_hora.getTime());
  },

  updateBookingStatus: async (id: string, status: BookingStatus): Promise<void> => {
    await delay(200);
    const index = MOCK_BOOKINGS.findIndex(b => b.id === id);
    if (index !== -1) {
      // Mutación directa
      MOCK_BOOKINGS[index].estado = status;
      syncToStorage();
    }
  },

  updateBookingDetails: async (id: string, data: { date: Date, time: string, serviceId: string, barberId: string, branchId: string, status?: BookingStatus }) => {
    await delay(500);
    const index = MOCK_BOOKINGS.findIndex(b => b.id === id);
    if (index !== -1) {
      const booking = MOCK_BOOKINGS[index];
      const newService = MOCK_SERVICES.find(s => s.id === data.serviceId) || booking.servicio;
      const newBarber = MOCK_BARBERS.find(b => b.id === data.barberId) || booking.barbero;
      const newBranch = MOCK_BRANCHES.find(b => b.id === data.branchId) || booking.sucursal;

      const [hours, minutes] = data.time.split(':').map(Number);
      const newDate = new Date(data.date);
      newDate.setHours(hours, minutes);

      MOCK_BOOKINGS[index] = {
        ...booking,
        fecha_hora: newDate,
        servicio: newService,
        barbero: newBarber,
        sucursal: newBranch,
        estado: data.status || booking.estado
      };
      syncToStorage();
    }
  },

  deleteBooking: async (id: string): Promise<void> => {
    await delay(200);
    const index = MOCK_BOOKINGS.findIndex(b => b.id === id);
    if (index !== -1) {
      // Usamos splice para borrar físicamente el elemento del array
      MOCK_BOOKINGS.splice(index, 1);
      syncToStorage();
    }
  }
};