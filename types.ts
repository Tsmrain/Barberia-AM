export enum ClientRanking {
  NUEVO = 'nuevo',
  FRECUENTE = 'frecuente',
  VIP = 'vip'
}

export enum BookingStatus {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
  COMPLETADO = 'completado',
  NO_SHOW = 'no_show'
}

export type BranchStatus = 'auto' | 'abierto' | 'cerrado';

export interface Branch {
  id: string;
  nombre: string;
  direccion: string;
  mapa_url: string;
  horario_apertura: number; // Hora militar (ej: 9)
  horario_cierre: number;   // Hora militar (ej: 21)
  estado_actual: BranchStatus;
}

export interface Barber {
  id: string;
  nombre: string;
  foto_url: string;
  bio_corta: string;
  activo: boolean;
  sucursalId: string; // Link to Branch
}

export interface Service {
  id: string;
  nombre: string;
  precio: number;
  duracion_min: number;
  descripcion: string;
}

export interface Client {
  celular: string;
  nombre_completo: string;
  ranking: ClientRanking;
}

export interface Booking {
  id: string;
  fecha_hora: Date;
  estado: BookingStatus;
  cliente: Client;
  barbero: Barber;
  servicio: Service;
  sucursal: Branch;
  origen: 'guest' | 'google' | 'walkin' | 'admin';
}