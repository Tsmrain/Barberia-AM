/**
 * Supabase Database Types
 * Generated from schema.sql
 */

export type ClientRanking = 'nuevo' | 'frecuente' | 'vip';
export type BookingStatus = 'pendiente' | 'confirmado' | 'cancelado' | 'completado' | 'no_show';
export type BranchStatus = 'auto' | 'abierto' | 'cerrado';

// Runtime constants for enum-like usage
export const BOOKING_STATUS = {
    PENDIENTE: 'pendiente' as BookingStatus,
    CONFIRMADO: 'confirmado' as BookingStatus,
    CANCELADO: 'cancelado' as BookingStatus,
    COMPLETADO: 'completado' as BookingStatus,
    NO_SHOW: 'no_show' as BookingStatus,
} as const;

export const CLIENT_RANKING = {
    NUEVO: 'nuevo' as ClientRanking,
    FRECUENTE: 'frecuente' as ClientRanking,
    VIP: 'vip' as ClientRanking,
} as const;

// Supabase Database Schema Types
export interface Database {
    public: {
        Tables: {
            sucursales: {
                Row: {
                    id: string;
                    nombre: string;
                    direccion: string;
                    mapa_url: string;
                    horario_apertura: number;
                    horario_cierre: number;
                    estado_actual: BranchStatus;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    nombre: string;
                    direccion: string;
                    mapa_url: string;
                    horario_apertura?: number;
                    horario_cierre?: number;
                    estado_actual?: BranchStatus;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    nombre?: string;
                    direccion?: string;
                    mapa_url?: string;
                    horario_apertura?: number;
                    horario_cierre?: number;
                    estado_actual?: BranchStatus;
                    created_at?: string;
                };
                Relationships: [];
            };
            barberos: {
                Row: {
                    id: string;
                    nombre: string;
                    foto_url: string | null;
                    bio_corta: string | null;
                    activo: boolean;
                    sucursal_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    nombre: string;
                    foto_url?: string | null;
                    bio_corta?: string | null;
                    activo?: boolean;
                    sucursal_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    nombre?: string;
                    foto_url?: string | null;
                    bio_corta?: string | null;
                    activo?: boolean;
                    sucursal_id?: string | null;
                    created_at?: string;
                };
                Relationships: [];
            };
            servicios: {
                Row: {
                    id: string;
                    nombre: string;
                    precio: number;
                    duracion_min: number;
                    descripcion: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    nombre: string;
                    precio: number;
                    duracion_min: number;
                    descripcion?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    nombre?: string;
                    precio?: number;
                    duracion_min?: number;
                    descripcion?: string | null;
                    created_at?: string;
                };
                Relationships: [];
            };
            clientes: {
                Row: {
                    celular: string;
                    nombre_completo: string;
                    ranking: ClientRanking;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    celular: string;
                    nombre_completo: string;
                    ranking?: ClientRanking;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    celular?: string;
                    nombre_completo?: string;
                    ranking?: ClientRanking;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            reservas: {
                Row: {
                    id: string;
                    fecha_hora: string;
                    estado: BookingStatus;
                    cliente_celular: string;
                    barbero_id: string;
                    servicio_id: string;
                    sucursal_id: string;
                    origen: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    fecha_hora: string;
                    estado?: BookingStatus;
                    cliente_celular: string;
                    barbero_id: string;
                    servicio_id: string;
                    sucursal_id: string;
                    origen?: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    fecha_hora?: string;
                    estado?: BookingStatus;
                    cliente_celular?: string;
                    barbero_id?: string;
                    servicio_id?: string;
                    sucursal_id?: string;
                    origen?: string;
                    created_at?: string;
                };
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: {
            client_ranking: ClientRanking;
            booking_status: BookingStatus;
            branch_status: BranchStatus;
        };
        CompositeTypes: Record<string, never>;
    };
}

// Mapped types for application use
export interface Branch {
    id: string;
    nombre: string;
    direccion: string;
    mapa_url: string;
    horario_apertura: number;
    horario_cierre: number;
    estado_actual: BranchStatus;
}

export interface Barber {
    id: string;
    nombre: string;
    foto_url: string;
    bio_corta: string;
    activo: boolean;
    sucursalId: string;
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
